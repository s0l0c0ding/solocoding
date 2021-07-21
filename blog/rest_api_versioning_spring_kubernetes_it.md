---
published: true
title: Versionamento API REST usando Spring, Kubernetes e Ambassador
description: In questo post, andiamo a costruire un'API REST con diverse versioni, utilizzando Spring per creare l'API stessa, Kubernetes ...
date: 2021-05-14
author: Bassem
slug: it_rest_api_versioning_spring_kubernetes_ambassador
photo: assets/stock/apiversioning.webp
imgCredit:
tweetId: '1393331451265961984'
keywords:
  - spring
  - devops
  - kubernetes
  - ambassador
  - programming
language: it
output:
  html_document:
    css: post-details.component.css
---
In questo post, andiamo a costruire un'API REST con diverse versioni, utilizzando Spring per creare l'API stessa, Kubernetes come nostra infrastruttura di distribuzione ed Ambassador come gateway per la gestione delle rotte.

### Cosa realizziamo?

In questo esempio, creiamo un endpoint rest con diverse versioni: se visitassimo http://localhost:8080/v1/hello, otteniamo "Hello from v1" e quando puntiamo a http://localhost:9090/v2/hello, riceviamo "Hello from v2". Il codice per tutte le versioni e' contenuto nello stesso jar e ogni istanza dell'applicazione serve una versione diversa della rotta in base ad una variabile di ambiente sulla macchina ospitante.

### Perché abbiamo bisogno del controllo di versioni delle API?

Per gestire correttamente le modifiche di grand impatto nella nostra API dobbiamo introdurre il controllo delle versioni, una modifica importante può essere ad esempio:

1. un cambiamento nel formato di risposta per una o più rotta;

2. una modifica all'oggetto di richiesta o risposta;

3. rimozione di una rotta.

Le modifiche non decisive, come l'aggiunta di nuovi endpoint o parametri di risposta, non richiedono un aumento di versione.

### Alcune proprietà e annotazioni di Spring

In questa sezione, esaminiamo le annotazioni e le proprietà che vengono utilizzate successivamente nel codice per raggiungere il nostro obiettivo:

Nel nostro file application.properties, andiamo ad aggiungere la proprietà `server.servlet.context-path`, che definsice il percorso di contesto dell'applicazione. Se mettessimo "v1", tutte le rotte avrebbero il prefisso v1, come mostrato qui: http://localhost:8080/v1/hello.

Il secondo e ultimo passaggio consiste nell'aggiungere `@ConditionalOnProperty` all'implementazione della nostra interfaccia, per consentire la qualificazione di un'implementazione rispetto a un'altra, in base alle proprietà dell'applicazione.

### Codice

Facciamo un'analisi top-down, per cui nel codice sottostante potete trovare un semplice controller che espone un endpoint `Get`:

```java
@RestController
public class HelloController {
    
    private final HelloService helloService;
    
    public HelloController(HelloService helloService) {
        this.helloService = helloService;
    }

    @GetMapping("/hello")
    public  String sayHello(){
        return helloService.sayHello();
    }
}
```

E di seguito il servizio usato:

```java
public interface HelloService {
    String sayHello();
}
```

Per l'implementazione del servizio riportato sopra, abbiamo due varianti. Il primo serve la versione v1 mentre il secondo serve la v2.

```java
@Service
@ConditionalOnProperty(name = "server.servlet.context-path", havingValue = "/v1")
public class HelloServiceImplOne implements HelloService  {
    @Override
    public String sayHello() {
        return "Hello from v1";
    }
}
```

Come potete vedere nella annotazione `@ConditionalOnProperty` stiamo usando `server.servlet.context-path` come condizione per qualificare o meno la classe per il contesto di Spring (dependency injection).

Ed ecco la seconda implementazione, utilizzando la stessa logica:

```java
@Service
@ConditionalOnProperty(name = "server.servlet.context-path", havingValue = "/v2")
public class HelloServiceImplTwo implements HelloService  {
    @Override
    public String sayHello() {
        return "Hello from v2";
    }
}
```

L'ultimo passaggio consiste nel modificare le proprietà dell'applicazione nel modo seguente:

```markup
server.servlet.context-path=${API_VERSION:/v1}
```

La versione è ottenuta da una variabile d'ambiente chiamata "API_VERSION", altrimenti il valore è impostato a "v1".

### Testando con Docker

