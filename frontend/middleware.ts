import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define paths that require authentication
  if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
    const session = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET || "super_secret_dev_key_change_me" 
    });

    if (!session) {
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
