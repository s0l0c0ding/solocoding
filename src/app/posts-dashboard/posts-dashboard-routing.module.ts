import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PostsDashboardComponent } from './posts-dashboard.component';

const routes: Routes = [{ path: '', component: PostsDashboardComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PostsDashboardRoutingModule { }
