export function slugifyToHandle(value: string): string {
  const normalized = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

  return normalized || 'user';
}

export function getUserProfileHandle(user: any): string {
  const explicitUsername = String(user?.username || '').trim().toLowerCase();
  if (explicitUsername) return explicitUsername;
  return slugifyToHandle(user?.name || 'user');
}
