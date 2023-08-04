---
published: true
title: Blue-green deployment with Ambassador, Helm and kubernetes
description: In this post, we are building a Blue-green deployment release strategy using Ambassador, Helm and kubernetes.
date: 2023-08-04
author: Bassem
slug: eng_blue_green_helm_kubernetes_ambassador
photo: assets/stock/blue-green.webp
imgCredit:
keywords:
  - devops
  - helm
  - kubernetes
  - ambassador
  - programming
language: en
output:
  html_document:
    css: post-details.component.css
---
In this post, we are building a Blue-green deployment release strategy using Ambassador, Helm and kubernetes. First let's talk about this strategy; it is a release strategy that involves running two identical environments, one called blue and the other called green. The blue environment represents the current version of the application that is serving production traffic, while the green environment is a staging environment running a different version of the application. This allows organizations to minimize downtime and risk during the deployment process to enure a seamless transition between versions of an application.
<br>
<br>
In addition to Blue-green deployment, there are several other popular deployment strategies. One such strategy is Canary deployment, which involves rolling out new features or updates to a small subset of users before the full release, it provides a controlled and gradual approach to releasing new version. 
<br>
Another strategy is Rolling deployment, it involves updating an application by gradually replacing instances of the old version with instances of the new version. Each deployment strategy has its unique advantages, and in this blog post, we will explore Blue-green deployment.

### What are we going to build?
Our environment is composed of Ambassador, Helm, and Kubernetes creating a powerful deployment ecosystem. Ambassador acts as the gateway, enabling external access to services running within a Kubernetes cluster.
Helm simplifies application packaging and deployment, it allows us to define and package our applications as Helm charts, which are portable and reusable templates.
And finally Kubernetes provides the underlying orchestration platform. 
<br>
<br>
We are going to deploy a simple application called [api-route-tester](https://hub.docker.com/repository/docker/solocoding/api-route-tester/general), it has a http endpoint to test routes and internal communications. The application has two versions:

1. v1.0.0, it has `GET /env` which will give back the environment variable "VERSION";
2. v1.2.0, `GET /env/all`which gives back all the environment variables.
<br>
<br>
We will deploy the 1.0.0 as blue version and 1.2.0 as green. The diversion of the traffic will be done using Ambassador's [Header-based routing](https://www.getambassador.io/docs/edge-stack/latest/topics/using/headers/headers#header-based-routing), once we are satisfied with green version, it will be promoted by the Helm's [upgrade](https://helm.sh/docs/helm/helm_upgrade/) command or it can be removed. 

### Code example

Starting from the `values.yaml` we will add the following properties:
```yaml
deployment:
  green: 1.2.0
  blue: 1.0.0
```
With the above mentioned variables, we will be able to promote o rollback our deployment, by setting those variables with helm upgrade command.
<br>
<br>
Next we take a look at the `blue` deployment manifest:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ cat .Values.fullnameOverride "-v" .Values.deployment.blue | nospace | replace "." "" }}
  labels:
    {{- include "api-route-tester.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "api-route-tester.selectorLabels.blue" . | nindent 6 }}
## skipping some lines
```
We are changing the name of the deployment by adding the version, using helm functions [cat, nosapce and replace](https://helm.sh/docs/chart_template_guide/function_list/#cat).
<br>
<br>
In  the `green` deployment manifest, we are making the same changes but we added a condition:

```yaml
{{- if semverCompare (cat ">" .Values.deployment.blue) .Values.deployment.green -}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ cat .Values.fullnameOverride "-v" .Values.deployment.green | nospace | replace "." "" }}
  labels:
    {{- include "api-route-tester.labels" . | nindent 4 }}
## skipping some lines
```
Helm will process this file only when the version specified under `.Values.deployment.green` is greater than the one reported under `.Values.deployment.blue`.
<br>
This `if` statement will be applied to all the kubernetes resources related to the green the deployment. Here are the `service` and the `mapping` manifests: 

```yaml
{{- if semverCompare (cat ">" .Values.deployment.blue) .Values.deployment.green -}}
apiVersion: v1
kind: Service
metadata:
  name: {{ cat "api-route-tester" "-v" .Values.deployment.green | nospace | replace "." "" }}
  labels:
    {{- include "api-route-tester.labels" . | nindent 4 }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: http
      protocol: TCP
      name: http
  selector:
    {{- include "api-route-tester.selectorLabels.green" . | nindent 4 }}
    version: {{ cat "v" .Values.deployment.green | nospace | replace "." ""}}
{{ end }}
---
{{- if semverCompare (cat ">" .Values.deployment.blue) .Values.deployment.green -}}
apiVersion: getambassador.io/v2
kind: Mapping
metadata:
  name: {{ cat .Values.fullnameOverride "-v" .Values.deployment.green | nospace | replace "." "" }}
spec:
  prefix: {{ .Values.fullnameOverride | nospace }}
  service: {{ cat .Values.fullnameOverride "-v" .Values.deployment.green ":" .Values.service.port | nospace | replace "." "" }}
  headers:
    x-version: {{ cat "v" .Values.deployment.green | nospace | replace "." ""}}
{{- end }}
```
In the `service` file we are adding a new selector label `version: {{ cat "v" .Values.deployment.green | nospace | replace "." ""}}`, in this way the service will be attached to the green deployment. 
<br>
<br>
In the `mapping` file we introduced the parameter `headers`: 

```yml
  headers:
    x-version: {{ cat "v" .Values.deployment.green | nospace | replace "." ""}}
```
BY doing so, we are using [Header-based routing](https://www.getambassador.io/docs/edge-stack/latest/topics/using/headers/headers#header-based-routing), ambassador will forward the traffic to the green deployment only when the `x-version` header is present in the request, and we are be able to test the new version in the same environment, having both deployment running. 

### How to automate in CI/CD?
We can integrate the strategy described in the code section in our `CI/CD` pipeline by using the helm upgrade command and changing values of the green and the blue versions. In our deployment section we can play with following command:
```bash
helm upgrade api-route-tester ./   --set deployment.blue=1.0.0 --set deployment.green=1.2.0 --atomic --install
```
By executing the previous command we will have the two deployments up and running. Running the flowing curl with `x-version` header we hit the green deployment: 
```bash
curl  -X GET \
  'https://api-route-tester/env/all' \
  --header 'X-Version: v120'
```
if we remove the header we will face a 404 error as the `/all` endpoint is not present in version 1.0.0.
<br>
<br>
If we want to promote the green version we simply run the following:

```bash
helm upgrade api-route-tester ./   --set deployment.blue=1.2.0 --set deployment.green=1.2.0 --atomic --install
```
Executing the curl without the header we hit the only version available which is 1.2.0.
<br>
<br>
This will uninstall all the resources where we put the `if` statement:
```yml
{{- if semverCompare (cat ">" .Values.deployment.blue) .Values.deployment.green -}}
```
because simply the condition is not met anymore and the deployment version will be `1.2.0` accepting all the incoming traffic, as we removed the ambassador header-based routing.
<br>
<br>
If we want to downgrade to the blue version `1.0.0` we run the following:

```bash
helm upgrade api-route-tester ./   --set deployment.blue=1.0.0 --set deployment.green=1.0.0 --atomic --install
```

### Summary
Using Ambassador and Helm we were able to create a Blue-green deployment release strategy by changing only the variables of the helm `upgrade` command. We did not have tow separate environments, but this can be resolved, by having for example two separate name-spaces.
<br>
<br>

That's it; all the code written in this post can be found on [Gitlab](https://gitlab.com/s0l0coding/devops-tips/-/tree/main/blue-green).
