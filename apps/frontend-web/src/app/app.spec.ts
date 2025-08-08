import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app root', () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
