---
published: true
title: Storing untyped objects with Spring data and MySQL Json Data Type
description: Sometimes we face a requirement where we have to save an unstructured data into our database, in this case we face two issues. The first one .................
date: 2023-01-01
author: Bassem 
slug: eng_spring_json_hibernate
photo: assets/stock/spring_hibernate_mysql.webp
keywords:
  - java
  - spring
  - hibernate
  - mysql
language: en
tweetId: '1611282418253578241'
output:
  html_document:
    css: post-details.component.css
---
Sometimes we face a requirement where we have to save an unstructured data into our database, in this case we face two issues. The first one is the database if you are using a no-sql database, we are on the safe side, if not we have to see if the sql database used support json type columns or not.
<br>
The second issue is the language and the framework, in Java specifically hibernate does not support json type natively.
<br>
In this article we are going to create a demo using mysql 5.7, spring data 3.0.0 and [hypersistence-utils](https://github.com/vladmihalcea/hypersistence-utils) library. This last one will help us in mapping JSON column to a JPA entity.

### Code example
First we creat our table: 
```sql
CREATE TABLE `post` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `body` varchar(255) DEFAULT NULL,
  `comment` json DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
```
In this demo i am using [flywaydb](https://flywaydb.org/), the above-mentioned script will be placed under `src/main/resources/db/migration`, this will help us with initializing of the table and any future modification for the database.
<br>
<br>
In our `pom.xml`, we just need to add the following hypersistence-utils library, in order to map correctly the Json fields.

```xml
		<dependency>
			<groupId>io.hypersistence</groupId>
			<artifactId>hypersistence-utils-hibernate-60</artifactId>
			<version>${hypersistence-utils.version}</version>
		</dependency>
```

Next, we create our entity class `Post` which will represent a blog post as follow:

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
And as you see for the comment object we are using `JsonNode` from `com.fasterxml.jackson` to map the json column.
<br>
<br>
Now we take a look at our repository:

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
Here we use a native query to explore the MySQL Json feature. We defined a method to get a post, which will contain a comment, that have a name `key` with a value equal to the string param comment.
<br>
<br>
Next we create our representation layer:

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
We have two endpoints, one to create the post and other one to get the post based on the comment. 
<br>
<br>
Finally, we can demo our code by the following integration test:

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
In `@SpringBootTest` annotation we define the configuration for our test. To be highlighted we are using `Testcontainers` with a MySQL server, the related configuration can be found in the `TestContainerConfig.class`. 
<br>
For each test we are executing the sql script `init-db.sql`: 

```sql
DELETE FROM post;
INSERT INTO post (id, body, comment)
VALUES
(1, 'post1', '{"key":"bodyComment"}'),
(2, 'post2', '{"key":"bodyComment222"}');
```
Basically we clear our database and insert new posts. 
<br>
<br>
Now running the test we can see how the Json object comment is logged correctly:

```log
2023-01-01T12:13:19.412+04:00  INFO 731173 --- [           main] d.s.j.JsonHibernateApplicationTests      : comment body: {"key":"commentPost"}
2023-01-01T12:13:19.467+04:00  INFO 731173 --- [           main] d.s.j.JsonHibernateApplicationTests      : comment body: {"key":"bodyComment222"}
```
<br>

That's it; all the code written in this article can be found on [GitHub](https://github.com/s0l0c0ding/spring-tips/tree/master/json-hibernate).
