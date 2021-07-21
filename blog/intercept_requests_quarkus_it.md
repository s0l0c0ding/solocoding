---
published: true
title: Intercettare le richieste HTTP in Quarkus
description: In questo articolo vediamo come intercettare richieste e risposte utilizzando i filtri in Quarkus ...
date: 2021-07-21
author: Bassem
slug: it_quarkus_intercept_requests
photo: assets/stock/filtersQuarkus.webp
imgCredit:
keywords:
  - quarkus
  - programming
  - java
language: it
output:
  html_document:
    css: post-details.component.css
---
In questo articolo vediamo come intercettare richieste e risposte utilizzando i filtri in Quarkus. Analizziamo come implementarli in uno stack tradizionale ed in uno reattivo.

### Cosa realizziamo?

In questo esempio, costruiamo due rest endpoint, uno utilizzando la tradizionale dipendenza resteasy e l'altro utilizzando web-vertex, in entrambi i casi implementiamo filtri per poter agire sulle richieste e risposte. In particolare, aggiungiamo dei  'header' alla risposta.

### Alcune proprietà ed interfacce di Quarkus

In questa sezione, esaminiamo le annotazioni e le interfacce che vengono utilizzate in seguito nel codice per raggiungere il nostro obiettivo.

Per il 'servelt container'  viene utilizzata l'interfaccia `ContainerResponseFilter` per intercettare la risposta e agire su di essa prima di raggiungere il nostro utente finale. Nel caso in cui vogliamo gestire la richiesta, possiamo implementare il `ContainerRequestFilter`.

Per il contesto reattivo, usiamo l'annotazione `@RouteFilter`, che viene messa su un metodo void con un parametro di tipo `RoutingContext`. Il metodo contiene la logica che viene applicata a un determinato percorso.

### Codice

Per prima cosa diamo un'occhiata al livello del controller:

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

È un semplice endpoint che restituisce una stringa, se docessi restituire un json dovresti aggiungere una libreria json al tuo pom.xml, si può scegliere tra la dipendenza RESTEasy Jackson o RESTEasy JSON-B.

Il secondo controller è di tipo reattivo:

```java
@ApplicationScoped
public class GreetingRoute {
    @Route(path = "reactive", methods = HttpMethod.GET)
    public void reactive(RoutingContext ctx) {
        ctx.response().end("Hello Reactive QUARKUS");
    }
}
```

Anche qui, è un metodo get che restituisce una stringa. Abbiamo usato l'annotazione CDI `@ApplicationScoped`, cioè questo bean viene creato solo quando viene invocato.

Ora diamo una occhiata al Jax-Filter:

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

In questa classe stiamo implementando l'interfaccia `ContainerResponseFilter`. Sovrascriviamo il metodo `filter` ed al suo interno aggiungiamo uno nuovo 'header' ad ogni risposta. Il `X-Content-Type-Options` con valore `nosniff` è un ''header di sicurezza che aiuta ad impedire  un attacco [MIME sniffing](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#mime_sniffing).

Questo filtro non viene applicato alle rotte reattive, ma solo a quelle servlet.

L'ultimo filtro che andiamo ad esaminare è quello reattivo:

```java
public class VertexFilter {
    @RouteFilter
    void myFilter(RoutingContext rc) {
       rc.response().putHeader("X-Header", "Vertex header");
       rc.next(); 
    }
}
```

In questo caso non è necessario annotare la classe con alcuna annotazione CDI, Quarkus seleziona automaticamente il filtro poiché stiamo utilizzando l'annotazione `@RouteFilter`. In questo filtro stiamo semplicemente aggiungendo un 'header' personalizzato alla risposta.
Questo filtro verrà applicato a tutti gli endpoint della nostra applicazione, tradizionali e reattivi.

### Testando

Eseguendo il seguente test:

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

Abbiamo il seguente output:

```log
HTTP/1.1 200 OK
X-Header: Vertex header
Content-Length: 13
X-Content-Type-Options: nosniff
Content-Type: text/plain;charset=UTF-8

Hello QUARKUS
```

Come si può vedere i due filtri sono stati applicati e abbiamo i due 'header' `X-Header` e `X-Content-Type-Options`.

Ora eseguendo il secondo test:

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

Abbiamo la seguente risposta:

```log
HTTP/1.1 200 OK
X-Header: Vertex header
content-length: 22

Hello Reactive QUARKUS
```

Da notare che abbiamo solo l'intestazione `X-Header`.

Tutto qua, spero che lo troviate utile. Il codice della completa applicazione può essere trovato su [GitHub](https://github.com/s0l0c0ding/quarkus-tips/tree/main/filters-with-quarkus).
