const LOCAL_DEV_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

function configuredOrigins(): string[] {
  const origins: string[] = [];
  for (const value of (process.env.ALLOWED_ORIGINS || '').split(',')) {
    const trimmed = value.trim();
    if (trimmed) origins.push(trimmed);
  }
  for (const key of ['URL', 'DEPLOY_URL', 'DEPLOY_PRIME_URL']) {
    const value = (process.env[key] || '').trim();
    if (value) origins.push(value);
  }
  return [...new Set(origins)];
}

export function isOriginAllowed(origin: string | null | undefined): boolean {
  if (!origin) return false;
  const normalized = origin.trim().replace(/\/+$/, '');
  if (!normalized) return false;
  if (LOCAL_DEV_ORIGIN.test(normalized)) return true;
  return configuredOrigins().some((allowed) => allowed.replace(/\/+$/, '') === normalized);
}

type RelayEvent = {
  httpMethod?: string;
  headers?: Record<string, string | undefined>;
};

function requestOrigin(event?: RelayEvent): string | undefined {
  const headers = event?.headers || {};
  const raw = headers.origin ?? headers.Origin;
  return typeof raw === 'string' && raw.trim() ? raw : undefined;
}

export function corsHeaders(event?: RelayEvent): Record<string, string> {
  const origin = requestOrigin(event);
  if (!isOriginAllowed(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin as string,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

export function isPreflight(event?: RelayEvent): boolean {
  return (event?.httpMethod || '').toUpperCase() === 'OPTIONS';
}

export function preflightResponse(event?: RelayEvent): {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
} {
  return { statusCode: 204, headers: corsHeaders(event), body: '' };
}
