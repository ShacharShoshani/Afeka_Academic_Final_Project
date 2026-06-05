import { describe, it, expect } from 'vitest';
import { formatCareType, formatAvailability, formatSize } from './format';

describe('formatCareType', () => {
  it('capitalises single word', () => expect(formatCareType('dogs')).toBe('Dogs'));
  it('formats stray_animals', () => expect(formatCareType('stray_animals')).toBe('Stray animals'));
  it('formats plants', () => expect(formatCareType('plants')).toBe('Plants'));
});

describe('formatAvailability', () => {
  it('capitalises mornings', () => expect(formatAvailability('mornings')).toBe('Mornings'));
  it('capitalises weekends', () => expect(formatAvailability('weekends')).toBe('Weekends'));
});

describe('formatSize', () => {
  it('capitalises small', () => expect(formatSize('small')).toBe('Small'));
  it('capitalises medium', () => expect(formatSize('medium')).toBe('Medium'));
  it('capitalises large', () => expect(formatSize('large')).toBe('Large'));
});
