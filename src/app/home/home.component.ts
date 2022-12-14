import { Component } from '@angular/core';
import { ScullyRoutesService } from '@scullyio/ng-lib';
import { Observable} from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  
  links$ :Observable<any>;

  constructor(private scully: ScullyRoutesService) {
    this.links$  = scully.available$;
  }


  currentTag(link: any): boolean {
    if (link.keywords) {
      return true;
    } else {return false}
  }

  sortDateFunc(a: any, b: any): number{
    return new Date(b?.date).getTime() - new Date(a?.date).getTime() ;
  }
}
