import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Login } from './login';
import { Auth } from '../../../core/auth/auth.service';
import { RouterTestingModule } from '@angular/router/testing';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login, RouterTestingModule],
      providers: [
        { provide: Auth, useValue: { login: jest.fn() } as Partial<Auth> },
      ],
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
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';
import { FormBuilder } from '@angular/forms';

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
      imports: [Login, RouterTestingModule],
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

  it('should not call Auth.login when form is invalid', () => {
    // form starts invalid by default
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('should log error when Auth.login emits error', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    component.loginForm.setValue({ email: 'user@example.com', password: 'secret' });
    loginMock.mockReturnValueOnce(throwError(() => new Error('bad')));
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should not call Auth.login when form is valid but missing credentials', () => {
    // Replace the form with one without validators so it's valid even when empty
    component.loginForm = new FormBuilder().group({ email: [''], password: [''] });
    fixture.detectChanges();
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    expect(loginMock).not.toHaveBeenCalled();
  });
});