Per provare  tutto ciò che abbiamo fatto finora, creiamo due  Docker container. Il dockerfile per questa build è disponibile in [GitHub](https://github.com/s0l0c0ding/spring-tips/tree/master/apiversioning). La versione v1 è eseguita sulla porta 8080 e v2 sulla porta 9090. Per avviare i vari container, usiamo i seguenti comandi docker:

```bash
docker run --name apiV1 --env API_VERSION=/v1 -p 8080:8080 -d apiversioning
docker run --name apiV2 --env API_VERSION=/v2 -p 9090:8080 -d apiversioning
```

Con il comando precedente, stiamo creando un container con variabili di ambiente specifiche usando il flag `--env`, mappando la porta dell'applicazione 8080 alla porta 9090 dell host usando il flag `-p`, il container viene eseguito in background con il flag `-d` e stiamo usando la nostra immagine locale 'apiversioning'.

Ora se visitiamo http://localhost:8080/v1/hello, otteniamo "Hello from v1" e quando puntiamo a  http://localhost:9090/v2/hello, otteniamo "Hello from v2 '.

### Testando con Kubernetes and Ambassador

In questa sezione carichiamo l'app in un cluster Kubernetes. Ho usato [MicroK8s](https://microk8s.io/docs) sulla mia macchina ubuntu per questo esercizio.

Per prima cosa iniziamo dal file Deployment yml. "Un [Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) fornisce aggiornamenti dichiarativi per pod e ReplicaSets":

```yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: apiversioning
spec:
  selector:
    matchLabels:
      app: apiversioning
  replicas: 1
  template:
    metadata:
      labels:
        app: apiversioning
        version: v1
    spec:
      containers:
      - name: apiversioning
        image: apiversioning:latest
        imagePullPolicy: IfNotPresent
        resources:
          limits:
            memory: "128Mi"
            cpu: "500m"
        ports:
        - containerPort: 8080
        env:
          - name: API_VERSION
            value: /v1
```

È un file standard, con alcune modifiche:

- Aggiungo "version: v1" alla sezione delle etichette per facilitare l'uso dei selettori;

- Poiché sto utilizzando il registro locale di Microk8s, aggiungo "imagePullPolicy: IfNotPresent". Se questa prop non fosse impostata, bisognerebbe caricare l'immagine in un registro come DockerHup, poiché MicroK8s tenta di scaricare l'immagine da questo registro (configurato come predefinito). Per caricare la nostra immagine locale nel registro di Microk8s, prima dobbiamo salvare l'immagine in un file tar usando il comando `docker save`, successivamente importarla usando `microk8s ctr image import` come segue:

```bash
docker save apiversioning --output api.tar
microk8s ctr image import api.tar
```

- Infine aggiungiamo le variabili d'ambiente nella sezione `env` come coppia chiave/valore.

Come seconda cosa definiamo il servizio di intercomunicazione, un [service](https://kubernetes.io/docs/concepts/services-networking/service/) è "Un modo astratto per esporre un'applicazione in esecuzione su un set di pod come servizio di rete":

```yml
apiVersion: v1
kind: Service
metadata:
  name: apiversioning
spec:
  selector:
    app: apiversioning
    version: v1
  ports:
  - port: 8080
    targetPort: 8080
```

Infine definiamo il mapping per Ambassador:

```yml
apiVersion: getambassador.io/v2
kind: Mapping
metadata:
  name: apiversioning
spec:
  prefix: /api-v1
  service: apiversioning:8080
```

La parte "spec" è la più importante;   il "prefix" indica la rotta, che vogliamo mappare a un servizio kubernetes specifico. Per maggiori dettagli, si può visitare la documentazione ufficiale [qua](https://www.getambassador.io/docs/edge-stack/latest/topics/using/intro-mappings/).

Tutte queste configurazioni devono essere fatte anche per l'applicazione v2, sono le stesse, dobbiamo solo cambiare i punti menzionati finora.

Se non avessi Ambassador abilitato nel tuo Microk8s locale, potresti farlo, eseguendo questo comando:

```bash
microk8s enable ambassador
```

Dopo aver applicato le configurazioni, possiamo visitare http://localhost/api-v1/v1/hello , http://localhost/api-v2/v2/hello e riceviamo i diversi messaggi come abbiamo fatto nella sezione docker.

### Modalità devops

Vale la pena menzionare che puoi sostituire la prop `the server.servlet.context-path` con una personalizzata, come per esempio "version", in questo caso tutto il lavoro di pre-routing viene trasferito ad Ambassador e Spring è responsabile solo dei bean. E cosi togliamo "v1" e "v2" dagli URL: http://localhost/api-v1/hello

Tutto qua, spero che lo troviate utile. Il codice della completa applicazione può essere trovato su [GitHub](https://github.com/s0l0c0ding/spring-tips/tree/master/apiversioning).
