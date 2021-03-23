---
published: true
title: Logging  centralizzato usando la programmazione AOP e spring
description: In questo articolo, esaminiamo come possiamo utilizzare la programmazione orientata agli aspetti -AOP- per centralizzare i log....
date: 2021-03-21
author: Bassem
slug: it_spring_logging_centralizzato_aop
photo: assets/stock/aop.webp
imgCredit:
keywords:
  - spring
  - programming
language: it
tweetId: '1374400649811558412'
output:
  html_document:
    css: post-details.component.css
---
In questo articolo, esaminiamo come possiamo utilizzare la programmazione orientata agli aspetti  -AOP- per centralizzare i log, invece di dover inizializzare il logger e scrivere la relativa logica in ogni classe del nostro progetto.
<br>
<br>
Dal [sito di spring](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#aop) possiamo trovare una semplice definzione di AOP :
<br>
_"La programmazione orientata agli aspetti (AOP) integra la programmazione orientata agli oggetti (OOP) fornendo un altro modo di pensare alla struttura del programma. L'unità chiave della modularità in OOP è la classe, mentre in AOP l'unità di modularità è l'aspetto."_
<br>
Un aspetto potrebbe essere per esempio attività di logging o transazione ecc.

### Cosa andiamo a costruire?

Costruiremo un componente da utilizzare per  centralizzare il logging, in particolare registreremo ogni richiesta, risposta e ogni eccezione sollevata durante l'esecuzione di qualsiasi endpoint(da notare, se si volesse loggare solo la risposta e la richiesta degli endpoint, si consiglia di utilizzare Spring AbstractRequestLoggingFilter).

### Un po' di terminologia e annotazioni

Prima di analizzare il codice esaminiamo alcuni termini e annotazioni:

1. Aspetto, è l'argomento che intressa più classi può essere, ad esempio, la gestione delle transazioni. L'annotazione `@Aspect` deve essere posizionata sulla classe per dichiarare un aspetto inoltre dobbiamo annotare la classe stessa con `@Component` per registrarla nel contesto di spring;

2. Join point, è un punto qualsiasi del nostro programma come l'esecuzione del metodo, la gestione delle eccezioni, ecc.;

3. Advice, l'azione desiderata che deve essere eseguita da un aspetto in un particolare punto del programma. E può essere :

- `@Before`, eseguita prima di un join point;

- `@AfterReturning`, eseguita dopo la fine dell'esecuzione normale di un join point;

- `@AfterThrowing`, eseguita dopo che l'esecuzione di un metodo finisce con una eccezione;

- esistono altre annotazioni come `@After`, `@Around` potete consultare la lista completa [qua](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#aop-advice).

4. Pointcut, è  una espressione per abbinare 'Advise' con il desiderato 'Join point'. Ci sono molte espressioni che possono essere usate, per esempio: execution(per individuare l'esecuzione di un metodo) , within(per limitare i tipi) ,this(per uno specifico tipo) e la lista non finisce qua, potete condultarla [qua](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#aop-pointcuts-designators);

5. Target object, un oggetto intressato da uno o più aspetti. Detto anche 'proxied object' in spring perché Spring AOP è implementata usando le runtime proxies;

6. AOP proxy, un oggetto creato dal AOP framework per adempiere i contratti di un aspetto;

7. Weaving, il processo di collegamento degli aspetti con altri tipi di applicazioni o oggetti per creare un oggetto 'advised object'.

### Codice

Prima di tutto, dobbiamo aggiungere la dipendenza Aspect starter nella nostra pom.xml:
```xml
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-aop</artifactId>
</dependency>
```
E di seguito un esempio completo di una classe di logging:

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

Analizziamolo:

```java
  private static final String POINTCUT = "within(dev.solocoding.aop.controllers.*)";
```

Abbiamo definito la nostra espressione pointcut come String e abbiamo utilizzato la parola chiave "within" per loggare ogni metodo nel pacchetto `dev.solocoding.aop.controllers`.

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

Nel codice riportato sopra, abbiamo definito il nostro primo advise con il tipo `@Around`, questo significa che possiamo eseguire determinate azioni prima e dopo l'esecuzione del metodo, infatti abbiamo usato il metodo `ProceedingJoinPoint.proceed()` come divisore tra le azioni prima e dopo.

```java
 @AfterThrowing(pointcut = POINTCUT, throwing = "e")
    public void logAfterException(JoinPoint jp, Exception e) {
        log.error("Exception during: {} with ex: {}", constructLogMsg(jp),  e.toString());
    }
```

Con il metodo logAfterException abbiamo creato un `@AfterThrowing` advice, come sempre il metodo prende come parametro di input un oggetto `JoinPoint` (da notare che l'oggetto ProceedingJoinPoint estende JoinPoint) e l'eccezione generata durante l'esecuzione del codice. Questo advice verrà richiamato ogni volta che si verifichi una eccezione.

Ora diamo una occhiata al codice del controller:

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

È un semplice controller con due endpoint; nel metodo post, sto simulando eccezioni random quando l'id è pari (da non fare a casa 😀). Quando eseguiamo l'applicazione con alcune chiamate abbiamo i seguenti log:

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

Da notare che per avere la rappresentazione del oggetto Post, l'oggetto stesso deve implementare il metodo toString().

Tutto qua, spero che lo troviate utile. Il codice della completa applicazione può essere trovato su [GitHub](https://github.com/s0l0c0ding/spring-tips/tree/master/aop).
