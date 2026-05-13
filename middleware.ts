import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequestWithAuth } from 'next-auth/middleware';

// List of protected routes that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/applications', '/change-password'];

// List of public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/verify-email'];

export async function middleware(request: NextRequestWithAuth) {
  // Skip middleware for static files and API routes
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production'
  });
  
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If it's a protected route and there's no token, redirect to login
  if (isProtectedRoute && !token) {
    const url = new URL('/login', request.nextUrl.origin);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // If user is authenticated and tries to access public routes, redirect to dashboard
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl.origin));
  }

  // For protected routes, verify user status
  if (isProtectedRoute && token) {
    try {
      // Only verify user status if token is about to expire
      const tokenExp = token.exp as number;
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = tokenExp - now;

      // If token is about to expire (less than 30 minutes), verify user status
      if (timeUntilExpiry < 1800) {
        const apiUrl = new URL(`/api/users/${token.id}`, request.nextUrl.origin);
        const response = await fetch(apiUrl.toString(), {
          headers: {
            'Authorization': `Bearer ${token.jti}`,
          },
        });
        
        if (!response.ok) {
          // If API call fails, redirect to login
          const url = new URL('/login', request.nextUrl.origin);
          url.searchParams.set('error', 'Session expired');
          return NextResponse.redirect(url);
        }

        const user = await response.json();

        if (!user.isVerified) {
          return NextResponse.redirect(new URL(`/verify-email?userId=${token.id}`, request.nextUrl.origin));
        }
      }
    } catch (error) {
      console.error('Middleware error:', error);
      // On error, continue with the request
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/applications/:path*',
    '/change-password/:path*',
    '/login',
    '/signup',
    '/verify-email'
  ]
}; 