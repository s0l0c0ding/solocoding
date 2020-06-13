---
published: true
title: Implement an entity listener in our SpringBoot application
description: Some times we need to carry out certain actions before saving a record into the database. In this post, we are going to see how to...
date: 2020-06-13
author: Bassem
slug: eng_spring_entity_listener_SpringBoot_SpringDataJpa
photo: assets/stock/listener.webp
imgCredit: Bernin Uben on Unsplash
keywords:
  - spring
  - springDataJpa
language: en
output:
  html_document:
    css: post-details.component.css
---
Some times we need to carry out certain actions before saving a record into the database. In this post, we are going to see how to implement an entity listener in our SpringBoot application using spring data jpa and entity lifecycle callback methods.
<br>

**Project dipendecies**  
In this small project we are going to use the following maven dependencies for the spring boot starter:
- lombock, to reduce the boilerplate code;
- spring data jpa;
- H2, as embedded database.  
<br>

**Entities**  
Working with following entity post, we want to be able to backup the entity every time a persist or an update operation is triggered in our application and increase the version with each modification.
```java
@Entity
public class Post {
    @Id
    @GeneratedValue
    private Long id;
    private String title;
    private String body;
    private Long version;   
}
```
And here is the entity used for the backup, it is the same object with the addition of another long field to store the idPost:
```java
@Entity
public class PostBck {
    @Id
    @GeneratedValue
    private Long id;
    private Long idPost;
    private String title;
    private String body;
    private Long version;

    public PostBck(Post input){..
```
We make also a constructor method to make it easy to convert from a Post object to a PostBck.  
<br>

**Repositories**  
Next step is to create our JPA repositories, to use the standard methods provided:
```java
public interface PostRepo extends JpaRepository<Post, Long> {   
}
```
When we create a repository interface, we must be specific about which module are we going to use. Spring provides separate modules, like MongoRepository or JpaRepository, so it's unideal to extend CrudRepository as it's a generic one.
Then we creat the second repositoriy, in same way:
```java
public interface PostBckRepo extends JpaRepository<PostBck, Long> {
}
```
<br>

**Entity Listener**  
Now we are ready to make our listener, where the entity lifecycle callback methods will be used. The class will be as follow:
```java
@Component
@RequiredArgsConstructor
public class PostListener {

    private final PostBckRepo bckRepo;
    
    @PrePersist
    public void onPrePrist(final Post toSave){
        toSave.setVersion(1L);
    }
    @PostPersist 
    @PostUpdate
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void afterPresist(final Post saved){
        PostBck backup = new PostBck(saved);
        bckRepo.save(backup);
    }
    @PreUpdate
    public void onUpdate(final Post toUpdate){
        toUpdate.setVersion(toUpdate.getVersion()+1);
    }
}
```
Let's break it down:
```java
@Component
@RequiredArgsConstructor
public class PostListener {
    private final PostBckRepo bckRepo;
```
We are qualifying the class for dependency injection by using the @Component annotation, then we inject the PostBckRepo by the constructor to backup the post. The DI is mainly used here for that reason; a listener can also be a normal class without any DI annotations. 
```java
    @PrePersist
    public void onPrePrist(final Post toSave){
        toSave.setVersion(1L);
    }
    @PostPersist 
    @PostUpdate
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void afterPresist(final Post saved){
        PostBck backup = new PostBck(saved);
        bckRepo.save(backup);
    }
```
For the persisting activity, we are making two callbacks, the first one, @PrePersist, is called before flushing the entity into the database. In this method we are making sure that the version is setted to one. The second one annotated with @PostPersist, is saving a copy of the post in the PostBck table.   
<br>
Worth mentioning, that a new transaction is required in order to save the backup entity, because the Java Persistence Api foreseen that, in a lifecycle method we should not invoke an EntityManager or make any query operations. The transaction is obtained with [@Transactional](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/annotation/Transactional.html) annotation, the negative aspect here, if the first transaction (saving the new post) fail, the second (the backup) one will proceed independently.
```java
    @PreUpdate
    public void onUpdate(final Post toUpdate){
        toUpdate.setVersion(toUpdate.getVersion()+1);
    }
```
For the updating activity, we are using the @PreUpdate callback to increase the post's version. Every time we make a change to our entity and call the save method; the entity manger will perform this action before flushing the record into the database.
<br>
A side note, in spring data jpa the save method is used for both persist and merge activity, when the save method is called with an entity without an Id the entity manager will call the persist operation, otherwise (with an existent id) the merge operation will be called.
<br>
<br>
To activate the entity listener, we have to add the @EntityListeners annotation to our entity post, as follow (or include the various callbacks within our entity, when the operations are simple):
```java
@Entity
@EntityListeners(PostListener.class)
@Data
public class Post {
    ..}
```
**Test**  
For this integration test, we are going to use the @DataJpaTest, this consents us to aggressively reduce the spring context, applying only the configuration relevant to JPA tests. The mentioned annotation uses an embedded database as default and all the test's methods are transactional. 
```java
@DataJpaTest
class EntitylistenerApplicationTests {

	@Autowired
	private PostRepo postRepo;
	@Autowired
	private PostBckRepo bckRepo;
```
Before each test we clearly need to delete all the backup records, because all are done in a separate transaction and can't be deleted by the rollback activity of each test:
```java
	@BeforeEach
	void inti(){
		bckRepo.deleteAllInBatch();
	}
```
In the following code, we can see the persist test:
```java
	@Test
	void shouldBckOnPresist() {
		Post toSave = new Post();
		toSave.setBody("body");
		toSave.setTitle("title");
		postRepo.save(toSave);
		postRepo.count(); // to cause flushing
		assertEquals(1, bckRepo.count());
	}
```
We are just saving a new post into the database and asserting that PostBck table at the end of the test contains one element. Take note that we are a making a count query for the post table, to force the entity manger to flush the new record.
<br>
Spring data jpa and most of the JPA implementations mark the entities as dirty in memory, and wait until the last minute (end of a transaction for example) to synchronize all changes with the database. So to force the flushing at a certain point, we need to make a query to our table or use the saveAndFlush method.
<br>
And finally the update test:
```java
	@Test
	void shouldBckonUpdate(){
		Post post = new Post();
		post.setTitle("title");
		post.setBody("body");
		postRepo.saveAndFlush(post);

		post.setTitle("title updated");
		postRepo.save(post);

		postRepo.count();
		assertEquals(2, bckRepo.count());
	}
```
As you can see, we save a new entity, then we update it and at the end we assert that the backup table has two posts (the original and the updated one). I would like to highlight, tha in this case to force the flushing first we used the saveAndFlush(post) and later the count query.
<br>
<iframe width="560" height="315" src="https://www.youtube.com/embed/gAlUJi2Vnbc" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
<br>
That's it; all the code written in this post can be found on [GitHub](https://github.com/s0l0c0ding/spring-tips/tree/master/entitylistener). 