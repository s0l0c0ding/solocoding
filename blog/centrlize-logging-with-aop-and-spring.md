---
published: true
title: Centralized logging using aspect oriented programming and spring
description: In this article, we are going to examine how we can use aspect programming to centralize logs ...
date: 2021-03-21
author: Bassem
slug: eng_spring_centrlize_logging_with_aop
photo: assets/stock/aop.webp
imgCredit:
keywords:
  - spring
  - programming
language: en
tweetId: '1373740886669033474'
output:
  html_document:
    css: post-details.component.css
---
In this article, we are going to examine how we can use aspect oriented programming to centralize logs, instead of having to initialise the logger in each class of our project.
<br>
<br>
From the [spring site](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#aop) we can find a really simple definition of AOP:
<br>
_"Aspect-oriented Programming (AOP) complements Object-oriented Programming (OOP) by providing another way of thinking about program structure. The key unit of modularity in OOP is the class, whereas in AOP the unit of modularity is the aspect."_
<br>
An aspect can be for example logging, transaction, etc.

### What are we going to build?

We will build a component to be used for logging at the controller level, in particularly we are going to log each request, response and any exception raised during the execution of any endpoint (worth mentioning, if you want to log only the response and request of endpoints, it's recommended to use Spring AbstractRequestLoggingFilter).

### Some terminology and annotations

Before we jump into the code we need to grasp some definitions and annotations:

1. Aspect, it's the concern that cuts across multiple classes can be for example, transaction management. The `@Aspect` annotation must be placed on the class to declare an aspect also we need to annotate the class with `@Component` annotation to register it for autodetection;

2. Join point, is any point in our program such as method execution, exception handling, etc.;

3. Advice, the appropriate action to be taken by an aspect at a particular join point. The advice can be :

- `@Before`, executed before a join point;

- `@AfterReturning`, executed after a joint point completes normally;

- `@AfterThrowing`, executed when a matched method exits by throwing an exception;

- there are many others like  `@After`, `@Around` see the complete list [here](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#aop-advice).

4. Pointcut, it's an expression to match the 'Advise' with the needed 'Join point'. There are many expressions that can be used, for example: execution(to match the method execution), within(to limit the types), this(specific type) and the list go on, you can check it [here](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#aop-pointcuts-designators);

5. Target object, an object being advised by one or more aspects. It is also known as proxied object in spring because Spring AOP is implemented using runtime proxies;

6. AOP proxy, an object created by the AOP framework in order to achieve the aspect contracts;

7. Weaving, the process of linking aspects with other application types or objects to create an advised object.

### Code example

Frist of all, you need to add the Aspect starter into the pom.xml:

```xml
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-aop</artifactId>
</dependency>
```

And here is an example of the logging class:

```java
@Aspect
@Component
@Log4j2
public class LoggerComponent {

    private static final String POINTCUT = "within(dev.solocoding.aop.controllers.*)";
    
    @Around(POINTCUT)
    @SneakyThrows
    public Object logArroundExec(ProceedingJoinPoint pjp) {
        log.info("before {}", constructLogMsg(pjp));
        var proceed = pjp.proceed();
        log.info("after {} wiht result: {}",constructLogMsg(pjp), proceed.toString());
        return proceed;
    }

    @AfterThrowing(pointcut = POINTCUT, throwing = "e")
    public void logAfterException(JoinPoint jp, Exception e) {
        log.error("Exception during: {} with ex: {}", constructLogMsg(jp),  e.toString());
    }

    private String constructLogMsg(JoinPoint jp) {
        var args = Arrays.asList(jp.getArgs()).stream().map(String::valueOf).collect(Collectors.joining(",", "[", "]"));
        Method method = ((MethodSignature) jp.getSignature()).getMethod();
        var sb = new StringBuilder("@");
        sb.append(method.getName());
        sb.append(":");
        sb.append(args);
        return sb.toString();
    }
}
```

Let's break it down:

```java
  private static final String POINTCUT = "within(dev.solocoding.aop.controllers.*)";
```

We defined our pointcut expression as String and we used the "within" keyword to log every method in the package `dev.solocoding.aop.controllers`.

```java
  @Around(POINTCUT)
  @SneakyThrows
  public Object logArroundExec(ProceedingJoinPoint pjp) {
      log.info("before {}", constructLogMsg(pjp));
      var proceed = pjp.proceed();
      log.info("after {} wiht result: {}",constructLogMsg(pjp), proceed.toString());
      return proceed;
  }
```

In the above peace of code, we defined our first advise with the type `@Around`, that's mean we can log before and after the method execution, in fact we used the `ProceedingJoinPoint.proceed()` method as divider between the before and the after actions.

```java
 @AfterThrowing(pointcut = POINTCUT, throwing = "e")
    public void logAfterException(JoinPoint jp, Exception e) {
        log.error("Exception during: {} with ex: {}", constructLogMsg(jp),  e.toString());
    }
```

With the logAfterException method we have created an `@AfterThrowing` advice, as always the method takes a `JoinPoint` object (a side note, the ProceedingJoinPoint extends the JoinPoint.) and the Exception thrown during the execution of the code. This advice will be invoked every time an exception occurs.

Now let's take a look at the controller code:

```java
@RestController
@RequestMapping("/")
public class PostController {
    
    @GetMapping("/{id}")
    public Post getPost(@PathVariable("id") Long id) {
        return new Post(id, "postTitle", "postBody");
    }

    @PostMapping
    public Post creatPost(@RequestBody Post post) {
        var id = new Random().nextLong();
        if(id%2 == 0) throw new RuntimeException("Wanted Exception");
        return new Post(id, post.getTitle(), post.getBody());
    }
}
```

It's a simple controller with two endpoints; in the post method, i am simulting random exceptions when the id is even (don't do it at home 😀). When we run the code executing some calls, we will have the following logs:

```markup
2021-03-20 19:14:19.848  INFO 18689 --- [nio-8080-exec-1] dev.solocoding.aop.log.LoggerComponent   : before @getPost:[1]

2021-03-20 19:14:19.866  INFO 18689 --- [nio-8080-exec-1] dev.solocoding.aop.log.LoggerComponent   : after @getPost:[1] wiht result: Post(id=1, title=postTitle, body=postBody)

2021-03-20 19:15:04.476  INFO 18689 --- [nio-8080-exec-7] dev.solocoding.aop.log.LoggerComponent   : before @creatPost:[Post(id=null, title=title, body=body)]

2021-03-20 19:15:04.477 ERROR 18689 --- [nio-8080-exec-7] dev.solocoding.aop.log.LoggerComponent   : Exception during: @creatPost:[Post(id=null, title=title, body=body)] with ex: java.lang.RuntimeException: Wanted Exception
2
021-03-20 19:15:04.485 ERROR 18689 --- [nio-8080-exec-7] o.a.c.c.C.[.[.[/].[dispatcherServlet]    : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed; nested exception is java.lang.RuntimeException: Wanted Exception] with root cause

java.lang.RuntimeException: Wanted Exception
at dev.solocoding.aop.controllers.PostController.getPost(PostController.java:26) ~[classes/:na]
PostController.java:26
.....

2021-03-20 19:47:37.991  INFO 20817 --- [nio-8080-exec-8] dev.solocoding.aop.log.LoggerComponent   : before @creatPost:[Post(id=null, title=title, body=body)]

2021-03-20 19:47:55.905  INFO 20817 --- [nio-8080-exec-8] dev.solocoding.aop.log.LoggerComponent   : after @creatPost:[Post(id=null, title=title, body=body)] wiht result: Post(id=6961871319773573993, title=title, body=body)

```

Note that we have the representation of the Post object, so the object itself must implement the toString() method.

That's it; all the code written in this post can be found on [GitHub](https://github.com/s0l0c0ding/spring-tips/tree/master/aop).
