import { describe, it, expect } from 'vitest';

// Inline the pure helper (no DB needed) — mirror of swipe.routes.ts.
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

describe('haversineKm', () => {
  it('returns 0 for same point', () => {
    expect(haversineKm(32.08, 34.78, 32.08, 34.78)).toBe(0);
  });

  it('Tel Aviv ↔ Jerusalem ≈ 50–65 km', () => {
    const dist = haversineKm(32.0853, 34.7818, 31.7683, 35.2137);
    expect(dist).toBeGreaterThan(50);
    expect(dist).toBeLessThan(65);
  });

  it('Tel Aviv ↔ London ≈ 3590 km', () => {
    const dist = haversineKm(32.0853, 34.7818, 51.5074, -0.1278);
    expect(dist).toBeGreaterThan(3500);
    expect(dist).toBeLessThan(3700);
  });

  it('symmetric', () => {
    const a = haversineKm(32.0853, 34.7818, 31.7683, 35.2137);
    const b = haversineKm(31.7683, 35.2137, 32.0853, 34.7818);
    expect(Math.abs(a - b)).toBeLessThan(0.001);
  });
});
