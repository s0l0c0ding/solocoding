import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostComponent } from './post.component';
import { ScullyRoute } from '@scullyio/ng-lib';

describe('PostComponent', () => {
  let component: PostComponent;
  let fixture: ComponentFixture<PostComponent>;
  let link:ScullyRoute = {route: 'angular', language: 'eng', title: 'test', description: 'test'};
  let photo: string = 'test';

  beforeEach(() => {
    fixture = TestBed.createComponent(PostComponent);
    component = fixture.componentInstance;
    component.link = link;
    component.photo = photo;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
