import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ScullyRoutesService } from '@scullyio/ng-lib';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';


describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let getScullySpy: Partial<ScullyRoutesService>;
  let getRoutSpy: Partial<ActivatedRoute>;

  beforeEach(() => {
    const link = {
      keywords:['angular']
    }

    const params = {
      categoryId: 'angular'
    }

    // Create a fake 
    const scully = jasmine.createSpyObj('ScullyRoutesService', ['available$']);
    getScullySpy = scully.available$.and.returnValue(of(link));

    const route = jasmine.createSpyObj('ActivatedRoute', ['params']);
    getRoutSpy = route.params.and.returnValue(of(params));

    TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      providers: [
        { provide: ScullyRoutesService, useValue: scully },
        { provide: ActivatedRoute, useValue: route}
      ]
    });
    
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
