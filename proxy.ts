import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAuthPage = pathname === '/login' || pathname === '/signup'

  // Only run session refresh — no auth gates in dev (pages fall back to mock data)
  if (!isAuthPage) {
    return NextResponse.next()
  }

  const { supabaseResponse, user } = await updateSession(request)

  // Bounce logged-in users away from login/signup
  if (user && isAuthPage) {
    const dashUrl = request.nextUrl.clone()
    dashUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/signup'],
}
