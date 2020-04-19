import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PostsDashboardRoutingModule } from './posts-dashboard-routing.module';
import { PostsDashboardComponent } from './posts-dashboard.component';
import { HomeModule } from '../home/home.module';


@NgModule({
  declarations: [PostsDashboardComponent],
  imports: [
    CommonModule,
    PostsDashboardRoutingModule,
    HomeModule
  ]
})
export class PostsDashboardModule { }
