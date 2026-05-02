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
    'shopforge-saas-phi.vercel.app',
    'shopforge-saas-iota.vercel.app',
  ];

  // Also exclude paths that shouldn't be rewritten
  const excludedPaths = ['/api', '/_next', '/favicon.ico', '/dashboard', '/login', '/register', '/s/', '/_static', '/_vercel'];

  const isExcludedPath = excludedPaths.some(p => url.pathname.startsWith(p));
  if (isExcludedPath) return NextResponse.next();

  // Check if it's a main host
  // A host is main if it's in the list OR if it looks like a Vercel preview/branch URL for this project
  const isMainHost = mainHostnames.some(h => hostname === h) || 
                     (hostname.endsWith('.vercel.app') && 
                      (hostname.includes('shopforge-saas') || hostname.includes('shopforge')) && 
                      hostname.split('.').length === 3);

  // If it's a subdomain or custom domain, and not the main host
  if (!isMainHost) {
    // Extract the subdomain (e.g., "minhaloja" from "minhaloja.shopforge.vercel.app")
    const parts = hostname.split('.');
    let domain = parts[0];
    
    // If it's a subdomain of our main domain (e.g. loja.shopforge-saas.vercel.app)
    // the parts length will be 4.
    if (parts.length > 3 && hostname.endsWith('.vercel.app')) {
      domain = parts[0];
    } else if (parts.length === 2) {
      // custom-domain.com
      domain = parts[0];
    }

    // Perform the rewrite to the store path
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
