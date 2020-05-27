import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { ScullyRoutesService } from '@scullyio/ng-lib';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  postTitle: string;

  public constructor(private titleService: Title,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private scully: ScullyRoutesService) {

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
      this.scully.getCurrent().pipe(
        map(current => current.title )
      ).subscribe(
        title => this.postTitle = title ? title : 'Blog'
      );
      console.log(this.postTitle);
      
      if(this.postTitle){
        this.titleService.setTitle(this.postTitle);
        
      } else{
      this.titleService.setTitle(route.snapshot.data['title']);
    }
    });
  }

}
