import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ScullyRoute, ScullyRoutesService } from '@scullyio/ng-lib';

@Component({
  selector: 'app-post-details',
  templateUrl: './post-details.component.html',
  styleUrls: ['./post-details.component.css']
})
export class PostDetailsComponent implements OnInit {

  post$ :Observable<ScullyRoute>;
  constructor(private scully: ScullyRoutesService) { 
    this.post$= this.scully.getCurrent();
  }

  ngOnInit(): void {
  }

}
