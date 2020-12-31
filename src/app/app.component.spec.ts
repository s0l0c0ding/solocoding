import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { SocialTagsService } from './services/social-tags.service';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import {RouterTestingModule} from '@angular/router/testing' 
import { RouterModule } from '@angular/router';

describe('AppComponent', () => {
  let comp: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let tagServiceStub: Partial<SocialTagsService>;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [ 
          RouterTestingModule,
          RouterModule
        ],
        declarations: [
          AppComponent,
          FooterComponent,
          HeaderComponent,
        ],
      }).compileComponents();
    }));

  beforeEach(() => {
    tagServiceStub = {
      setTitleAndTags: () => { }
    };

    TestBed.configureTestingModule({
      declarations: [AppComponent],
      providers: [{ provide: SocialTagsService, useValue: tagServiceStub }],
    });

    fixture = TestBed.createComponent(AppComponent);
    comp = fixture.componentInstance;

  });

  it('should create', () => {
    expect(comp).toBeTruthy();
  });

});
