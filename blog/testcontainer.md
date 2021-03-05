---
published: true
title: Automate docker containers with testcontainer library
description: In this article, we will see how to start a postgres container with some initialized data, when we launch an integration test.
date: 2020-07-19
author: Bassem 
slug: eng_docker_testcontainer
photo: assets/stock/testcontiner.webp
imgCredit:
keywords:
  - devops
  - spring
  - docker
  - junit
language: en
tweetId: '1303254554721607680'
output:
  html_document:
    css: post-details.component.css
---
When arrives the time to perform an integration test to our microservice, the best choice is to make it in an isolated environment extremely similar to the production one.
<br>
<br>
In this post I am going to discuss about the database factor. Many developers use an embedded db or an actual one deployed on the development server, but Docker containers are the best way to have an isolated database locally, there is an image for almost every database, PostgreSQL, Oracle, MongoDb, etc.
<br>
You can write scripts to run the container, when you launch the integaration test (with all parameters needed), you can do it manually; but why do all this stuff by your self, if there is a great open source library for Java projects that do exactly this work and more. It's Testcontainers.
<br>
<br>
**Testcontainers**
<br>
" [Testcontainers](https://www.testcontainers.org) is a Java library that supports JUnit tests, providing lightweight, throwaway instances of common databases, Selenium web browsers, or anything else that can run in a Docker container. "
<br>
In this demo I am making an integration test to an spring boot application with postgreSQL as a database. I will focus mainly on the test package and the configuration needed to launch a postgres container with the test.
<br>
<br>
**POM**
<br>
It is a standard pom.xml generated from [Spring Initializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.3.1.RELEASE&packaging=jar&jvmVersion=11&groupId=com.example&artifactId=demo&name=demo&description=Demo%20project%20for%20Spring%20Boot&packageName=com.example.demo&dependencies=postgresql,jdbc):
```xml
<dependencies>
    <dependency>
      <groupId>org.postgresql</groupId>
      <artifactId>postgresql</artifactId>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-jdbc</artifactId>
      <scope>compile</scope>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
      <exclusions>
        <exclusion>
          <groupId>org.junit.vintage</groupId>
          <artifactId>junit-vintage-engine</artifactId>
        </exclusion>
      </exclusions>
    </dependency>
    <dependency>
      <groupId>org.testcontainers</groupId>
      <artifactId>postgresql</artifactId>
      <version>1.14.3</version>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>org.testcontainers</groupId>
      <artifactId>testcontainers</artifactId>
      <version>1.14.3</version>
      <scope>test</scope>
    </dependency>
  </dependencies>
```
We have the driver and the starter-jdbc dependency to perform some queries. For the testcontainers lib, you can see the specific targeted module under "postgresql" artifactId and the actual library under "testcontainers". 
<br>
There are many other modules, like MongoDb, Oracle, etc. Consult the [documentation](https://www.testcontainers.org/modules/databases/) for your desired one.
<br>
<br>
**Goal**
<br>
We want to start a postgres container with some initialized data, when we launch the test. In the following integration test, we are making two checks, the first one to enure that our data is actually there and the second one is just an update.
```java
@SpringBootTest(classes = {DemoApplication.class, TestContainerConfig.class})
class DemoApplicationTests {

	@Autowired
	private JdbcTemplate jdbc;

	 @Test
	 void shouldRead(){
		 int count = jdbc.queryForObject("SELECT COUNT(*) FROM POST", Integer.class);
		assertEquals(2, count);
	 }

	 @Test
	 void shouldModify(){
		var update = jdbc.update("UPDATE POST SET title='first' WHERE id=1");
		assertEquals(1, update);
	 }
}
```
In the @SpringBootTest annotation I added the TestContainerConfig class, to include the testcontainer configuration in the application context.
<br>
<br>
**TestContainer configuration**
<br>
The configuration class is extremely simple:
```java
public class TestContainerConfig {

    @ClassRule
    private PostgreSQLContainer<?> postgre = new PostgreSQLContainer<>("postgres:9.6.18-alpine")
    .withInitScript("init-db.sql");
    
    @Bean
    public DataSource getDataSource(){
        postgre.start();
        var dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(postgre.getJdbcUrl());
        dataSource.setUsername(postgre.getUsername());
        dataSource.setPassword(postgre.getPassword());
        return dataSource;
    }
}
```
We could annotate the class with @Configuration, but we already included it with:
```java
@SpringBootTest(classes = {DemoApplication.class, TestContainerConfig.class})
```
We use the @ClassRule to get an isolated container for all the methods in the test class (you can also remove it, it's necessary if you start the container in the test class). In the PostgreSQLContainer constructor we added the docker image which will be used, in this case, it's a postgres:9.6.18-alpine. In "withInitScript" we indicate the initial sql script to be run into the database. There are many other features, for example we could execute commands in the container with "execInContainer" parameter. For more details about all the possible configuration, you can consult the [docs](https://www.testcontainers.org/features/commands/).
<br>
And finally the datasource bean is defined. To have all the data related to the container, first we need to start it and then we set all the parameters. The container will be stopped and removed when the application exits. Worth mentioning that by design the host port will always be a random one, to avoid conflicts with other application running; to get access to the host port we need to use:
```java
postgre.getMappedPort(5432); //internal container port
```
In the sql script, I am making a new table and inserting some data:
```markup
CREATE TABLE POST(
   ID INT PRIMARY KEY     NOT NULL,
   TITLE VARCHAR,
   BODY VARCHAR 
);
INSERT INTO POST (ID, TITLE, BODY)
VALUES
(1, 'Column2_Value', 'Column3_Value'),
(2, 'Column2_Value', 'Column3_Value');
```
Now when run the test, we can see the following log:
```markup
2020-07-18 11:15:54.522  INFO 7325 --- [           main] org.testcontainers.DockerClientFactory   : ✔︎ Docker server version should be at least 1.6.0
2020-07-18 11:15:55.019  INFO 7325 --- [           main] org.testcontainers.DockerClientFactory   : ✔︎ Docker environment should have more than 2GB free disk space
2020-07-18 11:15:55.066  INFO 7325 --- [           main] 🐳 [postgres:9.6.18-alpine]              : Creating container for image: postgres:9.6.18-alpine
2020-07-18 11:15:55.147  INFO 7325 --- [           main] 🐳 [postgres:9.6.18-alpine]              : Starting container with ID: c7818de6d721..
2020-07-18 11:15:55.914  INFO 7325 --- [           main] 🐳 [postgres:9.6.18-alpine]              : Container postgres:9.6.18-alpine is starting: c7818de6d721..
2020-07-18 11:16:00.556  INFO 7325 --- [           main] 🐳 [postgres:9.6.18-alpine]              : Container postgres:9.6.18-alpine started in PT9.149459S
2020-07-18 11:16:00.572  INFO 7325 --- [           main] org.testcontainers.ext.ScriptUtils       : Executing database script from init-db.sql
```
At the first time the image will be pulled from the public docker registry (make sure that your are logged into your registry if needed with 'docker login link').
<br>
<br>
That is it I hope you find it useful; all the code written in this post can be found on [GitHub](https://github.com/s0l0c0ding/spring-tips/tree/master/testcontainer).
<br>
<iframe width="560" height="315" src="https://www.youtube.com/embed/NWKYJVk_udU" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
<br>