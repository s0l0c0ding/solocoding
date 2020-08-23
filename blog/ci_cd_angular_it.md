---
published: true
title: Integrazione e distribuzione continue nelle applicazioni Angular / Scully
description: Vediamo come implementare i concetti CI / CD utilizzando le azioni Github e Netlify
date: 2020-08-17
author: Bassem
slug: it_angular_ci_cd_githupactions
photo: assets/stock/cicd.webp
imgCredit:
keywords:
  - angular
  - scully
  - devops
language: it
output:
  html_document:
    css: post-details.component.css
---
In questo post condivido con voi come ho implementato i concetti di CI / CD nel mio blog personale costruito con la tecnica JAMstack utilizzando Scully (generatore di siti statici per Angular), Github e Netlify.
<br>
<br>
Quando parliamo di CI, intendiamo integrazione continua; il concetto consiste nell'eseguire una suite di test con ogni push sulla repo per testare il codice scritto. L'obiettivo principale è mantenere la nostra applicazione priva di bug.
<br>
D'altra parte CD sta per distribuzione continua, il processo consiste nell'automatizzare la distribuzione dopo che i test di integrazione sono stati eseguiti correttamente. Il vantaggio è portare rapidamente modifiche al codice e nuove funzionalità in produzione ed avere un feedback degli utenti.
<br>
<br>
**Integrazione continua**
<br>
Questa fase può essere suddivisa in passaggi, il primo è produrre i casi di test, eventualmente per ogni riga di codice. Quando si usa la metodologia TDD (test driven development), è necessario scrivere il test prima di qualsiasi riga di codice (molto utile per ridurre i bug e avere una visione chiara della funzionalità, che si vuole implementare prima di scrivere il codice).
<br>
In Angular, ogni volta che si crea un componente o un servizio utilizzando la CLI; viene generato automaticamente un test con il nome component.spec.ts. La CLI si occupa della configurazione di Jasmine e Karma per noi.
<br>
Vediamo il test per il seguente componente:
```typescript
export class DashboardComponent implements OnDestroy {

  keyword: string;
  subFilter: Subscription;
  linksFiltred$: Observable<any>;

  constructor(private scully: ScullyRoutesService, private route: ActivatedRoute) {
    this.subFilter = this.route.params.subscribe(params => {
      this.keyword = params['categoryId'];
      this.linksFiltred$ = this.scully.available$;
    });
  }

  ngOnDestroy(): void {
    this.subFilter.unsubscribe();
  }
 
  currentTag(link: any): boolean {
…
}
```
Come potete vedere è un componente semplice, ma con alcune dipendenze che devono essere "moccate" nello unit test. Nel costruttore ho iniettato ActivatedRoute per ottenere i parametri associati alla rotta corrente e ScullyRoutesService per avere accesso alle rotte disponibili generate da Scully, in particolare quelle relative ai file markdown.
<br>
Ecco il codice per testare il  DashboardComponent:
```typescript
describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
 
  beforeEach(() => {
    const link = {
      keywords:'angular',
       date: '2020-04-26'
    }
    const params = {
      categoryId: 'angular'
    }

    TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      providers: [
        { provide: ScullyRoutesService, useValue: {
          available$: of([link])
        } },
        { provide: ActivatedRoute, useValue: {
          params: of(params)
        }}
      ]
    });
    
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy;
  });

  it('should inject props', () => {
    expect(component.keyword).toEqual('angular');
  });

  it('should have <li> with "Angular"', () => {
    const bannerElement: HTMLElement = fixture.nativeElement;
    const p = bannerElement.querySelector('li');
    expect(p.textContent).toContain('Angular');
  });
});
```
La maggior parte del codice riportato sopra è generato dalla CLI di  Angular, analizziamolo:
<br>
*BeforeEach / TestBed:* 
<br>
Il `BeforeEach()` è stato usato per evitare duplicazione di codice per la configurazione TestBed. Questa è la parte più importante, perché configuriamo un'istanza del componente che viene testato.
<br>
Come avete visto nel codice del componente, ci sono due servizi iniettati, che al momento devono essere "moccati" o creati come "stub" per isolare il nostro componente. Come potete vedere nella seguente parte di codice, ho creato due "stub" (La differenza principale tra mock e stub è che il mock può essere configurato durante l'esecuzione del test, mentre gli stub sono già configurati con valori predeterminati.) :
```typescript
 TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      providers: [
        { provide: ScullyRoutesService, useValue: {
          available$: of([link])
        } },
        { provide: ActivatedRoute, useValue: {
          params: of(params)
        }}
      ]
    });
```
Per la ScullyRoutesService ho configurato la proprietà "available$" con un observable dell'oggetto "link" utilizzando l'operatore "of" di rxjs, fatto lo stesso con i parametri della proprietà di ActivatedRoute. Una volta definita la configurazione di testBed, creiamo un'istanza con la [ComponentFixture](https://angular.io/guide/testing-components-basics#componentfixture).
<br>
Ora nel seguente test, ci assicuriamo che il nostro componente sia istanziato:
```typescript
it('should create', () => {
    expect(component).toBeTruthy;
  });
```
Un secondo test, è il seguente:
```typescript
it('should inject props', () => {
expect(component.keyword).toEqual('angular');
  });
```
Sto solo assicurando che i miei "stub" vengano iniettati. Quando si testa l'HTML generato,  devi assicurarti di aver chiamato detectChanges prima delle asserzioni (come abbiamo fatto nel blocco BeforeEach) :
```typescript
fixture.detectChanges()
```
Per avere un test affidabile, dovremmo impostare una percentuale  di copertura, più è alta, meglio è, una buona media sarebbe dell'80%. Per abilitare la copertura del codice e la percentuale desiderata, date un'occhiata alla [documentazione ufficiale](https://angular.io/guide/testing-code-coverage).
<br>
Una volta che i test sono pronti e completati, dobbiamo eseguirli contro ogni richiesta di merge o push, si spera prima localmente (eseguire sempre i test prima di fare il push 😀 ) e prima di approvare la richiesta.
<br>
<br>
**GitHup actions**
<br>
L'ultimo passaggio nell'integrazione continua è l'esecuzione automatica della suite di test sviluppata, per questo ho creato un'azione Githup personalizzata. Ecco il mio deployment.yml (deve essere posizionato sotto github/workflows), che sto utilizzando, si basa su un'azione standard node.js:
```yml
name: Node.js CI

on:
  push:
    branches: [ dev, master ]
  pull_request:
    branches: [ master ]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [12.x]

    steps:
    - uses: actions/checkout@v2

    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v1
      with:
        node-version: ${{ matrix.node-version }}

    - name: Cache node modules
      uses: actions/cache@v1
      env:
        cache-name: cache-node-modules
      with:
        path: ~/.npm
        key: ${{ runner.os }}-build-${{ env.cache-name }}-${{ hashFiles('**/package-lock.json') }}
        restore-keys: |
          ${{ runner.os }}-build-${{ env.cache-name }}-
          ${{ runner.os }}-build-
          ${{ runner.os }}-
    - name: Install Dependencies
      run: sudo npm install
    - name: Test
      run: npm run test -- --no-watch --no-progress --browsers=ChromeHeadlessCI
    - name: build app angular
      run: |
        npm run build -- --prod --stats-json
    - name: build static scully
      run: npm run scully -- --scanRoutes --showGuessError
```
 Analizziamolo, partendo dalla configurazione dell'ambiente:
 ```yml
on:
  push:
    branches: [ dev, master ]
  pull_request:
    branches: [ master ]
```
Qui l'azione viene attivata ad ogni push su dev e master e ad ogni pull request sul master (il trigger può essere qualsiasi [GitHub event](https://docs.github.com/en/actions/reference/events-that-trigger-workflows) ).
```yml
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [12.x]
```
Nel codice  sopra decido quale versione del sistema operativo e del node.js da utilizzare nel flusso di lavoro. Vale la pena ricordare che GithupActions supporta anche contenitori Docker personalizzati. E infine ecco i passaggi del flusso di lavoro:
- actions/checkout@v2: utilizzando l'azione standard per clonare il codice;
- Use Node.js ${{ matrix.node-version }}: un'azione incorporata per installare la versione di node desiderata, menzionata nella configurazione di strategia;
- Cache node modules: un'altra azione standard per memorizzare nella cache i moduli di node, per rendere più veloci i flussi di lavoro successivi;
- Install Dependencies: solo un npm install;
- Test: 
```yml
run: npm run test -- --no-watch --no-progress --browsers=ChromeHeadlessCI
```
Stiamo utilizzando npm perché la @angular/cli non è installata, non abbiamo bisogno del report, quindi lo eseguiamo senza il flag di avanzamento e con un browser chrome headless. Quest'ultimo passaggio deve essere configurato nel file di configurazione Karma, karma.conf.js:
```javascript
browsers: ['Chrome'],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
```
- Build app angular: "buildiamo" la nostra app Angular, sto usando il flag state-json, perché è necessario per un plug-in Scully ([scully-plugin-disable-angular](https://github.com/samvloeberghs/kwerri-oss/tree/master/projects/scully-plugin-disable-angular));
- Build static scully: eseguire la build di scully con il flag scanRoutes per scoprire nuovi post/file di markdown.
<br>
<br>

**Deployment continui**
<br>
Il mio blog è su Netlify. È davvero facile automatizzare le distribuzioni con questa piattaforma. Una volta che il repository Github è connesso alla piattaforma con accessi di lettura e scrittura (necessarie per vedere controlli, stati di commit e richieste pull) e la configurazione di "deployment" è stata eseguita correttamente, il sito verrà "buildato" automaticamente con ogni commit. Dopo l'autorizzazione, Netlify viene elencato nella scheda di integrazione del repository su Github.
<br>
<br>
*Deployment settings*
<br>
Ci sono pochi parametri da impostare: 
- Build command: 
  <br>
```npm run build -- --prod --stats-json && npm run scully -- --scanRoutes```
- Publish directory: dist/static/, siccome scully crea le risorse statiche in questa cartella;
- Production branch: il ramo da monitorare per le build, potete anche impostare un'anteprima , se volete;
- Environment variables: NODE_VERSION:12.18.3, dato che Scully lavora con questa versione di node lts.

<br>
Sicuramente ci sono altre funzionalità di Netlify, ma per me questo è sufficiente. Quando voglio pubblicare un nuovo post, devo solo scriverlo sul ramo prod e il sito viene costruito. Quando includo nuove funzionalità, prima lo eseguo sul ramo dev e dopo test riusciti, li riporto in master e infine in prod.
<br>
<br>
E questo è tutto, spero che ti sia utile.



