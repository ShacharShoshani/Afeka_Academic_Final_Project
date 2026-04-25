import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore, Store } from '@ngrx/store';
import { userReducer } from '../../store/user.reducer';
import { setUserData } from '../../store/user.actions';
import { RegistrationStep3 } from './registration-step3';

describe('RegistrationStep3', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrationStep3],
      providers: [provideRouter([]), provideStore({ user: userReducer })],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(RegistrationStep3);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should disable continue button when form is empty', () => {
    const fixture = TestBed.createComponent(RegistrationStep3);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.continue-btn') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should disable continue button when form is valid but no care type selected', () => {
    const fixture = TestBed.createComponent(RegistrationStep3);
    const component = fixture.componentInstance as any;

    component.profileForm.setValue({ bio: 'Hello world', dateOfBirth: '2000-01-01' });
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.continue-btn') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should enable continue button when form is valid and a care type is selected', () => {
    const fixture = TestBed.createComponent(RegistrationStep3);
    const component = fixture.componentInstance as any;

    component.profileForm.setValue({ bio: 'Hello world', dateOfBirth: '2000-01-01' });
    component.toggleCareType('dogs');
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.continue-btn') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('should toggle care type on and off', () => {
    const fixture = TestBed.createComponent(RegistrationStep3);
    const component = fixture.componentInstance as any;

    component.toggleCareType('dogs');
    expect(component.isCareTypeSelected('dogs')).toBe(true);

    component.toggleCareType('dogs');
    expect(component.isCareTypeSelected('dogs')).toBe(false);
  });

  it('should allow selecting multiple care types', () => {
    const fixture = TestBed.createComponent(RegistrationStep3);
    const component = fixture.componentInstance as any;

    component.toggleCareType('dogs');
    component.toggleCareType('cats');
    expect(component.isCareTypeSelected('dogs')).toBe(true);
    expect(component.isCareTypeSelected('cats')).toBe(true);
  });

  it('should render all 9 care type chips', () => {
    const fixture = TestBed.createComponent(RegistrationStep3);
    fixture.detectChanges();
    const chips = fixture.nativeElement.querySelectorAll('.chip');
    expect(chips.length).toBe(9);
  });

  it('should show availability chips when role is caretaker', () => {
    const store = TestBed.inject(Store);
    store.dispatch(setUserData({ role: 'caretaker' }));

    const fixture = TestBed.createComponent(RegistrationStep3);
    fixture.detectChanges();

    const chips = fixture.nativeElement.querySelectorAll('.chip');
    // 9 care types + 4 availability = 13
    expect(chips.length).toBe(13);
  });

  it('should not show availability chips when role is owner', () => {
    const store = TestBed.inject(Store);
    store.dispatch(setUserData({ role: 'owner' }));

    const fixture = TestBed.createComponent(RegistrationStep3);
    fixture.detectChanges();

    const chips = fixture.nativeElement.querySelectorAll('.chip');
    expect(chips.length).toBe(9);
  });

  it('should toggle availability on and off', () => {
    const fixture = TestBed.createComponent(RegistrationStep3);
    const component = fixture.componentInstance as any;

    component.toggleAvailability('mornings');
    expect(component.isAvailabilitySelected('mornings')).toBe(true);

    component.toggleAvailability('mornings');
    expect(component.isAvailabilitySelected('mornings')).toBe(false);
  });

  it('should render progress bar', () => {
    const fixture = TestBed.createComponent(RegistrationStep3);
    fixture.detectChanges();
    const progressBar = fixture.nativeElement.querySelector('app-progress-bar');
    expect(progressBar).toBeTruthy();
  });

  it('should have a back button', () => {
    const fixture = TestBed.createComponent(RegistrationStep3);
    fixture.detectChanges();
    const backBtn = fixture.nativeElement.querySelector('.back-btn');
    expect(backBtn).toBeTruthy();
  });
});
