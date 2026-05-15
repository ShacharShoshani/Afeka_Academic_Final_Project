export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatJoinDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export function formatLastUpdated(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatCareType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
}

export function formatAvailability(slot: string): string {
  return slot.charAt(0).toUpperCase() + slot.slice(1);
}

export function formatAnimalType(type: unknown): string {
  const t = String(type);
  return t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ');
}

export function formatSize(size: string): string {
  return size.charAt(0).toUpperCase() + size.slice(1);
}
