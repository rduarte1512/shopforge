import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Define hostnames to exclude (main landing page, dashboard, etc.)
  const mainHostnames = [
    'localhost:3000',
    'shopforge-saas.vercel.app',
    'shopforge.vercel.app',
    'shopforge-saas-phi.vercel.app', // Add your specific Vercel URL here if needed
  ];

  // Also exclude paths that shouldn't be rewritten
  const excludedPaths = ['/api', '/_next', '/favicon.ico', '/dashboard', '/login', '/register', '/s/'];

  const isMainHost = mainHostnames.some(h => hostname.includes(h));
  const isExcludedPath = excludedPaths.some(p => url.pathname.startsWith(p));

  // If it's a subdomain or custom domain, and not an excluded path
  if (!isMainHost && !isExcludedPath) {
    // Extract the subdomain (e.g., "minhaloja" from "minhaloja.shopforge.vercel.app")
    // Or use the full hostname if it's a custom domain
    let domain = hostname.split('.')[0];
    
    // If it's a full custom domain (not a subdomain of vercel.app), you might want to use the full hostname
    // For now, we assume [subdomain].myapp.com or [slug].localhost:3000
    
    // Perform the rewrite
    return NextResponse.rewrite(new URL(`/s/${domain}${url.pathname}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};
