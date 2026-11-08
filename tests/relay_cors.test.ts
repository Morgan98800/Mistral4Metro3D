import { afterEach, describe, expect, it } from 'vitest';
import {
  corsHeaders,
  isOriginAllowed,
  isPreflight,
  preflightResponse,
} from '../netlify/functions/_shared/cors';
import { handler as stmHandler } from '../netlify/functions/stm_relay';

const ENV_KEYS = ['ALLOWED_ORIGINS', 'URL', 'DEPLOY_URL', 'DEPLOY_PRIME_URL', 'STM_API_KEY'];
const savedEnv: Record<string, string | undefined> = {};

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
    delete savedEnv[key];
  }
});

function setEnv(key: string, value: string | undefined): void {
  if (!(key in savedEnv)) savedEnv[key] = process.env[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

describe('CORS allowlist helper (netlify/functions/_shared/cors)', () => {
  it('allows localhost / 127.0.0.1 on any port by default', () => {
    for (const key of ENV_KEYS) setEnv(key, undefined);
    expect(isOriginAllowed('http://localhost:3000')).toBe(true);
    expect(isOriginAllowed('http://localhost:5173')).toBe(true);
    expect(isOriginAllowed('http://127.0.0.1:8888')).toBe(true);
    expect(isOriginAllowed('https://localhost')).toBe(true);
  });

  it('rejects arbitrary origins and missing origins', () => {
    for (const key of ENV_KEYS) setEnv(key, undefined);
    expect(isOriginAllowed('https://evil.example')).toBe(false);
    expect(isOriginAllowed('https://parisian3dsubway.netlify.app.evil.example')).toBe(false);
    expect(isOriginAllowed('')).toBe(false);
    expect(isOriginAllowed(undefined)).toBe(false);
    expect(isOriginAllowed(null)).toBe(false);
  });

  it('honours ALLOWED_ORIGINS (comma-separated) and Netlify URL env vars', () => {
    setEnv('ALLOWED_ORIGINS', 'https://demo.example, https://autre.example/');
    setEnv('URL', 'https://parisian3dsubway.netlify.app');
    setEnv('DEPLOY_URL', 'https://deploy-preview-42--parisian3dsubway.netlify.app');
    expect(isOriginAllowed('https://demo.example')).toBe(true);
    expect(isOriginAllowed('https://autre.example')).toBe(true);
    expect(isOriginAllowed('https://parisian3dsubway.netlify.app')).toBe(true);
    expect(isOriginAllowed('https://deploy-preview-42--parisian3dsubway.netlify.app')).toBe(true);
    expect(isOriginAllowed('https://demo.example.evil.com')).toBe(false);
  });

  it('never emits a wildcard Access-Control-Allow-Origin', () => {
    for (const origin of [
      undefined,
      'http://localhost:3000',
      'https://evil.example',
      'https://demo.example',
    ]) {
      setEnv('ALLOWED_ORIGINS', 'https://demo.example');
      const headers = corsHeaders(origin ? { headers: { origin } } : undefined);
      expect(headers['Access-Control-Allow-Origin']).not.toBe('*');
    }
  });

  it('echoes the origin with Vary: Origin only when allowed', () => {
    setEnv('ALLOWED_ORIGINS', undefined);
    setEnv('URL', 'https://parisian3dsubway.netlify.app');

    expect(corsHeaders(undefined)).toEqual({});
    expect(corsHeaders({ headers: {} })).toEqual({});
    expect(corsHeaders({ headers: { origin: 'https://evil.example' } })).toEqual({});

    const allowed = corsHeaders({
      headers: { origin: 'https://parisian3dsubway.netlify.app' },
    });
    expect(allowed['Access-Control-Allow-Origin']).toBe('https://parisian3dsubway.netlify.app');
    expect(allowed['Vary']).toBe('Origin');
    expect(allowed['Access-Control-Allow-Methods']).toBe('GET, OPTIONS');

    const dev = corsHeaders({ headers: { Origin: 'http://localhost:3000' } });
    expect(dev['Access-Control-Allow-Origin']).toBe('http://localhost:3000');
  });

  it('detects preflight and answers OPTIONS with 204', () => {
    expect(isPreflight({ httpMethod: 'OPTIONS' })).toBe(true);
    expect(isPreflight({ httpMethod: 'options' })).toBe(true);
    expect(isPreflight({ httpMethod: 'GET' })).toBe(false);
    expect(isPreflight(undefined)).toBe(false);

    const res = preflightResponse({ headers: { origin: 'http://localhost:3000' } });
    expect(res.statusCode).toBe(204);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000');

    const denied = preflightResponse({ headers: { origin: 'https://evil.example' } });
    expect(denied.statusCode).toBe(204);
    expect(denied.headers['Access-Control-Allow-Origin']).toBeUndefined();
  });
});

describe('STM relay CORS integration (no upstream call without STM_API_KEY)', () => {
  it('answers OPTIONS preflight with 204 and allowlisted origin', async () => {
    setEnv('STM_API_KEY', undefined);
    const res = await stmHandler({
      httpMethod: 'OPTIONS',
      headers: { origin: 'http://localhost:3000' },
    });
    expect(res.statusCode).toBe(204);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000');
  });

  it('echoes an allowed origin on GET and never sends a wildcard', async () => {
    setEnv('STM_API_KEY', undefined);
    setEnv('URL', 'https://parisian3dsubway.netlify.app');

    const allowed = await stmHandler({
      httpMethod: 'GET',
      headers: { origin: 'https://parisian3dsubway.netlify.app' },
    });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.headers['Access-Control-Allow-Origin']).toBe(
      'https://parisian3dsubway.netlify.app'
    );

    const denied = await stmHandler({
      httpMethod: 'GET',
      headers: { origin: 'https://evil.example' },
    });
    expect(denied.statusCode).toBe(200);
    expect(denied.headers['Access-Control-Allow-Origin']).toBeUndefined();

    const noOrigin = await stmHandler({ httpMethod: 'GET', headers: {} });
    expect(noOrigin.headers['Access-Control-Allow-Origin']).toBeUndefined();
  });
});
