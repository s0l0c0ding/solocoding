import { Component, OnDestroy } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { ScullyRoutesService } from '@scullyio/ng-lib';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnDestroy {

  keyword: string;
  subFilter: Subscription;
  linksFiltred$: Observable<any> = this.scully.available$;


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
    if (this.keyword && !link.keywords?.includes(this.keyword)) {
      return false;
    } 
    if (link.keywords) {
      return true;
    }
  }

  sortDateFunc(a: any, b: any): number{
    return new Date(b?.date).getTime() - new Date(a?.date).getTime() ;
  }
}
