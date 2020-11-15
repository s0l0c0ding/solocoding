---
published: true
title: Implement an entity Callbacks with SpringBoot and MongoDB
description: Some times we need to carry out certain actions before sending a record to the database, as we know for sql databases Spring data provides some life-cycle callback methods like @PostPersist..
date: 2020-10-27
author: Bassem
slug: eng_spring_entity_Callbacks_mongodb
photo: assets/stock/mongo_spring.webp
imgCredit:
keywords:
  - spring
  - springDataJpa
  - mongodb
language: en
output:
  html_document:
    css: post-details.component.css
---
Some times we need to carry out certain actions before sending a record to the database, as we know for sql databases Spring data provides some life-cycle callback methods like [@PostPersist and @PreUpdate](https://solocoding.dev/blog/eng_spring_entity_listener_SpringBoot_SpringDataJpa), but if your appplication relay on a MongoDb, there are not such annotations in the Spring Data MongoDb module, in spite of that, the mongo module provides some [Entity Callbacks](https://docs.spring.io/spring-data/mongodb/docs/3.0.4.RELEASE/reference/html/#entity-callbacks). In this article we are going to see how to implement them. 
<br>
<br>
I developed a classic application to shorten URLs with the use of "Entity Callbacks". The application is based on spring boot and MongoDB as a database. I decided to make the short URL equal to the last six characters of the document/entity Id. For knowledge, the `MongoDB Id` object is composed of the current 4-byte timestamp value, a 5-byte random value and a 3-byte incrementing counter, which is initialized to a random value. More info can be found on the official [docs](https://docs.mongodb.com/manual/reference/method/ObjectId/).
<br>
The document to be saved into the database, is the following:
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
My main objective is to modify the "shortUrl" property before hitting the database, using a callback.
<br>
Spring data mongodb module provides different callbacks, such as BeforeConvertCallback, BeforeSaveCallback, and others. The complete list can be found [here](https://docs.spring.io/spring-data/mongodb/docs/3.0.4.RELEASE/reference/html/#mongo.entity-callbacks).
 Therefore to accomplish our objective, we are going to create a component which will implement the BeforeConvertCallback interface as follow:
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
This class will be invoked before a `Url` object is converted to `org.bson.Document` (binary json, the MongoDB way to represent data structure). I am using the "beforeConver" because for some reason with "beforeSave", the modified data with the callback class get replaced with a new `ObjectId` before going into the database.
 <br>
Examining this class first, we make sure that the entity is a new one, by inspecting the Id property. After that, we assign a new id by the `ObjectId` constructor finally, we set the shortUrl with the last six characters of the id's hexstring representation. Now every time we save a Url the "shortUrl" property will be set automatically.
 <br>
 <br>
That's it; all the application's code can be found on [GitHub](https://github.com/s0l0c0ding/shorter-url/blob/master/src/main/java/dev/solocoding/shorterurl/config/UrlListener.java).
The same application is developed also with [QUARKUS](https://quarkus.io/) to get advantage of the[GraalVM](https://www.graalvm.org/), reduce the memory footprint and start-up time, you can find it [here](https://github.com/s0l0c0ding/shorter-url-quarkus).