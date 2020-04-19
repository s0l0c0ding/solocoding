import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PostsDashboardComponent } from './posts-dashboard.component';

describe('PostsDashboardComponent', () => {
  let component: PostsDashboardComponent;
  let fixture: ComponentFixture<PostsDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PostsDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PostsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
