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
    this.links$  = this.scully.available$;
  }

  ngOnInit(): void {
    this.links$.subscribe(temp => console.log(temp));
  }

}
