import { describe, it, expect } from 'vitest';

// Pure helpers mirrored from SwipeDeck component.
function getAge(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age > 0 ? age : null;
}

function formatCareType(type: string): string {
  return type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function getRoleLabel(role: string): string {
  if (role === 'owner') return 'Pet Owner';
  if (role === 'caretaker') return 'Caretaker';
  return 'Admin';
}

describe('getAge', () => {
  it('returns null for empty string', () => expect(getAge('')).toBeNull());
  it('returns null for invalid date', () => expect(getAge('not-a-date')).toBeNull());
  it('returns correct age for a past date', () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 25);
    expect(getAge(dob.toISOString())).toBe(25);
  });
  it('returns null for future date (age 0)', () => {
    const future = new Date(Date.now() + 86400000 * 365);
    expect(getAge(future.toISOString())).toBeNull();
  });
});

describe('formatCareType', () => {
  it('capitalises single word', () => expect(formatCareType('dogs')).toBe('Dogs'));
  it('formats underscore-joined', () => expect(formatCareType('stray_animals')).toBe('Stray Animals'));
  it('handles watering_plants', () => expect(formatCareType('watering_plants')).toBe('Watering Plants'));
});

describe('getRoleLabel', () => {
  it('owner → Pet Owner', () => expect(getRoleLabel('owner')).toBe('Pet Owner'));
  it('caretaker → Caretaker', () => expect(getRoleLabel('caretaker')).toBe('Caretaker'));
  it('admin → Admin', () => expect(getRoleLabel('admin')).toBe('Admin'));
});
