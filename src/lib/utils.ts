export function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatRelativeTime(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 7) {
    return formatDate(d);
  } else if (days > 0) {
    return `${days} gün önce`;
  } else if (hours > 0) {
    return `${hours} saat önce`;
  } else if (minutes > 0) {
    return `${minutes} dakika önce`;
  } else {
    return 'Az önce';
  }
}

// Safe window check
export function isBrowser() {
  return typeof window !== 'undefined';
}

export function getHostname(): string {
  if (!isBrowser()) return '';
  return window.location?.hostname || '';
}

export function isDevelopment(): boolean {
  if (!isBrowser()) return false;
  const hostname = getHostname();
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
}
