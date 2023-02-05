import { Component, ViewEncapsulation, OnDestroy } from '@angular/core';
import { ScullyRoute, ScullyRoutesService } from '@scullyio/ng-lib';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';

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
  sub: Subscription = new Subscription();
  isAmazonLinksEnabled = environment.isAmazonLinksEnabled;
  
  constructor(private scully: ScullyRoutesService) {
  this.sub.add(scully.getCurrent().subscribe( temp => this.post = temp));
  this.badge.set('angular', 'badge badge-danger');
  this.badge.set('spring', 'badge badge-success');
  this.badge.set('devops', 'badge badge-info');
  this.badge.set('quarkus', 'badge badge-primary');

  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

}
