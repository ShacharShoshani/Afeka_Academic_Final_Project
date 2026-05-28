import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { userReducer } from '../../store/user.reducer';
import { RegistrationStep4 } from './registration-step4';

describe('RegistrationStep4', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrationStep4],
      providers: [provideRouter([]), provideStore({ user: userReducer })],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(RegistrationStep4);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should disable create account button when form is empty', () => {
    const fixture = TestBed.createComponent(RegistrationStep4);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.continue-btn') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should disable button when password is too short', () => {
    const fixture = TestBed.createComponent(RegistrationStep4);
    const component = fixture.componentInstance as any;

    component.passwordForm.setValue({ password: 'short', confirmPassword: 'short' });
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.continue-btn') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should disable button when passwords do not match', () => {
    const fixture = TestBed.createComponent(RegistrationStep4);
    const component = fixture.componentInstance as any;

    // Use a password that passes strength rules so the mismatch is the only reason for disabled
    component.passwordForm.setValue({ password: 'Password1!', confirmPassword: 'Different1!' });
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.continue-btn') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should enable button when passwords are valid and matching', () => {
    const fixture = TestBed.createComponent(RegistrationStep4);
    const component = fixture.componentInstance as any;

    // Password must satisfy strength rules: uppercase, lowercase, number, special char, ≥8 chars
    component.passwordForm.setValue({ password: 'Password1!', confirmPassword: 'Password1!' });
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.continue-btn') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('should have no photo preview initially', () => {
    const fixture = TestBed.createComponent(RegistrationStep4);
    const component = fixture.componentInstance as any;
    expect(component.photoPreview()).toBe('');
  });

  it('should render photo circle placeholder', () => {
    const fixture = TestBed.createComponent(RegistrationStep4);
    fixture.detectChanges();
    const circle = fixture.nativeElement.querySelector('.photo-circle');
    expect(circle).toBeTruthy();
  });

  it('should show preview image when photo is set', () => {
    const fixture = TestBed.createComponent(RegistrationStep4);
    const component = fixture.componentInstance as any;

    component.photoPreview.set('data:image/png;base64,abc123');
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('.photo-preview') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain('data:image/png;base64,abc123');
  });

  it('should toggle password visibility', () => {
    const fixture = TestBed.createComponent(RegistrationStep4);
    const component = fixture.componentInstance as any;

    expect(component.showPassword()).toBe(false);
    component.toggleShowPassword();
    expect(component.showPassword()).toBe(true);
    component.toggleShowPassword();
    expect(component.showPassword()).toBe(false);
  });

  it('should toggle confirm password visibility', () => {
    const fixture = TestBed.createComponent(RegistrationStep4);
    const component = fixture.componentInstance as any;

    expect(component.showConfirm()).toBe(false);
    component.toggleShowConfirm();
    expect(component.showConfirm()).toBe(true);
  });

  it('should render progress bar', () => {
    const fixture = TestBed.createComponent(RegistrationStep4);
    fixture.detectChanges();
    const progressBar = fixture.nativeElement.querySelector('app-progress-bar');
    expect(progressBar).toBeTruthy();
  });

  it('should have a back button', () => {
    const fixture = TestBed.createComponent(RegistrationStep4);
    fixture.detectChanges();
    const backBtn = fixture.nativeElement.querySelector('.back-btn');
    expect(backBtn).toBeTruthy();
  });

  it('should set photo error for oversized file', () => {
    const fixture = TestBed.createComponent(RegistrationStep4);
    const component = fixture.componentInstance as any;

    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    const event = { target: { files: [largeFile] } } as unknown as Event;
    component.onFileSelected(event);

    expect(component.photoError()).toBe('Image must be under 5MB');
  });

  it('should set photo error for non-image file', () => {
    const fixture = TestBed.createComponent(RegistrationStep4);
    const component = fixture.componentInstance as any;

    const textFile = new File(['hello'], 'doc.txt', { type: 'text/plain' });
    const event = { target: { files: [textFile] } } as unknown as Event;
    component.onFileSelected(event);

    expect(component.photoError()).toBe('Please select an image file');
  });
});
