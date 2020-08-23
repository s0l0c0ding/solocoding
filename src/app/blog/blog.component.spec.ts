import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlogComponent } from './blog.component';
import { ScullyRoutesService } from '@scullyio/ng-lib';
import { of } from 'rxjs';


describe('BlogComponent', () => {
  let component: BlogComponent;
  let fixture: ComponentFixture<BlogComponent>;
  let getScullySpy: Partial<ScullyRoutesService>;


  beforeEach(() => {
    const link = {
      keywords:['angular']
    }

    const scully = jasmine.createSpyObj('ScullyRoutesService', ['getCurrent']);
    getScullySpy = scully.getCurrent.and.returnValue(of(link));

    TestBed.configureTestingModule({
      declarations: [BlogComponent],
      providers: [
        { provide: ScullyRoutesService, useValue: scully }
      ]
    });

    fixture = TestBed.createComponent(BlogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
