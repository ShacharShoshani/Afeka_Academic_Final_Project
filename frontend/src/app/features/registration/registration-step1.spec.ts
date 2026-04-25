import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { userReducer } from '../../store/user.reducer';
import { RegistrationStep1 } from './registration-step1';

describe('RegistrationStep1', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrationStep1],
      providers: [provideRouter([]), provideStore({ user: userReducer })],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(RegistrationStep1);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have no role selected initially', () => {
    const fixture = TestBed.createComponent(RegistrationStep1);
    const component = fixture.componentInstance as any;
    expect(component.selectedRole()).toBeNull();
  });

  it('should disable continue button when no role is selected', () => {
    const fixture = TestBed.createComponent(RegistrationStep1);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.continue-btn') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should select owner role when owner card is clicked', () => {
    const fixture = TestBed.createComponent(RegistrationStep1);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.role-card') as NodeListOf<HTMLButtonElement>;
    cards[0].click();
    fixture.detectChanges();
    expect(cards[0].classList.contains('selected')).toBe(true);
    expect(cards[1].classList.contains('selected')).toBe(false);
  });

  it('should select caretaker role when caretaker card is clicked', () => {
    const fixture = TestBed.createComponent(RegistrationStep1);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.role-card') as NodeListOf<HTMLButtonElement>;
    cards[1].click();
    fixture.detectChanges();
    expect(cards[0].classList.contains('selected')).toBe(false);
    expect(cards[1].classList.contains('selected')).toBe(true);
  });

  it('should switch selection when clicking the other card', () => {
    const fixture = TestBed.createComponent(RegistrationStep1);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.role-card') as NodeListOf<HTMLButtonElement>;
    cards[0].click();
    fixture.detectChanges();
    expect(cards[0].classList.contains('selected')).toBe(true);

    cards[1].click();
    fixture.detectChanges();
    expect(cards[0].classList.contains('selected')).toBe(false);
    expect(cards[1].classList.contains('selected')).toBe(true);
  });

  it('should enable continue button when a role is selected', () => {
    const fixture = TestBed.createComponent(RegistrationStep1);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.continue-btn') as HTMLButtonElement;
    const cards = fixture.nativeElement.querySelectorAll('.role-card') as NodeListOf<HTMLButtonElement>;

    cards[0].click();
    fixture.detectChanges();
    expect(button.disabled).toBe(false);
  });

  it('should show checkmark only on selected card', () => {
    const fixture = TestBed.createComponent(RegistrationStep1);
    fixture.detectChanges();

    // No checkmarks initially
    expect(fixture.nativeElement.querySelectorAll('.checkmark').length).toBe(0);

    // Click owner card
    const cards = fixture.nativeElement.querySelectorAll('.role-card') as NodeListOf<HTMLButtonElement>;
    cards[0].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.checkmark').length).toBe(1);
    expect(cards[0].querySelector('.checkmark')).toBeTruthy();
  });

  it('should render progress bar', () => {
    const fixture = TestBed.createComponent(RegistrationStep1);
    fixture.detectChanges();
    const progressBar = fixture.nativeElement.querySelector('app-progress-bar');
    expect(progressBar).toBeTruthy();
  });
});
