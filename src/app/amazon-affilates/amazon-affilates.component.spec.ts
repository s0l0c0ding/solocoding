import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmazonAffilatesComponent } from './amazon-affilates.component';

describe('AmazonAffilatesComponent', () => {
  let component: AmazonAffilatesComponent;
  let fixture: ComponentFixture<AmazonAffilatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AmazonAffilatesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AmazonAffilatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
