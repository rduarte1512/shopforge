import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/register(.*)",
  "/api/webhook(.*)",
  "/s/(.*)", // Public store pages
]);

const isAuthRoute = createRouteMatcher([
  "/login(.*)",
  "/register(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  try {
    const { userId } = await auth();

    // If the user is signed in and trying to access an auth page, redirect them to dashboard
    if (userId && isAuthRoute(request)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  } catch (error) {
    // Prevent the entire middleware from crashing if Clerk keys are missing or invalid
    console.error("Middleware error:", error);
    // If it's a critical error and we're not on a public route, we might want to let it through 
    // or handle it differently, but crashing (500) is what we want to avoid.
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!m)|jsx?|cfg|icon|zip|webp|mul|png|jpg|jpeg|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|rar|7z)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
