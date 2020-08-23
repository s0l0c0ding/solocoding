import { Component, ViewEncapsulation, OnDestroy } from '@angular/core';
import { ScullyRoute, ScullyRoutesService } from '@scullyio/ng-lib';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css'],
  preserveWhitespaces: true,
  encapsulation: ViewEncapsulation.Emulated

})

export class BlogComponent implements OnDestroy {

  post: ScullyRoute;
  badge = new Map();
  sub: Subscription;

  constructor(private scully: ScullyRoutesService) {
  this.sub = this.scully.getCurrent().subscribe( temp => this.post = temp);
  this.badge.set('angular', 'badge badge-primary');
  this.badge.set('spring', 'badge badge-success');
  this.badge.set('devops', 'badge badge-info');

  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

}
