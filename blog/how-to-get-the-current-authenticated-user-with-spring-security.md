---
published: true
title: How to get the current authenticated user with spring security
description: In this post we are going to see, how to get the current authenticated user, in our spring project, using...
date: 2020-05-10
author: Bassem
slug: eng_spring_how-to-get-the-current-authenticated-user-with-spring-security
photo: assets/stock/AuthenticationPrincipal.webp
imgCredit: solocoding.dev
keywords:
  - spring
language: en
output:
  html_document:
    css: post-details.component.css
---

In this post we are going to see, how to get the current authenticated user, in our spring project, using two different methods; so let's start. 

If you would like to start from scratch, you can download the starting code base from [springInitializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.2.6.RELEASE&packaging=jar&jvmVersion=11&groupId=dev.solocoding&artifactId=authenticated&name=authenticated&description=spring-tips%20get%20current%20authenticated&packageName=dev.solocoding.authenticated&dependencies=security,web,lombok) (we will use security and web dependencies).  

So first thing, we create a UserController
 with two endpoints :
 ```java
@RestController
@RequestMapping("/user")
public class UserController {

    @GetMapping("/par")
    public String getCurrentUser() { // this method will have an input parameter
        return null;
    }

    @GetMapping("/context")
    public String getCurrentUserContext() {
        return null;
    }
}
```
As you can see, we dedicate an endpoint for every approach, we will use. With the first one, we will retrieve the user with an annotation to the input parameter of the used method; the second one as the signature suggests we will recover it form the SecurityContext. Before developing our code let's write some tests :  
```java
@WebMvcTest(controllers = UserController.class)
class AuthenticatedApplicationTests {

	@Autowired
	 private MockMvc mockMvc;

	 private final String  parUrl = "/user/par";
	 private final String contexturl = "/user/context";

	@Test
	void shouldGive401WithoutUser() throws Exception {
		mockMvc.perform(get(parUrl)).andExpect(status().is(HttpStatus.UNAUTHORIZED.value()));
	}
	@Test
	@WithMockUser(username = "userMock", password = "pwd", roles = "USER")
	void getCurrentUserTest() throws Exception {
		var res = mockMvc.perform(get(parUrl)).andExpect(status().isOk()).andReturn();
		assertEquals("userMock", res.getResponse().getContentAsString());
	}

	@Test
	@WithMockUser(username = "userMock", password = "pwd", roles = "USER")
	void getCurrentUserContextTest() throws Exception {
		var res = mockMvc.perform(get(contexturl)).andExpect(status().isOk()).andReturn();
		assertEquals("userMock", res.getResponse().getContentAsString());
	}

}
```
so let's break down this test: 
```java
@WebMvcTest(controllers = UserController.class)
```
The [@WebMvcTest](https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/test/autoconfigure/web/servlet/WebMvcTest.html)
 annotation will help us to make an integration test with only the configuration relevant to MVC tests. The “controllers” part, indicates that we
 will test only the UserController.class, if omitted all the 
controllers will be instantiated (in the application context). 
```java
	@Test
	void shouldGive401WithoutUser() throws Exception {
		mockMvc.perform(get(parUrl)).andExpect(status().is(HttpStatus.UNAUTHORIZED.value()));
	}
```
This first test, is just to make sure that spring security is up an running and that our endpoints are secure (Please note that get() and status() are static imports).

```java
@Test
	@WithMockUser(username = "userMock", password = "pwd", roles = "USER")
	void getCurrentUserTest() throws Exception {
		var res = mockMvc.perform(get(parUrl)).andExpect(status().isOk()).andReturn();
		assertEquals("userMock", res.getResponse().getContentAsString());
	}
```
With the previous test and the other one, we make certain that our endpoints in the controller class, are performing the correct behavior.
We are simulating an authenticated user with "@WithMockUser" and naturally expecting that our methods return the correct username. 

Now let us secure our application by making a new class as follow: 
```java

@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {
}
```
In this class we can personalize the spring security configuration, for example by overriding the "configure(AuthenticationManagerBuilder auth)" method to configure the authentication process by deciding, how we retrieve our user; or by overriding the "configure(HttpSecurity http)" method to decide the authorization process.<br>

Now if we run our test, it will fail; only the first one will pass as our application is currently secure. If you look at the console, you will notice that spring printed a default password for us (you ca use it to log in wiht a default username: user):
```markup
Using generated security password: 82359a43-539f-4fb8-b6bd-77530d9b83b4
```
Next step is to write our controller class as follow, to implement our logic:
```java
@GetMapping("/par")
public String getCurrentUser(@AuthenticationPrincipal UserDetails user) {
        return user.getUsername();
    }

@GetMapping("/context")
public String getCurrentUserContext() {
        SecurityContext context = SecurityContextHolder.getContext();
        Authentication authentication = context.getAuthentication();
        return ((UserDetails) authentication.getPrincipal()).getUsername();
    }
```
So let's break it down :
```java
@AuthenticationPrincipal UserDetails user
```
 The above [annotation](https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/core/annotation/AuthenticationPrincipal.html) consents us to inject the current authenticated Userdetails or Principle to the method as a parameter.
 ```java
 SecurityContext context = SecurityContextHolder.getContext();
 ```
With the second endpoint, we access to the security context by the static method "getContext()", then we cast the Principle to "UserDetails" to obtain more information like expiration, authorities, etc. (Take note that we can't use any implementation of UserDetails, for security reasons.). Now running all the tests, all successed.
<br>

At the end, as you can instantly see the most painless way to get access to the authenticated user is by the "@AuthenticationPrincipal".
<br>

That's it; all the code written in this post can be found on [GitHub](https://github.com/s0l0c0ding/spring-tips/tree/master/authenticated). 

