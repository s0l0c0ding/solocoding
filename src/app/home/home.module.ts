import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';
import { PostComponent } from './post/post.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { RouterModule } from '@angular/router';


@NgModule({
  declarations: [HomeComponent, PostComponent, DashboardComponent],
  imports: [
    CommonModule,
    HomeRoutingModule,
    RouterModule
  ],
  exports: []
})
export class HomeModule { }
