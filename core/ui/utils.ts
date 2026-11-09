function basePrefix(): string {
  const base = import.meta?.env?.BASE_URL || '/';
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

export function withBase(path: string): string {
  const base = basePrefix();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}

export function stripBase(pathname: string): string {
  const base = basePrefix();
  if (base && (pathname === base || pathname.startsWith(`${base}/`))) {
    return pathname.slice(base.length) || '/';
  }
  return pathname;
}

/**
 * Safely escape dynamic values for HTML string interpolation.
 */
export function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str.replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[char] || char
  );
}
