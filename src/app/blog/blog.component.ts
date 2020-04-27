import { Component, ViewEncapsulation, AfterViewChecked } from '@angular/core';
import { ScullyRoute, ScullyRoutesService } from '@scullyio/ng-lib';
import { Observable } from 'rxjs';
import { HighlightService } from '../service/highlight.service';

declare var ng: any;

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css'],
  preserveWhitespaces: true,
  encapsulation: ViewEncapsulation.Emulated

})
export class BlogComponent implements AfterViewChecked {

  post$ :Observable<ScullyRoute>;

  constructor(private scully: ScullyRoutesService, private highlightService: HighlightService) {
  this.post$= this.scully.getCurrent();
  }
  ngAfterViewChecked(): void {
    this.highlightService.highlightAll();
  }

}
