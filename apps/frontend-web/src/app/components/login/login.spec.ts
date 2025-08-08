import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

// Additional behavior tests
import { of } from 'rxjs';
import { Auth } from '../../services/auth';
import { By } from '@angular/platform-browser';

describe('Login - behaviors', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let loginMock: jest.Mock;

  beforeEach(async () => {
    loginMock = jest.fn().mockReturnValue(of({ accessToken: 'fake' }));
    const authStub: Pick<Auth, 'login'> = {
      login: loginMock as unknown as Auth['login'],
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [{ provide: Auth, useValue: authStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should have submit button disabled when form invalid', () => {
    const btn: HTMLButtonElement = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
    expect(btn.disabled).toBe(true);
    component.loginForm.patchValue({ email: 'user@example.com' });
    fixture.detectChanges();
    expect(btn.disabled).toBe(true);
  });

  it('should call Auth.login with credentials when form valid and submitted', () => {
    component.loginForm.setValue({ email: 'user@example.com', password: 'secret' });
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    expect(loginMock).toHaveBeenCalledWith({ email: 'user@example.com', password: 'secret' });
  });
});
