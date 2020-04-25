import { Component, OnInit } from '@angular/core';
import { ScullyRoutesService } from '@scullyio/ng-lib';
import { Observable} from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  
  links$ :Observable<any>;

  constructor(private scully: ScullyRoutesService) {
    this.links$  = scully.available$;
  }

  ngOnInit(): void {
  }

  currentTag(link: any, i: number): boolean {
    if (link.keywords && i<=10) {
      return true;
    } else {return false}
  }
}
