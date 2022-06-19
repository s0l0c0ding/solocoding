import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AboutRoutingModule } from './about-routing.module';
import { AboutComponent } from './about.component';
import { ContactComponent } from '../contact/contact.component';
import { DonateComponent } from '../donate/donate.component';


@NgModule({
  declarations: [AboutComponent, ContactComponent, DonateComponent],
  imports: [
    CommonModule,
    AboutRoutingModule
  ]
})
export class AboutModule { }
