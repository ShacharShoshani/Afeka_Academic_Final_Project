import { describe, it, expect } from 'vitest';
import { validateImageDataUrl } from './validateImage.js';

const validJpeg = 'data:image/jpeg;base64,/9j/abc123';
const validPng  = 'data:image/png;base64,abc123==';
const validWebp = 'data:image/webp;base64,abc123==';
const svgUrl    = 'data:image/svg+xml;base64,abc123';
const bigB64    = 'data:image/jpeg;base64,' + 'A'.repeat(7 * 1024 * 1024 + 1);

describe('validateImageDataUrl', () => {
  it('accepts jpeg', () => expect(validateImageDataUrl(validJpeg)).toBeNull());
  it('accepts png',  () => expect(validateImageDataUrl(validPng)).toBeNull());
  it('accepts webp', () => expect(validateImageDataUrl(validWebp)).toBeNull());
  it('rejects svg',  () => expect(validateImageDataUrl(svgUrl)).toBe('UNSUPPORTED_TYPE'));
  it('rejects empty string', () => expect(validateImageDataUrl('')).toBe('MISSING'));
  it('rejects null',  () => expect(validateImageDataUrl(null)).toBe('MISSING'));
  it('rejects non-data-url', () => expect(validateImageDataUrl('https://example.com/img.jpg')).toBe('INVALID_FORMAT'));
  it('rejects oversized', () => expect(validateImageDataUrl(bigB64)).toBe('TOO_LARGE'));
});
