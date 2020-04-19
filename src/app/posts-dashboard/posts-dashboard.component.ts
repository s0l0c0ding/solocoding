import { isDefined } from '@angular/compiler/src/util';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { ScullyRoute, ScullyRoutesService } from '@scullyio/ng-lib';
import { from, Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-posts-dashboard',
  templateUrl: './posts-dashboard.component.html',
  styleUrls: ['./posts-dashboard.component.css']
})
export class PostsDashboardComponent implements OnInit, OnDestroy {

  // links: any[];
  keyword: string;
  subFilter: Subscription;
  // sublinks: Subscription;
  linksFiltred$: Observable<any> = this.scully.available$;


  constructor(private scully: ScullyRoutesService, private route: ActivatedRoute) {
    this.subFilter = this.route.queryParams.subscribe(params => {
      this.keyword = params['filter'];
      this.linksFiltred$ = this.scully.available$;

    });
  }

  ngOnDestroy(): void {
    this.subFilter.unsubscribe;
    // this.sublinks.unsubscribe;
  }

  ngOnInit(): void {
    // this.sublinks = this.scully.available$.subscribe(temp => {
    //   this.links = temp;
    //   if(this.keyword) {
    //     this.links.forEach(item => {
    //       if(!isDefined(item.keywords) || !item.keywords.includes(this.keyword)){
    //         this.links.splice(this.links.indexOf(item),1);
    //         console.log(item);
    //       }
    //     })
    //     }
    // });
  }

  currentTag(link: any): boolean {
    if (this.keyword && !link.keywords?.includes(this.keyword)) {
      return false;
    } if (link.keywords) {
      return true;
    }
  }

}
