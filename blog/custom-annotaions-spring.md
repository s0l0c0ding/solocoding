---
published: true
title: Custom annotations with Spring
description: In this post we are going to see the difference between @Repository, @Service, @Configuration, and @Controller annotations and how to make a custom one ...
date: 2022-06-06
author: Bassem
slug: eng_spring_custom_annotaions
photo: assets/stock/custom-annotation.webp
imgCredit:
keywords:
  - spring
  - programming
language: en
tweetId: '1534572232508317696'
output:
  html_document:
    css: post-details.component.css
---
In this post we are going to see the difference between `@Repository`, `@Service`, `@Configuration`, and `@Controller` annotations and how to make a custom one, so that our classes are initiated in the Spring IoC ([Inversion of Control](https://docs.spring.io/spring-framework/docs/3.2.x/spring-framework-reference/html/beans.html)) container as any class annotated with a such annotation.
<br>
By creating custom annotations for dependency injection, we can isolate our service layer (application core) from the framework used. If we want to migrate our application to another framework we just need to edit those annotations without touching our logic layer.
<br>
First of all, the above-mentioned annotation and the `@Component` one are common Spring bean annotations and used as stereotype for any Spring-managed component. The classes annotated will be autodetected through classpath scanning.
<br>

### What is the difference ?

Actually, there is no major difference between `@Repository`, `@Service`, `@Configuration`, and `@Controller`, all of them are annotated with `@Component`. You can see the code of `@Service` annotation in the following snippet:

```java
package org.springframework.stereotype;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.core.annotation.AliasFor;

@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Component
public @interface Service {

	@AliasFor(annotation = Component.class)
	String value() default "";

}
```

They are used to differentiate the layers:

- `@Service`, for business logic classes;

- `@Controller`, for representation layer;

- `@Configuration`, for any configuration ;

- `@Repository`, for data base access classes. One exception here, that Spring boot provide automatically a PersistenceExceptionTranslationPostProcessor (which is needed), making the class  eligible for Spring DataAccessException translation.

### What are we going to build?

We will build a custom service annotation called `@OurCustomService`, which will be used to annotate our service layer classes and make them eligible for IoC Spring container.

### Code example

First of all, in our pom.xml we just need the spring boot starter dependency:

```xml
<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter</artifactId>
</dependency>
```

Then we create our custom annotation:

```java
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.core.annotation.AliasFor;
import org.springframework.stereotype.Component;

@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Component
public @interface OurCustomService {
    
    @AliasFor(annotation = Component.class)
	String value() default "";
    
}
```

It's a copy of the `@Service` Spring annotation. Kindly note that the interface it self is annotated with `@Component`.
<br>

Then we create our service layer by creating an interface and its implementation. This last one is annotated with `@OurCustomService`:

```java
public interface DemoService {
    
    void print();
    
}
```

```java
@OurCustomService
public class DemoServiceImpl  implements DemoService {

    private static final Logger log = LoggerFactory.getLogger(DemoServiceImpl.class);

    @Override
    public void print() {
       log.info("""
               This Message is from:
                DemoService
               """); 
    }
    
}
```

Finally, we test our code in the main class, by searching the `ApplicationContext` for our bean `DemoServiceImpl`:

```java
@SpringBootApplication
public class CustomAnnotaionsApplication {

	public static void main(String[] args) {
		SpringApplication.run(CustomAnnotaionsApplication.class, args);
	}

	@Component
	class StartUp implements CommandLineRunner {

		@Autowired
		private ApplicationContext applicationContext;
		@Autowired
		private DemoService demo;

		private static final Logger log = LoggerFactory.getLogger(StartUp.class);

		
		@Override
		public void run(String... args) throws Exception {
			demo.print();
			log.info("""
					Found the custom service witn name: {} 
					""", List.of(applicationContext.getBeanNamesForType(DemoService.class)).stream().collect(Collectors.joining(" , ")));
			
		}

	}
}
```

When we run the application, we can find the invocation in the logs:

```markup
2022-06-04 18:25:40.930  INFO 51696 --- [           main] d.s.c.service.DemoServiceImpl            : This Message is from:
 DemoService

2022-06-04 18:25:40.931  INFO 51696 --- [           main] .s.c.CustomAnnotaionsApplication$StartUp : Found the custom service witn name: demoServiceImpl
```

That's it; all the code written in this post can be found on [GitHub](https://github.com/s0l0c0ding/spring-tips/tree/master/custom-annotaions).
