---
published: true
title: Salvare oggetti non tipizzati con Spring data e MySQL Json Data-Type
description: A volte ci troviamo di fronte a un requisito funzionale, in cui dobbiamo salvare dati non strutturati nel nostro database, in questo caso affrontiamo due problemi .................
date: 2023-01-01
author: Bassem 
slug: it_spring_json_hibernate
photo: assets/stock/spring_hibernate_mysql.webp
keywords:
  - java
  - spring
  - hibernate
  - mysql
language: it
tweetId: '1611292302252580865'
output:
  html_document:
    css: post-details.component.css
---
A volte ci troviamo di fronte a un requisito funzionale, in cui dobbiamo salvare dati non strutturati nel nostro database, in questo caso affrontiamo due problemi. Il primo è il database se si utilizza un database no-sql, siamo al sicuro, altrimenti dobbiamo vedere se il database sql utilizzato supporta colonne di tipo json o meno. Il secondo problema è il linguaggio di programmazione e i framework, in Java specificamente hibernate non supporta il tipo json in modo nativo.
<br>
In questo articolo scriviamo una demo utilizzando mysql 5.7, spring data 3.0.0 e la libreria [hypersistence-utils](https://github.com/vladmihalcea/hypersistence-utils). Quest'ultima ci aiuta a mappare la colonna JSON a un'entità JPA.

### Codice
Prima di tutto costruiamo la nostra tabella:
```sql
CREATE TABLE `post` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `body` varchar(255) DEFAULT NULL,
  `comment` json DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
```
In questa demo sto usando [flywaydb](https://flywaydb.org/), lo script riportato sopra veine collocato sotto `src/main/resources/db/migration`, questo ci facilita l'inizializzazione della tabella e qualsiasi modifica futura per il database.
<br>
<br>
Nel nostro file `pom.xml`, abbiamo solo bisogno di aggiungere la seguente libreria hypersistence-utils, per poter mappare correttamente i campi Json.

```xml
		<dependency>
			<groupId>io.hypersistence</groupId>
			<artifactId>hypersistence-utils-hibernate-60</artifactId>
			<version>${hypersistence-utils.version}</version>
		</dependency>
```

Successivamente, creiamo la nostra entità `Post` che rappresenta un post del blog come segue:

```java
@Entity
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String body;

    private JsonNode comment;

    // skip getters and setters
}
```
E come vediamo per l'oggetto comment stiamo usando il tipo `JsonNode` da `com.fasterxml.jackson` per mappare la colonna json.
<br>
<br>
Ora diamo un'occhiata al nostro repository:

```java
public interface PostRepository extends JpaRepository<Post, Long> {
    
    @Query(value = """
                SELECT * FROM post 
                WHERE
                comment->"$.key" = :comment
            """, nativeQuery = true)
    Optional<Post> getPostByCommentKey(String comment); 
}
```
Qui scriviamo una query nativa per esplorare la funzionalità delle colonne Json di MySQL. Abbiamo definito un metodo per ottenere un post, che contiene un commento, che a sua volta ha un nome `key` con un valore uguale al commento del parametro stringa di input.
<br>
<br>
Ora creiamo il nostro livello di rappresentazione:

```java
@RequestMapping("/posts")
public class PostController {
    // skip constructor

    @PostMapping
    public Postdto createPost(@RequestBody Postdto postToCreate) {
        var post = new Post();
        post.setBody(postToCreate.post());
        post.setComment(postToCreate.comment());
        postRepo.save(post);
        return new Postdto(post.getBody(), post.getComment());
    }

    @GetMapping("/comments/{body}")
    public Postdto getPostByComment(@PathVariable String body) {
        var found = postRepo.getPostByCommentKey(body).orElseThrow();
        return new Postdto(found.getBody(), found.getComment());
    }
}
```
Abbiamo due endpoint, una per creare il post e l'altra per ottenere il post in base al commento.
<br>
<br>
Infine, possiamo dimostrare il nostro codice con il seguente test di integrazione:

```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT, classes = {JsonHibernateApplication.class, TestContainerConfig.class})
class JsonHibernateApplicationTests {
  // skip local vars

	@Test
	@Sql("init-db.sql")
	void whenCreatPostThenSuccess() {
		var postBody = "bodyPost";
		var commentBody = "commentPost";
		var req = new Postdto(postBody, mapper.createObjectNode().put("key", commentBody));
		
		Postdto actual = restTemplate.postForObject(BASE , req, Postdto.class);
		
		assertEquals(postBody, actual.post());
		assertFalse(actual.comment().get("key").isMissingNode());
		logger.info("comment body: " + actual.comment().toString());
		assertEquals(commentBody, actual.comment().path("key").asText());
	}

	@Test
	@Sql("init-db.sql")
	void whenGetPostByCommentThenSuccess() {
		Postdto actual = restTemplate.getForObject(BASE + "/comments/{body}", Postdto.class, "bodyComment222");
		
		assertEquals("post2", actual.post());
		assertFalse(actual.comment().get("key").isMissingNode());
		logger.info("comment body: " + actual.comment().toString());
		assertEquals("bodyComment222", actual.comment().path("key").asText());
	}

}
```
Nell'annotazione `@SpringBootTest` definiamo la configurazione del nostro test. Stiamo usando `Testcontainers` con un server MySQL, la relativa configurazione può essere trovata nella classe `TestContainerConfig.class`.
<br>
Per ogni test stiamo eseguendo lo script sql `init-db.sql`: 

```sql
DELETE FROM post;
INSERT INTO post (id, body, comment)
VALUES
(1, 'post1', '{"key":"bodyComment"}'),
(2, 'post2', '{"key":"bodyComment222"}');
```
Sempliciamente cancelliamo il nostro database e inseriamo nuovi post. 
<br>
<br>
Ora eseguendo il test possiamo vedere come l'oggetto commento viene loggato correttamente:

```log
2023-01-01T12:13:19.412+04:00  INFO 731173 --- [           main] d.s.j.JsonHibernateApplicationTests      : comment body: {"key":"commentPost"}
2023-01-01T12:13:19.467+04:00  INFO 731173 --- [           main] d.s.j.JsonHibernateApplicationTests      : comment body: {"key":"bodyComment222"}
```
<br>

Tutto qua, il codice completo può essere trovato su [GitHub](https://github.com/s0l0c0ding/spring-tips/tree/master/json-hibernate).
