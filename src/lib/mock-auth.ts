import { NextRequest } from 'next/server';

// Mock token format từ src/app/api/v1/auth/login/route.ts: `mock.<userId>.<timestamp>`.
export function getCurrentUserIdFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const [prefix, userId] = authHeader.slice('Bearer '.length).split('.');
  if (prefix !== 'mock' || !userId) return null;
  return userId;
}
