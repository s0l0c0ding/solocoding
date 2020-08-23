---
published: true
title: Setting up the title and the meta tags in Angular/Scully applications
description: Angular application can't be bootstrapped on the entire HTML document,it is not possible to use the data binding technique for a property like the title for instance.
date: 2020-08-23
author: Bassem
slug: eng_angular_title_meta_tags_Angular_Scully
photo: assets/stock/social.webp
imgCredit: NordWood Themes on Unsplash
keywords:
  - angular
  - scully
language: en
output:
  html_document:
    css: post-details.component.css
---

Angular is an application design framework for building a single page apps. Sometimes we have to change the page title and its meta tags, as we navigate through the pages.  
Since an Angular application can't be bootstrapped on the entire HTML document it is not possible to use the data binding technique for a property like the title for instance. So to achieve such goals, we are going to rely on the [Title](https://angular.io/api/platform-browser/Title) and the [Meta](https://angular.io/api/platform-browser/Meta) services.  
<br>
In this article, I am going to share how I reached this target, in my blog based on Angular and [Scully](scully.io). We are going through the following steps:
 1. Storing the different titles in the [route's](https://angular.io/api/router/Route) data attribute;
 2. Creating a service to retrieve the title and update it on our page using the Title service;
 3.  Adding all the meta tags needed to our index.html with a blank content;
 4.  Modify the service, in order to update the meta tags using the Meta service;
 5.  Injecting the new service in app.component.ts.
<br>

**Route's data**
<br>
In the following code snippet, we can see how we add the data attribute to our Routes array in the AppRoutingModule:
```typescript
const routes: Routes = [
  { path: '', loadChildren: () => import('./home/home.module').then(m => m.HomeModule), data:{'title': "soloCoding"} },
  { path: 'about', loadChildren: () => import('./about/about.module').then(m => m.AboutModule), data:{'title': "About me"} },
  { path: 'portfolio', loadChildren: () => import('./portfolio/portfolio.module').then(m => m.PortfolioModule), data:{'title': "Portfolio"} },
];
```
**Custom service SocialTagsService**
<br>
And here how we are going to update our title "dynamically": 
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
As you can see in the above code, we need to import Router and ActivatedRoute so that we can subscribe to the router events and change the title using the Title service, also as I am using modules in my app, we need to have the while loop to find the last child.
<br>
Worth mentioning that the Title service provide also a get() method, to obtain the title of the current HTML document.
<br>
Another thing to higlight, is that in the second subscribe, I am using the [Scully service](https://scully.io/docs/scully-lib-core) to decide if the current page is generated from a markdow file or not, simply by testing the title attribute, and if this results in a true, i get the title from here, otherwise I use the route's data.  
<br>
**Adding meta tags**  
When a website page is shared on Facebook or Twitter, the web application starts looking for special meta tags in our HTML document. The absence of these tags, may leads to a bad visulation. Worse, Twitter will only display the web address. In 2010, Facebook introduced [Open Graph tags](https://ogp.me/) to standardize meta tags, needed when a page is shared on social media.  
<br>
Twitter handels the card diffrently:  
"When the Twitter card processor looks for tags on a page, it first
checks for the Twitter-specific property, and if not present, falls
back to the supported Open Graph property."  

But the card tag is needed: 
```html
<meta name="twitter:card" content="summary" />
```
More information can be found on [Twitter docs](https://developer.twitter.com/en/docs/tweets/optimize-with-cards/guides/getting-started).  
<br>
For the purpose of this article, we’ll focus mainly on image, title, and description. So in the head section in our index.html we are going to add the following meta tags:
```html
  <title></title>
  <meta name="og:title" property="og:title" content="">
  <meta name="og:description" property="og:description" content="">
  <meta name="og:type" property="og:type" content="">
```
**Update SocialTagsService**  
Now we return to our typeScript file, to modify the service, first we inject the Meta service and the we update the tags in the respective section:
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
            this.titleService.setTitle(this.data.title);
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
One thing to remind is that, the Meta service provides also remove(), add() and get() methods. In my case I preferred to added all the tags with blank content in my index file and update it with the service, to avoid some code duplication.   
<br>
**Injecting SocialTagsService in AppComponent**  
Final step is to use our service in the app.component.ts:
```typescript
export class AppComponent {

  public constructor(private tagsService: SocialTagsService) {
    this.tagsService.setTitleAndTags();
  }
}
```
Finally all the code of the SocialTagsService can be found on [GitHub](https://github.com/s0l0c0ding/solocoding/tree/master/src/app/services).
