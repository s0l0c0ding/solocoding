---
published: true
title: REST API Versioning using Spring, Kubernetes and Ambassador
description: In this post, we are building a versioned REST API, using Spring to create the api, Kubernetes as our deployment infrastructure ...
date: 2021-05-14
author: Bassem
slug: eng_rest_api_versioning_spring_kubernetes_ambassador
photo: assets/stock/apiversioning.webp
imgCredit:
keywords:
  - spring
  - devops
  - kubernetes
  - ambassador
  - programming
language: en
output:
  html_document:
    css: post-details.component.css
---
In this post, we are building a versioned REST API, using Spring to create the api, Kubernetes as our deployment infrastructure and Ambassador as gateway for handling all the routes.

### What are we going to build?

In this example, we'll create a rest endpoint with multiple versions: If we visit http://localhost:8080/v1/hello, we'll get 'Hello from v1', and when we hit http://localhost:9090/v2/hello, we'll get 'Hello from v2'. The code for all the versions will be contained in the same jar, and each instance of the application will serve a different version of the endpoint based on an environment variable on the host.

### Why do we need api versioning?

To manage correctly breaking changes in our REST API we need to introduce versioning, a breaking change can be for example:

1. a change in the response data format for one or more routes;

2. a modification to the request or response object;

3. removing any API endpoint.

Non-breaking changes, such as adding new endpoints or response parameters, do not necessitate a major version number change.

### Some Spring properties and annotations

In this section, we will look at the annotations and properties that will be used later in the code to achieve our goal:

In our application.properties file, we will add the property `server.servlet.context-path`, which will define the application's context path. If we put 'v1,' all endpoints will be prefixed with v1, as shown here: http://localhost:8080/v1/hello.

The second and final step is to add the `@ConditionalOnProperty` to our interface service implementation to allow the qualification of one implementation over another, based on the application properties.

### Code example

Let's do a top-down analysis, so in the code below you can find a simple controller that exposes a `Get` endpoint:

```java
@RestController
public class HelloController {
    
    private final HelloService helloService;
    
    public HelloController(HelloService helloService) {
        this.helloService = helloService;
    }

    @GetMapping("/hello")
    public  String sayHello(){
        return helloService.sayHello();
    }
}
```

And here is the service used:

```java
public interface HelloService {
    String sayHello();
}
```

For the implementation of the above service, we are going to have two variants. The first one will serve the v1 version while the second one will serve the v2.

```java
@Service
@ConditionalOnProperty(name = "server.servlet.context-path", havingValue = "/v1")
public class HelloServiceImplOne implements HelloService  {
    @Override
    public String sayHello() {
        return "Hello from v1";
    }
}
```

As you can see in the `@ConditionalOnProperty` we are using the `server.servlet.context-path` as condition to qualify or not the class for the Spring's context (dependency injection).

And here is the second implementation, using the same logic:

```java
@Service
@ConditionalOnProperty(name = "server.servlet.context-path", havingValue = "/v2")
public class HelloServiceImplTwo implements HelloService  {
    @Override
    public String sayHello() {
        return "Hello from v2";
    }
}
```

The last step is modifying the application properties as follow:

```markup
server.servlet.context-path=${API_VERSION:/v1}
```

The version will be obtained from an environment variable called 'API_VERSION', otherwise the value will be set to 'v1'.

### Testing with Docker

To try out what we have done so far, we are going to spin up two docker containers. The dockerfile for this build is available in the [GitHub](https://github.com/s0l0c0ding/spring-tips/tree/master/apiversioning). The v1 version will run on 8080 port and v2 on 9090. To launch the containers, we are going to use the following docker commands:

```bash
docker run --name apiV1 --env API_VERSION=/v1 -p 8080:8080 -d apiversioning
docker run --name apiV2 --env API_VERSION=/v2 -p 9090:8080 -d apiversioning
```

With the above command, we are creating a container with specific environment variables using the `--env` flag, mapping the application port 8080 to the host's port 9090 using the `-p` flag, the container will run in background as we use the `-d` flag, and we are using our local image 'apiversioning'.

Now if we visit http://localhost:8080/v1/hello, we'll get 'Hello from v1', and when we hit http://localhost:9090/v2/hello, we'll get 'Hello from v2'.

### Testing with Kubernetes and Ambassador

We will deploy the app to a Kubernetes cluster in this section. I used [MicroK8s](https://microk8s.io/docs) on my Ubuntu machine for this exercise.

First we start form the Deployment yml. "A [Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) provides declarative updates for Pods and ReplicaSets":

```yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: apiversioning
spec:
  selector:
    matchLabels:
      app: apiversioning
  replicas: 1
  template:
    metadata:
      labels:
        app: apiversioning
        version: v1
    spec:
      containers:
      - name: apiversioning
        image: apiversioning:latest
        imagePullPolicy: IfNotPresent
        resources:
          limits:
            memory: "128Mi"
            cpu: "500m"
        ports:
        - containerPort: 8080
        env:
          - name: API_VERSION
            value: /v1
```

It's a standard one, with some variations:

- I add `version: v1` to the labels section to facilitate the usage of selectors;

- Because I'm using the Microk8s local registry, I add `imagePullPolicy: IfNotPresent`. If this prop is not set, you must upload your image to a registry such as DockerHup, as MicroK8s will attempt to pull the image from this registry (configured as default). To load our local image into Microk8s registry, first we need to save the image in a tar file usig the `docker save` comand, then we import it using `microk8s ctr image import` as follow:

```bash
docker save apiversioning --output api.tar
microk8s ctr image import api.tar
```

- Finally we add the environment variables under the `env` section as key/value pair.

Secondly we define our service for intercommunication, a [service](https://kubernetes.io/docs/concepts/services-networking/service/) is "An abstract way to expose an application running on a set of Pods as a network service" :

```yml
apiVersion: v1
kind: Service
metadata:
  name: apiversioning
spec:
  selector:
    app: apiversioning
    version: v1
  ports:
  - port: 8080
    targetPort: 8080
```

Finally we define the mapping for Ambassador:

```yml
apiVersion: getambassador.io/v2
kind: Mapping
metadata:
  name: apiversioning
spec:
  prefix: /api-v1
  service: apiversioning:8080
```

The 'spec' part is the most important; the prefix indicates the arbitray route that we want to map to a specific kubernetes service. If you want to go into more details, you can do so by visiting the official documentation [here](https://www.getambassador.io/docs/edge-stack/latest/topics/using/intro-mappings/).

All these configurations must be done also for the v2 application, they will be the same, we have just to change the mentioned points so far.

If you don't have Ambassador enabled in your local Microk8s, you can do so, by executing this command:

```bash
microk8s enable ambassador
```

After applying the configurations, we can visit http://localhost/api-v1/v1/hello and http://localhost/api-v2/v2/hello and we will get the different messages as we done in the docker section.

### The devops way

Worth mentioning you can replace `the server.servlet.context-path` prop with a custom one, such as version, in this case all pre-routing work is transferred to Ambassador and Spring is only responsible for the beans. And we remove the 'v1' and 'v2' from the urls: http://localhost/api-v1/hello

That's it; all the code written in this post can be found on [GitHub](https://github.com/s0l0c0ding/spring-tips/tree/master/apiversioning).
