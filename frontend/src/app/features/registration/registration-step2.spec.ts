import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { userReducer } from '../../store/user.reducer';
import { RegistrationStep2 } from './registration-step2';

describe('RegistrationStep2', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrationStep2],
      providers: [provideRouter([]), provideStore({ user: userReducer })],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(RegistrationStep2);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should disable continue button when form is empty', () => {
    const fixture = TestBed.createComponent(RegistrationStep2);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.continue-btn') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should enable continue button when all fields are valid', () => {
    const fixture = TestBed.createComponent(RegistrationStep2);
    const component = fixture.componentInstance as any;

    component.personalForm.setValue({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+972501234567',
      residence: 'Tel Aviv',
    });
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.continue-btn') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('should keep continue disabled with invalid email', () => {
    const fixture = TestBed.createComponent(RegistrationStep2);
    const component = fixture.componentInstance as any;

    component.personalForm.setValue({
      name: 'John Doe',
      email: 'not-an-email',
      phone: '+972501234567',
      residence: 'Tel Aviv',
    });
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.continue-btn') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should render all four form fields', () => {
    const fixture = TestBed.createComponent(RegistrationStep2);
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll('.form-field input');
    expect(inputs.length).toBe(4);
  });

  it('should render progress bar', () => {
    const fixture = TestBed.createComponent(RegistrationStep2);
    fixture.detectChanges();
    const progressBar = fixture.nativeElement.querySelector('app-progress-bar');
    expect(progressBar).toBeTruthy();
  });

  it('should have a back button', () => {
    const fixture = TestBed.createComponent(RegistrationStep2);
    fixture.detectChanges();
    const backBtn = fixture.nativeElement.querySelector('.back-btn');
    expect(backBtn).toBeTruthy();
  });
});
