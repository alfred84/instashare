import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Register } from './register';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register]
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
import { of } from 'rxjs';
import { Auth } from '../../services/auth';
import { By } from '@angular/platform-browser';

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
      imports: [Register],
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
});
