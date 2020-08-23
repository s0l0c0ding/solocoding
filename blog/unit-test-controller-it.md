---
published: true
title: Come si esegue un unit test  di una classe @Controller
description: In questo articolo, vediamo come eseguire un unit test  di una classe annotata con @Controller. Ciò significa che la isoliamo dal contesto di Spring.
date: 2020-05-24
author: Bassem
slug: it_spring_come_eseguire_unit_test_classe_Controller
photo: assets/stock/code.webp
imgCredit: Markus Spiske on Unsplash
keywords:
  - spring test
  - spring
language: it
output:
  html_document:
    css: post-details.component.css
---

In questo articolo, vediamo come eseguire un unit test  di una classe annotata con @Controller. Ciò significa che la isoliamo dal contesto di Spring.
<br>
Normalmente quando testiamo la nostra applicazione con [@SpringBootTest](https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/test/context/SpringBootTest.html), stiamo eseguendo un test di integrazione, poiché stiamo utilizzando lo "SpringBootContextLoader" come "ContextLoader" predefinito, che di conseguenza inizializza tutti i bean nella nostra applicazione.
<br>  
Vale la pena ricordare che il framework Spring fornisce anche altre annotazioni, che ci consentono di suddividere il contesto. Per esempio[@WebMvcTest](https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/test/autoconfigure/web/servlet/WebMvcTest.html) per testare il livello Web, dove possiamo scegliere un controller specifico da controllare,[@DataJpaTest](https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/test/autoconfigure/orm/jpa/DataJpaTest.html) per testare JPA e il livello base dati, è possibile trovare l'elenco completo [qui](https://docs.spring.io/spring-boot/docs/current/reference/html/appendix-test-auto-configuration.html#test-auto-configuration).
<br>  
Quindi, per prima cosa, facciamo un RestController che presenta il seguente oggetto Post:
```java
public class Post {

    private String id;
    private String postTitle;
    private String body;

    public Post (String postTitle, String body) {
        this.id = UUID.randomUUID().toString();
        this.postTitle = postTitle;
        this.body = body;
    }
    // getters and setters
}
```
Niente di speciale, abbiamo tre proprietà private e stiamo simulando l'id generato con un UUID casuale.  
<br> 
Successivamente abbiamo il nostro controller:
```java

@RestController
public class PostController {
   
    @GetMapping("/post/{random}")
    public Post getPost(@PathVariable Integer random) {
        return new Post("postTitle "+ random, "some body");
    }


}
```
La nostra classe è annotata con [@RestController](https://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/web/bind/annotation/RestController.html), che ci permette di convertire il post generato in una "response" automaticamente, ciò accade perché l'annotazione stessa è annotata con [@ResponseBody](https://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/web/bind/annotazione/ResponseBody.html).
<br>
Quindi abbiamo il nostro metodo, in cui restituiamo un nuovo post con un titolo concatenato con un numero scambiato tramite il [@PathVariable](https://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/web/bind/annotation/PathVariable.html). Infine, il punto rest è esposto mediante un "get" usando l'annotazione [@GetMapping](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/bind/annotation/GetMapping.html).
<br>
Ora vediamo il nostro test:
```java
@ExtendWith(SpringExtension.class)
class UnitestcontrollerApplicationTests {

	private static MockMvc mockMvc;

	@BeforeAll
	static void init () {
		mockMvc = MockMvcBuilders.standaloneSetup(PostController.class).build();
	}

	@Test
	void testController() throws Exception {
		mockMvc.perform(get("/post/1")).andDo(print()).andExpect(status().isOk());
	}
	
	@Test
	void shouldGive405ForPost() throws Exception {
		mockMvc.perform(post("/post/1")).andDo(print()).andExpect(status().isMethodNotAllowed());
	}

}
```
La nostra classe di test è annotata con [@ExtendWith (SpringExtension.class)](https://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/test/context/junit/jupiter/SpringExtension.html), in questo modo stiamo integrando "Spring TestContext Framework" in "JUnit 5", quindi stiamo usando l'ovveride di alcuni metodi junit come beforAll, afterAll, ecc.
<br>
Inoltre cosi facendo, possiamo usare l'annotazione [@MockBean](https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/test/mock/mockito/MockBean.html) per aggiungere "mock" al nostro contesto e inoltre otteniamo anche l'accesso ad ApplicationContext associato al nostro test. Infatti se dessimo un'occhiata ai messaggi di log durante il test, potremmo notare che il nostro array contextInitializerClasses è vuoto:
```markup
[main] DEBUG org.springframework.test.context.cache.DefaultCacheAwareContextLoaderDelegate - Storing ApplicationContext [1808884231] in cache under key [[MergedContextConfiguration@510f3d34 testClass = UnitestcontrollerApplicationTests, locations = '{}', classes = '{}', contextInitializerClasses = '[]', activeProfiles = '{}', propertySourceLocations = '{}', propertySourceProperties = '{}', 
```
Per ulteriori informazioni sulla memorizzazione nella cache del contesto dell'applicazione, potete dare un'occhiata ai documenti ufficiali [qui](https://docs.spring.io/spring/docs/5.1.2.RELEASE/spring-framework-reference/testing.html#testcontext-CTX-gestione-caching).  
<br>
Successivamente abbiamo l'oggetto [MockMvc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/test/web/servlet/MockMvc.html), lo strumento principale per testare la nostra classe di controller, è una variabile statica, quindi  la inizializziamo nel metodo @BeforeAll:
```java
private static MockMvc mockMvc;

@BeforeAll
static void init () {
		mockMvc = MockMvcBuilders.standaloneSetup(PostController.class).build();
	}
```
Stiamo realizzando una build personalizzata per il nostro oggetto mockMvc con MockMvcBuilders, per cui il test viene avviato solo con l'infrastruttura minima richiesta e stiamo testando un solo controller (può accettare anche un array).  
<br>
Diamo ora un'occhiata ai nostri test:
```java
@Test
	void testController() throws Exception {
		mockMvc.perform(get("/post/1")).andDo(print()).andExpect(status().isOk());
	}
	
	@Test
	void shouldGive405ForPost() throws Exception {
		mockMvc.perform(post("/post/1")).andDo(print()).andExpect(status().isMethodNotAllowed());
	}
```
Niente di particolare, ci stiamo assicurando che il nostro end point stia funzionando con il primo test e che accetti solo richieste di tipo "Get"  con il secondo.  
<br>
Ora introduciamo una complicazione al nostro controller iniettando un servizio, che è responsabile della generazione del nuovo post, il risultato è il seguente:
```java
@RestController
public class PostController {

    private final PostService service;

    public PostController(PostService service) {
        this.service = service;
    }
    @GetMapping("/post/{random}")
    public Post getPost(@PathVariable Integer random) {
        return service.getAPost(random);
    }
}
```
Di conseguenza dobbiamo cambiare il nostro test per integrare la nuova modifica, come segue:
```java
@ExtendWith(SpringExtension.class)
class UnitestcontrollerApplicationTests {

	private static MockMvc mockMvc;
	private static PostService service = mock(PostService.class);

	@BeforeAll
	static void init () {
		mockMvc = MockMvcBuilders.standaloneSetup(new PostController(service)).build();
	}

	@Test
	void testController() throws Exception {
		when(service.getAPost(1)).thenReturn(new Post("postTitle", "body"));
		mockMvc.perform(get("/post/1")).andDo(print()).andExpect(status().isOk());
	}
	
	@Test
	void shouldGive405ForPost() throws Exception {
		when(service.getAPost(1)).thenReturn(new Post("postTitle", "body"));
		mockMvc.perform(post("/post/1")).andDo(print()).andExpect(status().isMethodNotAllowed());
	}

}
```
Come possiamo vedere, "moccato" il postService usando il metodo statico mock () di Mockito, potevamo anche usare @MockBean, poiché stiamo usando SpringExtension.class.
Quindi abbiamo costruito il nostro oggetto controller usando il mock appena creato.Inoltre in ogni test stiamo simulando la risposta usando l'istruzione when(..).ThenReturn(..) di Mockito.  
<br>
Infine, se volessimo eliminare tutte le dipendenze di Spring e usare solo Mockito (come nostro test), dovremmo rimuovere solo l'annotazione @ExtendWith (SpringExtension.class). In questo modo abbiamo un vero test junit.  
<br>
Tutto qua, il codice completo può essere trovato su [GitHub](https://github.com/s0l0c0ding/spring-tips/tree/master/unitestcontroller).
<br>
<div class="embed-responsive embed-responsive-16by9">
  <iframe class="embed-responsive-item" src="https://www.youtube.com/embed/yM5hcBLzPwE" allowfullscreen></iframe>
</div>
<br>
