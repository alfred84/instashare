import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Register } from './register';
import { Auth } from '../../../core/auth/auth.service';
import { RouterTestingModule } from '@angular/router/testing';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register, RouterTestingModule],
      providers: [
        { provide: Auth, useValue: { register: jest.fn() } as Partial<Auth> },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Register);
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

describe('Register - behaviors', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let registerMock: jest.Mock;

  beforeEach(async () => {
    registerMock = jest.fn().mockReturnValue(of({ accessToken: 'fake' }));
    const authStub: Pick<Auth, 'register'> = {
      register: registerMock as unknown as Auth['register'],
    };

    await TestBed.configureTestingModule({
      imports: [Register, RouterTestingModule],
      providers: [{ provide: Auth, useValue: authStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should disable submit button when form invalid', () => {
    const btn: HTMLButtonElement = fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement;
    expect(btn.disabled).toBe(true);
    component.registerForm.patchValue({ email: 'user@example.com' });
    fixture.detectChanges();
    expect(btn.disabled).toBe(true);
  });

  it('should call Auth.register when form valid and submitted', () => {
    component.registerForm.setValue({ email: 'new@e.com', password: 'password123' });
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    expect(registerMock).toHaveBeenCalledWith({ email: 'new@e.com', password: 'password123' });
  });

  it('should not call Auth.register when form is invalid', () => {
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('should log error when Auth.register emits error', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    component.registerForm.setValue({ email: 'new@e.com', password: 'password123' });
    registerMock.mockReturnValueOnce(throwError(() => new Error('bad')));
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should not call Auth.register when form is valid but missing credentials', () => {
    // Replace the form with one without validators so it's valid even when empty
    component.registerForm = new FormBuilder().group({ email: [''], password: [''] });
    fixture.detectChanges();
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    expect(registerMock).not.toHaveBeenCalled();
  });
});
