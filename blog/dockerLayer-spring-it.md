---
published: true
title: Docker, SpringBoot & Buildpacks
description: In questo post vediamo  gli strati di una immagine per migliorare le prestazioni e il cache del processo di build usando docker files e buildpacks.
date: 2020-07-04
author: Bassem 
slug: it_docker_buildpacks
photo: assets/stock/dockerLayers.webp
imgCredit:
keywords:
  - devops
  - spring
  - docker
language: it
output:
  html_document:
    css: post-details.component.css
---
FInita l'applicazione e siamo pronti per andare online, l'approccio migliore è utilizzare un container, per poter separarla dalla infrastruttura di hardware / software e quando si parla di container è un dovere menzionare Docker.
<br>
<br>
**Docker**
<br>
Bravamente dalla [documentazione ufficiale](https://docs.docker.com/get-started/overview/):
<br>
"Docker offre la possibilità di impacchettare ed eseguire un'applicazione in un ambiente isolato detto container. L'isolamento e la sicurezza consentono di eseguire molti container contemporaneamente su un determinato host. I container sono leggeri perché non necessitano del carico aggiuntivo di un hypervisor, ma vengono eseguiti direttamente sul kernel del computer host. Ciò significa che è possibile eseguire più container su una combinazione hardware rispetto a quando si utilizzano macchine virtuali. Puoi persino eseguire container Docker all'interno di macchine host che sono in realtà macchine virtuali!"
<br>
<br>
**Strati**
<br>
In questo post vediamo  gli strati di una immagine  e gli "build stage" per migliorare le prestazioni e il cache del processo di build. L'immagine docker è composta da diversi livelli/strati, ogni istruzione nel nostro docker file è un livello. I livelli sono precisi perché possono essere riutilizzati da più immagini risparmiando spazio su disco e riducendo i tempi di costruzione mantenendo la loro integrità. Per approfondire l'argomento, potete vedere la [documnetazione](https://docs.docker.com/storage/storagedriver/#images-and-layers).
```dockerfile
FROM openjdk:8-jdk-alpine
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} myApp.jar
ENTRYPOINT ["java","-jar","/myApp.jar"]
```
Nel file docker sopra, il comando "from" indica che usiamo un'immagine basata su Alpine (la distribuzione Linux più leggera), questo è già uno strato che può essere usato in un'immagine diversa per un'altra applicazione, una volta scaricato. Il jar è un altro strato e così via.
<br>
Possiamo sfruttare questa funzione nella nostra applicazione; la nostra app ha abitualmente diverse dipendenze, quindi possiamo far esplodere il nostro jar in diversi livelli.
<br>
Una volta scompattato il jar  (ad esempio in target/dependency), possiamo vedere la seguente struttura:
```bash
 tree -d -L 2
.
├── BOOT-INF
│   ├── classes
│   └── lib
├── META-INF
│   └── maven
└── org
    └── springframework
```
Di conseguenza possiamo creare questo  docker file:
```dockerfile
FROM openjdk:8-jdk-alpine
ARG DEPENDENCY=target/dependency
COPY ${DEPENDENCY}/BOOT-INF/lib /app/lib
COPY ${DEPENDENCY}/META-INF /app/META-INF
COPY ${DEPENDENCY}/BOOT-INF/classes /app
ENTRYPOINT ["java","-cp","app:app/lib/*","package.MainClass"]
```
Nel primo livello abbiamo le dipendenze dell'applicazione, quindi se non cambiassero molto dopo la prima build, il processo sarebbe notevolmente più veloce nelle build successive. Nel secondo livello abbiamo i file  di meta-inf, come pom.xml e MANIFEST.MF. E infine mettiamo le classi della nostra applicazione nella cartella app, poiché sono le più dinamiche e hanno maggiori probabilità di cambiare con ogni nuova funzionalità,  che aggiungiamo alla nostra app (anche durante la correzioni di bug😀). Il '-Cp', o CLASSPATH, viene utilizzato come opzione per il comando Java. È un parametro nel Java Virtual Machine / compilatore Java che specifica la posizione delle classi e pacchetti definiti dall'utente.
<br>
Possimao anche usare docker [multi-stage build](https://docs.docker.com/develop/develop-images/multistage-build/), se volessimo fare il jar dentro il processo di build.
<br>
<br>

**Cloud Native Buildpacks**
<br>
Cloud Native Buildpacks (CNB) è una specifica e un insieme di strumenti. che ci consentono di produrre e gestire fasi di costruzione di container modulari chiamate "buildpack".
<br>
I buildpack sono un altro modo per creare immagini rispetto ai DockerFiles, sono utilizzati in molte piattaforme cloud. Il builder tenta di rilevare automaticamente la lingua del nostro codice sorgente, testando gruppi di buildpack rispetto al codice sorgente. Il primo gruppo che si adatta, diventa il set selezionato di buildpack per l'app e il codice viene convertito in un'immagine docker in automatico.
<br>
In [Cloud Native Buildpacks](https://buildpacks.io/docs/concepts/) il builder è l'immagine che contiene il sistema operativo interno e tutte le informazioni per costruire la nostra app.  
Per usare CNB dobbiamo installare il [pack tool](https://buildpacks.io/docs/install-pack/), seleziona il nostro builder ed eseguire il seguente comando nella directory del nostro progetto maven:
```bash
pack build myapp --builder cnbs/example-builder:bionic
```
<br>

**Maven Plugin & Paketo**
<br>
Quindi devo installare strumenti o creare un builder per usare Buildpacks? La risposta breve è no, il team di spring boot ha fatto il grosso lavoro nel loro [Spring Boot Maven Plugin](https://docs.spring.io/spring-boot/docs/2.3.0.RELEASE/maven-plugin/reference/html/#introduction), dobbiamo solo configurarlo, se volessimo (Spring-boot 2.3+).
<br>
Il plugin usa [Paketo Buildpacks](https://paketo.io/) per creare immagini, garantendo patching continuo in risposta a vulnerabilità e aggiornamenti. Paketo sono:
<br>
>"Buildpack modulari, scritti in Go. Paketo Buildpacks fornisce supporto di runtime linguistico per le applicazioni. Sfruttano il framework Cloud Native Buildpacks per rendere le build di immagini facili, performanti e sicure."
<br>

È possibile trovare il buildpack utilizzato per le app di springboot [qua](https://github.com/paketo-buildpacks/spring-boot),come potete vedere in buildpack.toml, l'immagine di base è un ubuntu bionic.
```markup
[[stacks]]
id = "io.buildpacks.stacks.bionic"
```
```bash
mvn spring-boot:build-image
```
L'esecuzione del comando sopra citato sul nostro progetto crea un'immagine OCI (il formato Open Container Initiative; storicamente, ogni Container Engine aveva il suo formato di immagine del contenitore. Docker, LXD e RKT avevano tutti i loro formati di immagine.) Usando Cloud Native Buildpacks. Il plugin comunica con il docker installato localmente.
<br>
L'immagine prodotta nominata come il nome del artifact del nostro progetto, il tag è la nostra versione ed è composta da un solo livello. Un esempio di output:
```markup
[INFO] --- spring-boot-maven-plugin:2.3.1.RELEASE:build-image (default-cli) @ famous ---
[INFO] Building image 'docker.io/library/famous:0.0.2'
[INFO] 
[INFO]  > Pulling builder image 'gcr.io/paketo-buildpacks/builder:base-platform-api-0.3' 2%
...
INFO]  > Running creator
[INFO]     [creator]     ===> DETECTING
[INFO]     [creator]     5 of 15 buildpacks participating
[INFO]     [creator]     paketo-buildpacks/bellsoft-liberica 2.8.0
[..
[INFO]     [creator]     ===> ANALYZING
[INFO]     [creator]     Previous image with name "docker.io/library/famous:0.0.2" not found
[INFO]     [creator]     ===> RESTORING
[INFO]     [creator]     ===> BUILDING
[INFO]     [creator]     
[INFO]     [creator]     Paketo BellSoft Liberica Buildpack 2.8.0
[INFO]     [creator]       https://github.com/paketo-buildpacks/bellsoft-liberica
[INFO]     [creator]       Build Configuration:
[INFO]     [creator]         $BP_JVM_VERSION              8.*             the Java version
[INFO]     [creator]       Launch Configuration:
[INFO]     [creator]         $BPL_JVM_HEAD_ROOM           0               the headroom in memory calculation
[INFO]     [creator]         $BPL_JVM_LOADED_CLASS_COUNT  35% of classes  the number of loaded classes in memory calculation
[INFO]     [creator]         $BPL_JVM_THREAD_COUNT        250             the number of threads in memory calculation
[INFO]     [creator]       BellSoft Liberica JRE 8.0.252: Contributing to layer
..........
[INFO]     [creator]     Adding layer 'paketo-buildpacks/bellsoft-liberica:security-providers-configurer'
[INFO]     [creator]     Adding layer 'paketo-buildpacks/executable-jar:class-path'
[INFO]     [creator]     Adding 1/1 app layer(s)
[INFO]     [creator]     Adding layer 'config'
[INFO]     [creator]     *** Images (260763d35c24):
[INFO]     [creator]           docker.io/library/famous:0.0.2
[INFO] 
[INFO] Successfully built image 'docker.io/library/famous:0.0.2'
[INFO] 
```
Come potete vedere dai log, molte cose sono configurate in autonomia, ad esempio la versione java.
<br>
Possiamo cambiare il nome dell'immagine usando il parametro "name" nella configurazione del plugin:
```xml
<configuration>
	<image>
		<name>example.com/library/${project.artifactId}</name>
	</image>
</configuration>
```
E aggiungendo la proprietà `<layers>` nel nostro pom.xml, stiamo separando BOOT-INF / classes e BOOT-INF / lib:
```xml
<build>
	<plugins>
		<plugin>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-maven-plugin</artifactId>
			<version>2.3.0.RELEASE</version>
			<configuration>
        		<layers>
					<enabled>true</enabled>
				</layers>
			</configuration>
		</plugin>
	</plugins>
</build>
```


Per default, sono definiti i seguenti livelli:
- *dependencies* per qualsiasi dipendenza la cui versione non è SNAPSHOT.
- *spring-boot-loader* per le classi del jar loader.
- *snapshot-dependencies* per le dipendenze con versione SNAPSHOT.
- *application* per le risorse e le classi della nostra applicazione.
<br>

Quando eseguiamo nuovmente il builder, vediamo i segeunti strati: 
```markup
...
[INFO]     [creator]     Adding layer 'paketo-buildpacks/executable-jar:class-path'
[INFO]     [creator]     Adding layer 'paketo-buildpacks/spring-boot:web-application-type'
[INFO]     [creator]     Adding 5/5 app layer(s)
...
```
L'ordine dei livelli è molto importante per il processo di caching. Le librerie di terze parti, non cambiano frequentemente, per cui vanno per primo. Possiamo personalizzare tutto il processo con l'aggiunta di [layers.xml](https://docs.spring.io/spring-boot/docs/2.3.0.RELEASE/maven-plugin/reference/html/#repackage-layers-configuration) e la proprietà `<configuration>` nella configurazione del plugin:
```xml
...
<configuration>
	<layers>
		<enabled>true</enabled>
		<configuration>${project.basedir}/src/layers.xml</configuration>
	</layers>
</configuration>
...
```
Per più personalizzazione come variabili di ambiente, cache e altri, date una occhiata alla [documentazione](https://docs.spring.io/spring-boot/docs/2.3.0.RELEASE/maven-plugin/reference/html/#build-image-customization).
<br>
Tutto qua; spero che lo troviate utile. 