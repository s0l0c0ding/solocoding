---
published: true
title: Intercepting HTTP Requests in Quarkus
description: In this article, we are going to see how to intercept requests and responses using filters in Quarkus ...
date: 2021-07-21
author: Bassem
slug: eng_quarkus_intercept_requests
photo: assets/stock/filtersQuarkus.webp
imgCredit:
keywords:
  - quarkus
  - programming
  - java
language: en
output:
  html_document:
    css: post-details.component.css
---
In this article, we are going to see how to intercept requests and responses using filters in Quarkus. We will analyze how to implement them in traditional stack and in a reactive one.

### What are we going to build?

In this example, we'll create two rest endpoints, one using the traditional resteasy dependency and another one using web-vertex, in both cases we will build filers to be able to act on requests and responses. In particular, we are going to add headers to the response.

### Some Quakus interfaces and annotations

In this section, we will look at the annotations and interfaces that will be used later in the code to achieve our goal.

For the servelt container the interface `ContainerResponseFilter` is used to intercept the response and act on them before reaching the client. In case we want to deal with the request, we can implement the `ContainerRequestFilter`.

For the reactive context, we will use `@RouteFilter` annotation, which will be placed on a void method with a parameter of type `RoutingContext`. The method will contain the logic which will be applied to a certain route.

### Code example

First let's take a look at the controller level:

```java
@Path("/hello")
public class GreetingResource {
    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public String hello() {
        return "Hello QUARKUS";
    }
}
```

It's a simple endpoint which returns a string, if you need to return a json you will have to add a json library to your pom.xml, you can choose between RESTEasy Jackson dependency or RESTEasy JSON-B.

The second controller is a reactive one:

```java
@ApplicationScoped
public class GreetingRoute {
    @Route(path = "reactive", methods = HttpMethod.GET)
    public void reactive(RoutingContext ctx) {
        ctx.response().end("Hello Reactive QUARKUS");
    }
}
```

Also here, it's a get method which will return a string. We used the `@ApplicationScoped` CDI annotation which means that this bean will be lazily created.

Now we take a look at the Jax-Filter:

```java
@Provider
public class JaxFilter implements ContainerResponseFilter {
    @Override
    public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext)
            throws IOException {
        responseContext.getHeaders().add("X-Content-Type-Options", "nosniff");
    }
}
```

In this class we are implementing the `ContainerResponseFilter` interface. We override the `filter` method and within it we add a new header to each response. The `X-Content-Type-Options` with value `nosniff` it's a security header which will prevent a [MIME sniffing](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#mime_sniffing) attack.

This filter will not be applied to the reactive routes, only for the servlet ones.

The last filter, we are going to examine is the reactive one:

```java
public class VertexFilter {
    @RouteFilter
    void myFilter(RoutingContext rc) {
       rc.response().putHeader("X-Header", "Vertex header");
       rc.next(); 
    }
}
```

In this case there is no need to annotate the class with any CDI annotaion, Quarkus will pick the filter automatically as we are using the `@RouteFilter` annotaion. In this filter we are just adding a custom headr to the reponse.
This filter will be applied to all the endpoints in our application, traditional and reactive ones.

### Testing

Running the following test:

```java
@QuarkusTest
class GreetingResourceTest {
    @Test
    void testHelloEndpoint() {
        given()
          .when().get("/hello")
          .prettyPeek()
          .then()
             .statusCode(200)
             .header("X-Content-Type-Options", "nosniff");
    }
}
```

We will have the following output:

```log
HTTP/1.1 200 OK
X-Header: Vertex header
Content-Length: 13
X-Content-Type-Options: nosniff
Content-Type: text/plain;charset=UTF-8

Hello QUARKUS
```

As you can see the two filters have been applied and we have the two headers `X-Header` and `X-Content-Type-Options`.

Now running the second test:

```java
@QuarkusTest
class GreetingRouteTest {
    @Test
    void testHelloEndpoint() {
        given()
          .when().get("/reactive")
          .prettyPeek()
          .then()
             .statusCode(200)
             .header("X-Header", "Vertex header");
    }
}
```

And the response is the following:

```log
HTTP/1.1 200 OK
X-Header: Vertex header
content-length: 22

Hello Reactive QUARKUS
```

To be noted we have only `X-Header` header.

That's it; all the code written in this post can be found on [GitHub](https://github.com/s0l0c0ding/quarkus-tips/tree/main/filters-with-quarkus).
