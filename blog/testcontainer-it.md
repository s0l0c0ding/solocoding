---
published: true
title: Automatizzare docker containers con la libreria testcontainer
description: In questo articolo, vediamo come avviare un contenitore Postgres con alcuni dati inizializzati, quando lanciamo un test di integrazione.
date: 2020-07-19
author: Bassem 
slug: it_docker_testcontainer
photo: assets/stock/testcontiner.webp
imgCredit:
keywords:
  - devops
  - spring
  - docker
  - junit
language: it
output:
  html_document:
    css: post-details.component.css
---
Quando arriva il momento di eseguire un test di integrazione, la scelta migliore è di eseguirlo in un ambiente isolato estremamente simile a quello di produzione.
<br>
<br>
In questo post parliamo del fattore database. Molti sviluppatori utilizzano un db "embedded" o uno reale sul server di sviluppo, ma i contenitori Docker sono il modo migliore per avere un database isolato localmente, esiste un'immagine per quasi tutti i database, PostgreSQL, Oracle, MongoDb, ecc.
<br>
È possibile scrivere script per eseguire il contenitore, quando si avvia il test di integrazione (con tutti i parametri necessari), è possibile anche farlo manualmente; ma perché fare tutto questo a mano, se esiste un ottima libreria open source per progetti Java che fa esattamente questo e altro ancora. È Testcontainer.
<br>
<br>
**Testcontainers**
<br>
" [Testcontainers](https://www.testcontainers.org) è una libreria Java che supporta i test JUnit, fornendo istanze leggere e usa e getta di database comuni, browser Web Selenium o qualsiasi altra cosa che possa essere eseguita in un contenitore Docker. "
<br>
In questa demo sto facendo un test di integrazione per un'applicazione SpringBoot con postgreSQL come database. Mi concentro principalmente sul pacchetto di test e sulla configurazione necessaria per avviare un contenitore Postgres all'avvio del test.
<br>
<br>
**POM**
<br>
È una standard pom.xml generata tramite [Spring Initializr](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.3.1.RELEASE&packaging=jar&jvmVersion=11&groupId=com.example&artifactId=demo&name=demo&description=Demo%20project%20for%20Spring%20Boot&packageName=com.example.demo&dependencies=postgresql,jdbc):
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
Abbiamo il driver e la dipendenza starter-jdbc per fare qulache query. Per la testcontainer, come vedete includiamo il modulo specifico di "postgresql" e la libreria stessa sotto l'artifactId "testcontainer".
<br>
Esistono molti altri moduli, come MongoDb, Oracle, ecc. Consultate la [documentazione](https://www.testcontainers.org/modules/databases/) per il modulo desiderato.
<br>
<br>
**Obiettivo**
<br>
Vogliamo avviare un contenitore Postgres con alcuni dati inizializzati, quando lanciamo il test. Nel seguente test di integrazione, stiamo eseguendo due controlli, il primo per garantire che i nostri dati siano effettivamente presenti e il secondo è solo un aggiornamento.
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
Nell'annotazione @SpringBootTest ho aggiunto la classe TestContainerConfig, per includere la configurazione di testcontainer nel contesto dell'applicazione.
<br>
<br>
**Configurazione TestContainer**
<br>
La classe di configurazione è estremamente semplice:
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
Potremmo annotare la classe con @Configuration, ma l'abbiamo già inclusa con:
```java
@SpringBootTest(classes = {DemoApplication.class, TestContainerConfig.class})
```
Usiamo @ClassRule per ottenere un contenitore isolato per tutti i metodi nella classe di test (potete anche rimuoverlo, è necessario se avviate il contenitore nella classe di test). Nel costruttore PostgreSQLContainer abbiamo aggiunto l'immagine docker che viene utilizzata, in questo caso, è una postgres: 9.6.18-alpine. In "withInitScript" indichiamo lo script sql iniziale da eseguire all'interno del database. Esistono molte altre funzionalità, ad esempio potremmo eseguire comandi nel contenitore con il parametro "execInContainer". Per maggiori dettagli su tutte le possibili configurazioni, date una occhiata alla [doc](https://www.testcontainers.org/features/commands/).
<br>
E infine viene definito il bean di "datasource". Per avere tutti i dati relativi al contenitore, prima dobbiamo avviarlo e poi impostiamo tutti i parametri. Il contenitore viene arrestato e rimosso all'arresto dell'applicazione. Vale la pena ricordare che, la porta del host sarà sempre casuale, per evitare conflitti con altre applicazioni in esecuzione, per ottenere l'accesso alla porta del host è necessario utilizzare:
```java
postgre.getMappedPort(5432); //porta interna del container
```
Nello script sql, sto creando una nuova tabella e inserendo alcuni dati:
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
Ora eseguendo il testo, possiamo vedere il seguente log:
```markup
2020-07-18 11:15:54.522  INFO 7325 --- [           main] org.testcontainers.DockerClientFactory   : ✔︎ Docker server version should be at least 1.6.0
2020-07-18 11:15:55.019  INFO 7325 --- [           main] org.testcontainers.DockerClientFactory   : ✔︎ Docker environment should have more than 2GB free disk space
2020-07-18 11:15:55.066  INFO 7325 --- [           main] 🐳 [postgres:9.6.18-alpine]              : Creating container for image: postgres:9.6.18-alpine
2020-07-18 11:15:55.147  INFO 7325 --- [           main] 🐳 [postgres:9.6.18-alpine]              : Starting container with ID: c7818de6d721..
2020-07-18 11:15:55.914  INFO 7325 --- [           main] 🐳 [postgres:9.6.18-alpine]              : Container postgres:9.6.18-alpine is starting: c7818de6d721..
2020-07-18 11:16:00.556  INFO 7325 --- [           main] 🐳 [postgres:9.6.18-alpine]              : Container postgres:9.6.18-alpine started in PT9.149459S
2020-07-18 11:16:00.572  INFO 7325 --- [           main] org.testcontainers.ext.ScriptUtils       : Executing database script from init-db.sql
```
La prima volta l'immagine viene scaricata dal registro pubblico di docker (assicuratevi di aver effettuato l'accesso al registro desiderato se ci fosse bisogno con il commando 'docker login link').
<br>
<br>
Tutto qua, spero che lo troviate utile. Il codice scritto in questo articolo può essere trovato su [GitHub](https://github.com/s0l0c0ding/spring-tips/tree/master/testcontainer).