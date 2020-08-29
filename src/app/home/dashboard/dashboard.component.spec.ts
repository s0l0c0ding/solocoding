import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ScullyRoutesService } from '@scullyio/ng-lib';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { PostComponent } from '../post/post.component';


describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  
  beforeEach(() => {
    const link = {
      keywords:'angular',
       date: '2020-04-26'
    }
    const params = {
      categoryId: 'angular'
    }

    TestBed.configureTestingModule({
      declarations: [DashboardComponent, PostComponent],
      providers: [
        { provide: ScullyRoutesService, useValue: {
          available$: of([link])
        } },
        { provide: ActivatedRoute, useValue: {
          params: of(params)
        }}
      ]
    });
    
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy;
  });

  it('should inject props', () => {
    expect(component.keyword).toEqual('angular');
    expect(component.lang).toEqual('en');
  });

});

describe('DashboardComponent with it tags', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  
  beforeEach(() => {
    const link = {
      keywords:'angular',
       date: '2020-04-26'
    }
    const params = {
      categoryId: 'it_angular'
    }

    TestBed.configureTestingModule({
      declarations: [DashboardComponent, PostComponent],
      providers: [
        { provide: ScullyRoutesService, useValue: {
          available$: of([link])
        } },
        { provide: ActivatedRoute, useValue: {
          params: of(params)
        }}
      ]
    });
    
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy;
  });

  it('should inject props', () => {
    expect(component.keyword).toEqual('angular');
    expect(component.lang).toEqual('it');
  });

});
