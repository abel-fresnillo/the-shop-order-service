import request from 'supertest';
import { createApp } from '../../src/app';

export const API_KEY = 'a'.repeat(32);

export function authedRequest(app: ReturnType<typeof createApp>) {
  return {
    get: (url: string) => request(app).get(url).set('x-api-key', API_KEY),
    post: (url: string) => request(app).post(url).set('x-api-key', API_KEY),
  };
}
