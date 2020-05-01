---
title: Spring post
description: Here we will write about the backend end framework, Spring. 
published: true
date: 2020-04-10
author: Bassem 
slug: eng_spring_spring posts
photo: assets/stock/springLogo.png
imgCredit: spring.io
keywords:
  - spring
language: en
output:
  html_document:
    css: post-details.component.css
---

## Spring
Under this tag, i  will write about the backend end framework, Spring. 
Meanwhile you can go the [official docs](https://spring.io/projects/spring-boot#learn), to dive in. 

```java
@SpringBootApplication
@RestController
public class DemoApplication {

@GetMapping("/helloworld")
public String hello() {
return "Hello World!";
  }
} 
```

