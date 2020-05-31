import { Injectable } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { ScullyRoutesService } from '@scullyio/ng-lib';
import { filter, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SocialTagsService {

  public constructor(private titleService: Title,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private scully: ScullyRoutesService,
    private meta: Meta) {}

  readonly tagDescription: string = 'A blog about programming and software development, writing about Spring, Quarkus, java, Angular, DevOps, Docker and kubernetes';
  readonly tagImage: string = 'assets/logo.png';
  readonly urlPrefix: string = 'https://solocoding.dev';
  readonly siteName: string = 'soloCoding';
  readonly userTwitter: string = '@s0l0c0ding';

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
    ).subscribe((route: ActivatedRoute) => {
      this.scully.getCurrent().subscribe(
        link => {
          this.meta.updateTag({ name: 'twitter:url', content: this.urlPrefix + this.router.url });
          this.meta.updateTag({ name: 'og:url', content: this.urlPrefix + this.router.url });
          this.meta.updateTag({ name: 'og:site_name', property: 'og:site_name', content: this.siteName});
          this.meta.updateTag({ name: 'twitter:creator', content: this.userTwitter});
          this.meta.updateTag({ name: 'twitter:site', content: this.userTwitter});
          if (link.title) {
            this.titleService.setTitle(link.title);
            this.meta.updateTag({ name: 'description', content: link.description });
            this.meta.updateTag({ name: 'image', content: this.urlPrefix+'/'+link.photo });
            this.meta.updateTag({ name: 'og:title', property: 'og:title', content: link.title });
            this.meta.updateTag({ name: 'og:description', property: 'og:description', content: link.description});
            this.meta.updateTag({ name: 'og:type', property: 'og:type', content: 'article' });
            this.meta.updateTag({ name: 'article:section', property: 'article:section', content: (link.keywords as string[])[0] });
            this.meta.updateTag({ name: 'og:image', content: this.urlPrefix+'/'+link.photo });
            this.meta.updateTag({ name: 'twitter:title', content: link.title.substring(0, 69) });
            this.meta.updateTag({ name: 'twitter:description', content: (link.description as string).substring(0, 123)});
            this.meta.updateTag({ name: 'twitter:image', content: this.urlPrefix+'/'+link.photo });
          } else {
            const title: string = route.snapshot.data['title'];
            this.titleService.setTitle(title);
            this.meta.updateTag({ name: 'description', content: this.tagDescription });
            this.meta.updateTag({ name: 'image', content: this.urlPrefix+'/'+this.tagImage });
            this.meta.updateTag({ name: 'og:title', content: title });
            this.meta.updateTag({ name: 'og:description', content: this.tagDescription });
            this.meta.updateTag({ name: 'og:type', content: 'website' });
            this.meta.updateTag({ name: 'og:image', content: this.urlPrefix+'/'+this.tagImage });
            this.meta.updateTag({ name: 'twitter:title', content: title });
            this.meta.updateTag({ name: 'twitter:description', content: this.tagDescription.substring(0, 123) });
            this.meta.updateTag({ name: 'twitter:image', content: this.urlPrefix+'/'+this.tagImage });
          }
        });
    });
  }
}
