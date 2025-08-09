import { Component } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { Router, Routes, TitleStrategy, RouterOutlet } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SeoService } from './seo.service';
import { AppTitleStrategy } from './title.strategy';

@Component({
  // simple shell with a router outlet
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
})
class Shell {}

@Component({
  selector: 'app-login',
  standalone: true,
  template: '<p>login</p>',
})
class LoginStub {}

@Component({
  selector: 'app-register',
  standalone: true,
  template: '<p>register</p>',
})
class RegisterStub {}

const routes: Routes = [
  { path: 'login', component: LoginStub, data: { title: 'Login', description: 'Login to your InstaShare account.' } },
  { path: 'register', component: RegisterStub, data: { title: 'Register', description: 'Create your InstaShare account.' } },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];

describe('SeoService', () => {
  let router: Router;
  let seo: SeoService;
  let meta: Meta;
  let doc: Document;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes(routes), Shell, LoginStub, RegisterStub],
      providers: [Title, Meta, { provide: TitleStrategy, useClass: AppTitleStrategy }],
    }).compileComponents();

    router = TestBed.inject(Router);
    seo = TestBed.inject(SeoService);
    meta = TestBed.inject(Meta);
    doc = TestBed.inject(DOCUMENT);

    // init shell and router
    TestBed.createComponent(Shell).detectChanges();
    router.initialNavigation();
  });

  it('updates title, description and canonical on route change', fakeAsync(async () => {
    // Ensure absoluteUrl returns a deterministic value
    jest.spyOn(seo as unknown as { absoluteUrl: () => string }, 'absoluteUrl').mockReturnValue('http://example.com/login');

    seo.init();

    await router.navigateByUrl('/login');
    tick();
    // SeoService sets meta using route data or current title; verify meta reflects the expected title and description
    expect(meta.getTag("property='og:title'")?.content).toBe('InstaShare — Login');
    expect(meta.getTag("name='description'")?.content).toBe('Login to your InstaShare account.');

    const canonical = doc.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    expect(canonical).toBeTruthy();
    expect(canonical?.href).toBe('http://example.com/login');
  }));
});
