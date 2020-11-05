---
published: true
title: Implementare un "entity callback" con SpringBoot e MongoDB
description: Qualche volta, abbiamo il bisogno di effettuare certe operazioni prima di salvare un dato nel database, come sappiamo per i sql databases Spring fornisce alcuni metodi di "lifecycle callback" come per esempio @PostPersist ..
date: 2020-10-27
author: Bassem
slug: it_spring_entity_Callbacks_mongodb
photo: assets/stock/mongo_spring.webp
imgCredit:
keywords:
  - spring
  - springDataJpa
  - mongodb
language: it
output:
  html_document:
    css: post-details.component.css
---
Qualche volta, abbiamo il bisogno di effettuare certe operazioni prima di salvare un dato nel database, come sappiamo per i sql databases Spring fornisce alcuni metodi di "lifecycle callback" come per esempio [@PostPersist e @PreUpdate](https://solocoding.dev/blog/eng_spring_entity_listener_SpringBoot_SpringDataJpa), ma se la nostra applicazione usasse un MongoDb, le precedenti annotazioni non le troveremo nel modulo Spring Data MongoDb. Nonostante ciò il modulo fornisce alcuni [Entity Callbacks](https://docs.spring.io/spring-data/mongodb/docs/3.0.4.RELEASE/reference/html/#entity-callbacks). In questo articolo vediamo come possiamo utilizzarli.
<br>
<br>
Ho creato una applicazione classica per accorciare gli Url, in cui ho sfruttato gli"Entity Callbacks". L'applicazione è basata su spring boot e MongoDB come database, Ho deciso di settare l'url corto uguale alle ultime sei cifre del Id del documento 
/entità.
Per conoscenza l'oggetto `ObjectId` di MongoDB è composto da 4-byte del timestamp attuale, 5-byte di valore casuale e 3-byte di un cantatore il quale è inizializzato con un valore casuale. Per maggiori dettagli, potete vedere la documentazione ufficiale [qua](https://docs.mongodb.com/manual/reference/method/ObjectId/).
<br>
Il documento da salvare nel database è il seguente:
```java
@Document
public class Url {
    @Id
    private ObjectId id;
    private String fullUrl;
    private String shortUrl;
    private long count;
..
}
```
Il mio obiettivo principale è quello di settare la proprietà "shortUrl" prima di mandare il dato al database usando una azione "callback".
<br>
Il modulo di Spring data mongodb  fornisce diversi "callbacks", come ad esempio BeforeConvertCallback, BeforeSaveCallback, e altri. La lista complete può essere trovata [qua](https://docs.spring.io/spring-data/mongodb/docs/3.0.4.RELEASE/reference/html/#mongo.entity-callbacks). Per raggiungere questo obiettivo, andiamo a creare un componente che implementa l'interfaccia BeforeConvertCallback come segue: 
 ```java
 @Component
public class UrlListener implements BeforeConvertCallback<Url> {

    @Override
    public Url onBeforeConvert(Url entity, String collection) {
        if (entity.getId() == null) {
            ObjectId id = new ObjectId();
            entity.setId(id);
            entity.setShortUrl(id.toHexString().substring(18, 24));
        }
        return entity;
    }
 ```
 Questa classe verrà invocata prima che un oggetto `Url` viene convertito in `org.bson.Document` (binary json, il formato di rappresentazione usato in MongoDB). Sto usanodo il "beforeConver" perchè per qualche ragione con il "beforeSave" le proprietà modificate con la callabck vengono sostituite da un nuovo `ObjectId` prima di raggiungere il database.
 <br>
 Esaminiamo questa classe, prima ci assicuriamo che stiamo modificando una entità nuova, ispezionando la proprietà Id. Dopo di che
 assegniamo uno nuovo oggetto id mediante il costruttore di `ObjectId`, infine settiamo la proprietà shortUrl con le ultime sei cifre della rappresentazione esadecimale del id.
 <br>
 <br>
Tutto qua, il codice dell'applicazione può essere trovato su [GitHub](https://github.com/s0l0c0ding/shorter-url/blob/master/src/main/java/dev/solocoding/shorterurl/config/UrlListener.java). La stessa applicazione è stata anche realizzata con [QUARKUS](https://quarkus.io/) per sfruttare la [GraalVM](https://www.graalvm.org/), per migliorare la memoria e i tempi di strat-up, la potete trovare [qua](https://github.com/s0l0c0ding/shorter-url-quarkus).