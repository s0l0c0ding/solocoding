import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScullyRoutesService } from '@scullyio/ng-lib';
import { of } from 'rxjs';
import { HomeComponent } from './home.component';
import { PostComponent } from './post/post.component';
import { DashboardComponent } from './dashboard/dashboard.component';


describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let getScullySpy: Partial<ScullyRoutesService>;

  beforeEach(() => {
    const link = {
      keywords:['angular']
    }
    // Create a fake 
    const scully = jasmine.createSpyObj('ScullyRoutesService', ['available$']);
    // Make the spy return a synchronous Observable 
    getScullySpy = scully.available$.and.returnValue(of(link));

    TestBed.configureTestingModule({
      declarations: [HomeComponent, PostComponent, DashboardComponent],
      providers: [
        { provide: ScullyRoutesService, useValue: scully }
      ]
    });

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;

  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
