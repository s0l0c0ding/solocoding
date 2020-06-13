---
published: true
title: Implementare un "entity listener" nella nostra applicazione SpringBoot
description: In questo post, vediamo come implementare un "entity listener" nella nostra applicazione SpringBoot, utilizzando i metodi di callback..
date: 2020-06-13
author: Bassem
slug: it_spring_entity_listener_SpringBoot_SpringDataJpa
photo: assets/stock/listener.webp
imgCredit: Bernin Uben on Unsplash
keywords:
  - spring
  - springDataJpa
language: it
output:
  html_document:
    css: post-details.component.css
---
Qualche volta risulta necessario eseguire determinate azioni prima di inserire un record nel database. In questo post, vediamo come implementare un "entity listener" nella nostra applicazione SpringBoot, utilizzando i metodi di callback e Spring Data Jpa.
<br>

**Dipendenze del progetto**  
In questo piccolo progetto usiamo le seguenti dipendenze maven per l'spring boot starter:  
- lombock, per ridurre il codice;
- spring data jpa;
- H2, come embedded data base.  
<br>

**Entità**  
Lavorando con la seguente entità post , vogliamo essere in grado di eseguire un backup dell'entità ogni volta che viene eseguita un'operazione di aggiornamento o persistenza nella nostra applicazione e aumentare la versione con ogni modifica.
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
Ed ecco l'entità utilizzata per il backup, è lo stesso oggetto con l'aggiunta di un altro campo long per memorizzare l'idPost:
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
Realizziamo anche un metodo costruttore, per facilitare la conversione da un oggetto Post a PostBck.
<br>

**Repositories**  
Il prossimo passo è creare i nostri repository JPA, per utilizzare i metodi standard disponibili:
```java
public interface PostRepo extends JpaRepository<Post, Long> {   
}
```
Quando creiamo un'interfaccia repository, dobbiamo essere specifici su quale andiamo ad utilizzare. Spring fornisce moduli separati, come MongoRepository o JpaRepository, quindi non è ideale estendere CrudRepository in quanto è generica. Dopo creiamo il secondo repository, allo stesso modo:
```java
public interface PostBckRepo extends JpaRepository<PostBck, Long> {
}
```
<br>

**Entity Listener**  
Ora siamo pronti per creare il nostro listener, in cui verranno utilizzati i metodi di callback del ciclo di vita della nostra entità. La classe è cosi composta:
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
Analizziamola:
```java
@Component
@RequiredArgsConstructor
public class PostListener {
    private final PostBckRepo bckRepo;
    private PostBck backup;
```
Stiamo qualificando la classe per la "dependency injection" utilizzando l'annotazione @Component, e iniettiamo la PostBckRepo con il costruttore per poter eseguire il backup del post. La DI viene utilizzata qua principalmente per questo motivo; un "listener" può anche essere una classe normale senza alcuna annotazione di DI.
```java
    @PrePersist
    public void onPrePrist(final Post toSave){
        toSave.setVersion(1L);
    }
    @PostPersist 
    @PostUpdate
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void afterPresist(final Post saved){
        backup = new PostBck(saved);
        bckRepo.save(backup);
    }
```
Per l'attività di preesistenza, stiamo effettuando due callback, il primo, annotato con @PrePersistis, viene chiamato prima di salvare l'entità nel database. In questo metodo ci assicuriamo che la versione sia valorizzata con uno. Il secondo metodo annotato con @PostPersist, sta effettuando una copia del post nella tabella PostBck.
<br>
Vale la pena ricordare, che è necessaria una nuova transazione per salvare l'entità di backup, poiché la Java Persistence Api prevede che, in un metodo di "callback", non dovrebbe essere invocato un EntityManager o eseguite operazioni di query. La transazione si ottiene con l'annotazione [@Transactional](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/annotation/Transactional.html), l'aspetto negativo di questo approccio, se la prima transazione (salvataggio del nuovo post) fallisse, la seconda (il backup) procederebbe in modo indipendente.
```java
    @PreUpdate
    public void onUpdate(final Post toUpdate){
        toUpdate.setVersion(toUpdate.getVersion()+1);
    }
```
Per l'attività di aggiornamento, stiamo utilizzando il callback @PreUpdate per aumentare la versione del post in modo automatico. Ogni volta che apportiamo una modifica alla nostra entità e chiamiamo il metodo save; il gestore entità esegue questa azione prima di salvare il record nel database.
<br>
Una nota a parte, in spring data jpa, il metodo save viene utilizzato sia per l'attività "persist" che "merge"; quando il metodo save viene chiamato con un'entità senza un Id l' entity manager chima l'operazione di "persist", altrimenti (con un Id esistente) l'operazione di "merge" viene chiamata.
<br>
<br>
Per attivare il "listener", dobbiamo aggiungere l'annotazione @EntityListeners al nostra entità post, come segue (o portare i vari callback all'interno della nostra entità, quando le operazioni sono semplici):
```java
@Entity
@EntityListeners(PostListener.class)
@Data
public class Post {
    ..}
```
**Test**  
Per questo test di integrazione, usiamo @DataJpaTest, questo ci consente di ridurre al minimo il contesto Spring, applicando solo la configurazione relativa ai test JPA. L'annotazione menzionata utilizza un database incorporato e tutti i metodi di test sono transazionali. 
```java
@DataJpaTest
class EntitylistenerApplicationTests {

	@Autowired
	private PostRepo postRepo;
	@Autowired
	private PostBckRepo bckRepo;
```
Prima di ogni test è necessario eliminare chiaramente tutti i record di backup, poiché tutti sono eseguiti in una transazione separata e non possono essere eliminati dall'attività di rollback di ciascun test:
```java
	@BeforeEach
	void inti(){
		bckRepo.deleteAllInBatch();
	}
```
Nel seguente codice, possiamo vedere il test di "persist":
```java
	@Test
	void shouldBckOnPresist() {
		Post toSave = new Post();
		toSave.setBody("body");
		toSave.setTitle("title");
		postRepo.save(toSave);
		postRepo.count();
		assertEquals(1, bckRepo.count());
	}
```
Stiamo solo salvando un nuovo post nel database e verifichiamo che la tabella PostBck alla fine del test contenga un solo elemento. Da notare, che stiamo eseguendo una query di conteggio per la tabella di post,  per forzare l' "entity manger" ad inserire il nuovo record.
<br>
Spring data jpa e la maggior parte delle implementazioni JPA contrassegnano le entità come sporche in memoria e attendono l'ultimo minuto (ad esempio la fine di una transazione) per sincronizzare tutte le modifiche con il database. Perciò per forzare il "flushing" ad un certo punto, dobbiamo fare una query sulla nostra tabella o usare il metodo saveAndFlush.
<br>
<br>
E infine il test di aggiornamento:
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
Come potete vedere, salviamo una nuova entità, poi la aggiorniamo e alla fine ci assicuriamo che la tabella di backup ha due post (quello originale e quello aggiornato). Vorrei evidenziare che, in questo caso, per forzare il l'inserimento, prima abbiamo usato saveAndFlush (post) e dopo la query di conteggio.
<br>
Tutto qua, il codice completo può essere trovato su [GitHub](https://github.com/s0l0c0ding/spring-tips/tree/master/entitylistener).
<br>
<iframe width="560" height="315" src="https://www.youtube.com/embed/nLLyKkXRe0Y" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
<br>