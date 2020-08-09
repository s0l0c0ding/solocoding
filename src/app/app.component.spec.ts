import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { SocialTagsService } from './services/social-tags.service';

describe('AppComponent', () => {
  let comp: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let tagServiceStub: Partial<SocialTagsService>;


  beforeEach(() => {
    // stub tag for test purposes
    tagServiceStub = {
      setTitleAndTags: () => { }
    };

    TestBed.configureTestingModule({
      declarations: [AppComponent],
      providers: [{ provide: SocialTagsService, useValue: tagServiceStub }],
    });

    fixture = TestBed.createComponent(AppComponent);
    comp = fixture.componentInstance;

    // UserService from the root injector
    // userService = TestBed.inject(SocialTagsService);

  });

  it('should create', () => {
    expect(comp).toBeTruthy();
  });

});
