---
published: true
title: Annotazioni custom con Spring
description: In questo post vediamo la differenza tra le annotazioni `@Repository`, `@Service`, `@Configuration` e `@Controller` e come crearne una personalizzata ...
date: 2022-06-06
author: Bassem
slug: it_spring_custom_annotaions
photo: assets/stock/custom-annotation.webp
imgCredit:
keywords:
  - spring
  - programming
language: it
output:
  html_document:
    css: post-details.component.css
---
In questo post vediamo la differenza tra le annotazioni `@Repository`, `@Service`, `@Configuration` e `@Controller` e come crearne una personalizzata, in modo che le nostre classi siano inizializzate nel contenitore Spring IoC ([Inversion of Control](https://docs.spring.io/spring-framework/docs/3.2.x/spring-framework-reference/html/beans.html)) come qualsiasi classe annotata con tali annotazioni.
<br>
Creando annotazioni personalizzate per le dipendenze, possiamo isolare il nostro livello di logica (cuore dell'applicazione) dal framework utilizzato. Se volessimo migrare la nostra applicazione su un altro framework, dovremmo solo modificare quelle annotazioni senza toccare i vari servizi.
<br>
Prima di tutto, le annotazioni sopra menzionate e  la `@Component` sono annotazioni comuni di "Bean" e utilizzate come tipologia per qualsiasi componente gestito da Spring. Le classi annotate verranno rilevate automaticamente tramite la scansione iniziale fatta da Spring.
<br>

### Qual è la differenza?

In realtà, non c'è una grande differenza tra `@Repository`,  `@Service`,  `@Configuration` e `@Controller`, tutti sono annotati con `@Component`. Si può vedere il codice dell'annotazione `@Service` nel seguente snippet:

```java
package org.springframework.stereotype;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.core.annotation.AliasFor;

@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Component
public @interface Service {

	@AliasFor(annotation = Component.class)
	String value() default "";

}
```

Sono usati per differenziare gli strati:

- `@Service`, per le classi di logica di business;

- `@Controller`, per il livello di rappresentazione;

- `@Configuration`, per qualsiasi configurazione;

- `@Repository`, per le classi di accesso alle base dati. Un'eccezione qui, Spring fornisce automaticamente un PersistenceExceptionTranslationPostProcessor (che è necessario), rendendo la classe idonea per le eccezioni Spring DataAccessException.

### Cosa costruiremo?

Creiamo un'annotazione di servizio personalizzata chiamata `@OurCustomService`, che viene utilizzata per annotare le nostre classi di servizio e renderle idonee per il contenitore IoC di Spring.

### Esempio

Prima di tutto, nel nostro pom.xml abbiamo bisogno della seguente dipendenza:

```xml
<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter</artifactId>
</dependency>
```

Ora creiamo la nostra annotazione personalizzata:

```java
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.core.annotation.AliasFor;
import org.springframework.stereotype.Component;

@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Component
public @interface OurCustomService {
    
    @AliasFor(annotation = Component.class)
	String value() default "";
    
}
```

È una copia dell'annotazione Spring `@Service`. Da notare che l'interfaccia stessa è annotata con `@Component`.
<br>

Quindi creiamo il nostro livello di servizio creando un'interfaccia e la sua implementazione. Quest'ultimo è annotato con `@OurCustomService`:

```java
public interface DemoService {
    
    void print();
    
}
```

```java
@OurCustomService
public class DemoServiceImpl  implements DemoService {

    private static final Logger log = LoggerFactory.getLogger(DemoServiceImpl.class);

    @Override
    public void print() {
       log.info("""
               This Message is from:
                DemoService
               """); 
    }
    
}
```

Infine, testiamo il nostro codice nella classe main, cercando il `ApplicationContext` per il nostro bean `DemoServiceImpl`:

```java
@SpringBootApplication
public class CustomAnnotaionsApplication {

	public static void main(String[] args) {
		SpringApplication.run(CustomAnnotaionsApplication.class, args);
	}

	@Component
	class StartUp implements CommandLineRunner {

		@Autowired
		private ApplicationContext applicationContext;
		@Autowired
		private DemoService demo;

		private static final Logger log = LoggerFactory.getLogger(StartUp.class);

		
		@Override
		public void run(String... args) throws Exception {
			demo.print();
			log.info("""
					Found the custom service witn name: {} 
					""", List.of(applicationContext.getBeanNamesForType(DemoService.class)).stream().collect(Collectors.joining(" , ")));
			
		}

	}
}
```

Quando eseguiamo la nostra applicazione, possiamo trovare l'invocazione nei log:

```markup
2022-06-04 18:25:40.930  INFO 51696 --- [           main] d.s.c.service.DemoServiceImpl            : This Message is from:
 DemoService

2022-06-04 18:25:40.931  INFO 51696 --- [           main] .s.c.CustomAnnotaionsApplication$StartUp : Found the custom service witn name: demoServiceImpl
```

Tutto qua, spero che lo troviate utile. Il codice della completa applicazione può essere trovato su [GitHub](https://github.com/s0l0c0ding/spring-tips/tree/master/custom-annotaions).
