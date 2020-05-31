---
published: true
title: Come possiamo ottenere l'utente autenticato con spring security 
description: In questo post vediamo  come si può  ottenere l'utente autenticato, nella nostra applicazione spring, usando...
date: 2020-05-10
author: Bassem
slug: it_spring_come-possiamo-ottenere-l'utente-autenticato-con-spring-security
photo: assets/stock/AuthenticationPrincipal.webp
imgCredit: solocoding.dev
keywords:
  - spring
language: it
output:
  html_document:
    css: post-details.component.css
---

In questo post vediamo  come si può  ottenere l'utente autenticato, nella nostra applicazione spring, usando due metodi diversi; quindi iniziamo.

Se si desidera iniziare da zero, è possibile scaricare il codice di partenza da [springInitializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.2.6.RELEASE&packaging=jar&jvmVersion=11&groupId=dev.solocoding&artifactId=authenticated&name=authenticated&description=spring-tips%20get%20current%20authenticated&packageName=dev.solocoding.authenticated&dependencies=security,web,lombok) (usiamo le dipendenze security e web).  

Quindi, per prima cosa, creiamo un UserController
con due endpoints :
 ```java
@RestController
@RequestMapping("/user")
public class UserController {

    @GetMapping("/par")
    public String getCurrentUser() { // questo metodo avrà un parametro di input
        return null;
    }

    @GetMapping("/context")
    public String getCurrentUserContext() {
        return null;
    }
}
```
Come potete vedere, dedichiamo un endpoint per ogni approccio che andiamo ad usare. Con il primo, recuperiamo l'utente con un'annotazione al parametro di input del metodo; il secondo, come suggerisce la firma, lo recuperiamo dal SecurityContext. Prima di scrivere il nostro codice scriviamo qualche test: 
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
quindi, cerchiamo di analizzare  questo test: 
```java
@WebMvcTest(controllers = UserController.class)
```
L'annotazione [@WebMvcTest](https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/test/autoconfigure/web/servlet/WebMvcTest.html)
 ci aiuta  nel eseguire un test di integrazione, con solo, la configurazione spring relativa ai test MVC. La parte "controller", indica che testiamo  solo la  UserController.class, se la togliessimo  tutti i controller verrebbero  istanziati (nel contesto dell'applicazione). 
```java
	@Test
	void shouldGive401WithoutUser() throws Exception {
		mockMvc.perform(get(parUrl)).andExpect(status().is(HttpStatus.UNAUTHORIZED.value()));
	}
```
Questo primo test è solo per assicurarsi che spring security funzioni e che i nostri endpoint siano sicuri (da tenere presente che get() e status() sono importazioni statici).

```java
@Test
	@WithMockUser(username = "userMock", password = "pwd", roles = "USER")
	void getCurrentUserTest() throws Exception {
		var res = mockMvc.perform(get(parUrl)).andExpect(status().isOk()).andReturn();
		assertEquals("userMock", res.getResponse().getContentAsString());
	}
```
Con il test precedente e l'ultimo, ci assicuriamo che i nostri endpoint nella classe controller stiano eseguendo il comportamento desiderato. Stiamo simulando un utente autenticato con "@WithMockUser" e ci aspettiamo naturalmente che i nostri metodi restituiscano il nome utente corretto.  

Ora assicuriamo la nostra applicazione creando una nuova classe come segue:
```java

@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {
}
```
In questa classe possiamo personalizzare la configurazione di spring security, ad esempio facendo override del metodo "configure (AuthenticationManagerBuilder auth)" per configurare il processo di autenticazione decidendo come recuperare il nostro utente,o sovrascrivendo il metodo "configure (HttpSecurity http)" per decidere il processo di autorizzazione.<br>

Ora se eseguissimo il nostro test, fallirebbe; passa solo il primo poiché la nostra applicazione è attualmente protetta. Se guardassi la console, noteresti che Spring ha stampato una password predefinita per noi (potete usarla per accedere, con un nome utente predefinito: user):
```log
Using generated security password: 82359a43-539f-4fb8-b6bd-77530d9b83b4
```
Il prossimo passo è scrivere la nostra classe di controller come segue, per implementare la nostra logica:
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
Cerchiamo di analizzarla :
```java
@AuthenticationPrincipal UserDetails user
```
[L'annotazione](https://docs.spring.io/spring-security/site/docs/current/api/org/springframework/security/core/annotation/AuthenticationPrincipal.html) riportata sopra, ci consente di iniettare il "UserDetails" o "Principle" autenticato  nel metodo come parametro.
 ```java
 SecurityContext context = SecurityContextHolder.getContext();
 ```
Con il secondo endpoint, accediamo al contesto di sicurezza con il metodo statico "getContext()", quindi convertiamo il "Principle" in "UserDetails" per ottenere maggiori informazioni come scadenza, autorizzazioni, ecc. (Da notare che non possiamo usare nessuna implementazione di UserDetails, per motivi di sicurezza). Rieseguendo i test, ora passano.
<br>

Infine, come potete vedere  il modo più facile e veloce per ottenere informazioni  sull'utente autenticato è tramite "@AuthenticationPrincipal".
<br>

Tutto qua, il codice scritto in questo articolo può essere trovato su [GitHub](https://github.com/s0l0c0ding/spring-tips/tree/master/authenticated). 

