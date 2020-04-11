import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ScullyLibModule} from '@scullyio/ng-lib';
import {BlogRoutingModule} from './blog-routing.module';
import {BlogComponent} from './blog.component';
import { PostDetailsComponent } from './post-details/post-details.component';
import { HomeModule } from '../home/home.module';

@NgModule({
  declarations: [BlogComponent, PostDetailsComponent],
  imports: [CommonModule, BlogRoutingModule, ScullyLibModule, HomeModule],
})
export class BlogModule {}
