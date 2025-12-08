import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // define paths that are public or specific login pages to avoid loops
  if (path === '/admin/login' || path === '/partner/login') {
      return NextResponse.next();
  }

  // Admin Routes Protection
  if (path.startsWith('/admin')) {
    const session = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET || "super_secret_dev_key_change_me" 
    });

    // Check if logged in AND has admin role
    if (!session || (session.role !== 'admin')) {
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(url);
    }
  }

  // Partner Routes Protection
  if (path.startsWith('/partner')) {
    const session = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET || "super_secret_dev_key_change_me" 
    });

    // Check if logged in AND has partner role
    if (!session || (session.role !== 'partner' && session.role !== 'admin')) {
        // Admin can access partner portal too for debugging? 
        // Or strictly separate: session.role !== 'partner'
        // Let's allow admin to access partner pages? Usually helpful but maybe strict for now.
        // Let's implement strict role check first: must be partner.
        if (!session || session.role !== 'partner') {
            const url = new URL('/partner/login', request.url);
            url.searchParams.set('callbackUrl', encodeURI(request.url));
            return NextResponse.redirect(url);
        }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/partner/:path*',
    // Exclude API routes, static files, and login pages from matcher if regex allows, 
    // but explicit check in middleware is cleaner/safer with Next.js matcher limitations.
  ],
};
