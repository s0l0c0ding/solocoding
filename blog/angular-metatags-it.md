---
published: true
title: Come impostare il titolo e i meta tag nelle applicazioni Angular/Scully
description: Dato che  un'applicazione Angular non può essere avviata (bootstrapped) sull'intero documento HTML, non è possibile utilizzare la tecnica di "data binding" per una proprietà come il titolo, ad esempio.
date: 2020-08-23
author: Bassem
slug: it_angular_titolo_metatag_Angular_Scully
photo: assets/stock/social.webp
imgCredit: NordWood Themes on Unsplash
keywords:
  - angular
  - scully
language: it
output:
  html_document:
    css: post-details.component.css
---

Angular è un framework per la  progettazione di applicazioni web a pagina singola. A volte dobbiamo cambiare il titolo della pagina e i suoi "meta tag", mentre navighiamo da una pagina all'altra.
Dato che  un'applicazione Angular non può essere "bootstrapped" (avviata) sull'intero documento HTML, non è possibile utilizzare la tecnica di "data binding" per una proprietà come il titolo, ad esempio. Quindi, per raggiungere questo obiettivo, facciamo affidamento sui servizi predisposti dal framework, [Title](https://angular.io/api/platform-browser/Title) e [Meta](https://angular.io/api/platform-browser/Meta).  
<br>
In questo articolo, condivido come ho raggiungo questo obiettivo, nel mio blog basato su Angular e [Scully](scully.io). Eseguiamo i seguenti semplici passaggi:
 1. Scriviamo i vari  titoli nell'attributo dati di  [Route](https://angular.io/api/router/Route);
 2. Creazione di un servizio per recuperare il titolo e aggiornarlo sulla nostra pagina utilizzando il servizio Title;
 3. Aggiungiamo tutti i meta tag necessari, al nostro index.html con un contenuto vuoto;
 4. Modifica del servizio, per aggiornare i meta tag, utilizzando il servizio Meta;
 5. Iniettiamo il nuovo servizio in app.component.ts.
<br>

**Route data**
<br>
Nel seguente pezzo di codice, possiamo vedere come si aggiunge l'attributo dati al nostro array di route nel AppRoutingModule:
```typescript
const routes: Routes = [
  { path: '', loadChildren: () => import('./home/home.module').then(m => m.HomeModule), data:{'title': "soloCoding"} },
  { path: 'about', loadChildren: () => import('./about/about.module').then(m => m.AboutModule), data:{'title': "About me"} },
  { path: 'portfolio', loadChildren: () => import('./portfolio/portfolio.module').then(m => m.PortfolioModule), data:{'title': "Portfolio"} },
];
```
**Custom service SocialTagsService**
<br>
Ed ecco come aggiorneremo il nostro titolo "in modo dinamico":
```typescript
@Injectable({
  providedIn: 'root'
})
export class SocialTagsService {

  public constructor(private titleService: Title,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private scully: ScullyRoutesService) {}

    // skipped readonly props

setTitleAndTags() {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.activatedRoute),
      map(route => {
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      filter(route => route.outlet === 'primary')
    ).subscribe(() => {
      this.scully.getCurrent().subscribe(
        link => {
            if (link.title) {
            this.titleService.setTitle(link.title);
             } else {
            this.titleService.setTitle(this.data.title);
            this.titleService.setTitle(title);
            }
        });
    });
  }
}

private get data() { return this.activatedRoute.snapshot.firstChild.data; }
```
Come potete vedere nel codice sopra, dobbiamo importare Router e ActivatedRoute in modo da poter iscriversi agli eventi del router e cambiare il titolo usando il servizio Title, siccome sto usando i moduli, dobbiamo avere un  while loop per arrivare al'ultimo figlio.
<br>
Vale la pena ricordare che il servizio Title fornisce anche un metodo get(), per ottenere il titolo del documento HTML corrente.
<br>
Un'altra cosa da evidenziare è che nel secondo subscribe, sto usando il [Scully service](https://scully.io/docs/scully-lib-core) per decidere se la pagina corrente è generata da un file markdow o meno, semplicemente testando l'attributo title, e se questo ultimo risulta vero, ottengo il titolo, altrimenti uso i dati del percorso.  
<br>
**Aggiunta meta tags**  
Quando una pagina del sito Web viene condivisa su Facebook o Twitter, il portale va alla ricerca di metatag speciali nel nostro documento HTML. L'assenza di questi tag, può causare una cattiva rappresentazione del post. Peggio ancora, Twitter, per esempio mostra solo l'indirizzo web. Nel 2010, Facebook ha introdotto [Open Graph tags](https://ogp.me/) per standardizzare i meta tag, necessari alla condivisione una pagina sui social media.  
<br>
Twitter gestisce la scheda in modo diverso:
"Quando il processore della scheda Twitter cerca i tag in una pagina, per prima cosa va a verifica la proprietà specifica di Twitter e se non fosse presente, controlla le proprietà di Open Graph supportata."  

Ma è necessario avere il seguente tag: 
```html
<meta name="twitter:card" content="summary" />
```
Ulteriori informazioni sono disponibili sulla [documentazione ufficiale ](https://developer.twitter.com/en/docs/tweets/optimize-with-cards/guides/getting-started).  
<br>
Ai fini di questo articolo, ci concentriamo principalmente su immagine, titolo e descrizione. Quindi nella sezione head del nostro index.html aggiungeremo i seguenti meta tag:
```html
  <title></title>
  <meta name="og:title" property="og:title" content="">
  <meta name="og:description" property="og:description" content="">
  <meta name="og:type" property="og:type" content="">
```
**Aggiornamento SocialTagsService**  
Ora torniamo al nostro file typeScript, per modificare il servizio, come prima cosa, iniettiamo il servizio Meta e aggiorniamo i tag nelle rispettive sezionei:
```typescript
export class SocialTagsService {

  public constructor(private titleService: Title,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private scully: ScullyRoutesService,
    private meta: Meta) {}
    // skipping some code
    .subscribe(() => {
      this.scully.getCurrent().subscribe(
        link => {
          if (link?.title) {
            this.titleService.setTitle(link.title);
            this.meta.updateTag({ name: 'og:title', property: 'og:title', content: link.title });
            this.meta.updateTag({ name: 'og:description', property: 'og:description', content: link.description});
            this.meta.updateTag({ name: 'og:image', content: this.urlPrefix+'/'+link.photo });
          } else {
            this.titleService.setTitle(this.data.title);
            this.titleService.setTitle(title);
            this.meta.updateTag({ name: 'og:title', content: title });
            this.meta.updateTag({ name: 'og:description', content: this.tagDescription });
            this.meta.updateTag({ name: 'og:image', content: this.urlPrefix+'/'+this.tagImage });
          }
        });
    });
  }
```
Una cosa da ricordare è che il servizio Meta fornisce anche i metodi remove(), add() e get(). Nel mio caso ho preferito aggiungere tutti i tag con il contenuto vuoto nel index.html e aggiornare il tutto con il servizio, per evitare duplicazione di codice.  
<br>
**Injecting SocialTagsService in AppComponent**  
Il passaggio finale consiste nell'utilizzare il nostro servizio in app.component.ts:
```typescript
export class AppComponent {

  public constructor(private tagsService: SocialTagsService) {
    this.tagsService.setTitleAndTags();
  }
}
```

Infine tutto il codice del SocialTagsService è disponibile su [GitHub](https://github.com/s0l0c0ding/solocoding/tree/master/src/app/services).