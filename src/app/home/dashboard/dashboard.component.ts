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
  linksFiltred$: Observable<any>;
  lang: string = 'en';
  readonly ITA : string = 'it';


  constructor(private scully: ScullyRoutesService, private route: ActivatedRoute) {
    this.subFilter = this.route.params.subscribe(params => {
      this.keyword = params['categoryId'];
      this.linksFiltred$ = this.scully.available$;
      if (this.keyword?.startsWith(this.ITA)) {
        this.lang = this.ITA;
       if (this.keyword.split('_')[1]){
         this.keyword = this.keyword.split('_')[1];
       }
      }

    });
  }

  ngOnDestroy(): void {
    this.subFilter.unsubscribe();
  }
  
  currentTag(link: any): boolean {
    if (this.keyword && this.keyword != this.ITA && !link.keywords?.includes(this.keyword)) {
      return false;
    } 
    if (link.keywords && link.language === this.lang) {
      return true;
    }
  }

  sortDateFunc(a: any, b: any): number{
    return new Date(b?.date).getTime() - new Date(a?.date).getTime() ;
  }
}
