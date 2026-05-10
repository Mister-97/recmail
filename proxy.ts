import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAuthPage = pathname === '/login' || pathname === '/signup'
  const isAdminPage = pathname.startsWith('/admin')
  const isAdminApi = pathname.startsWith('/api/admin')

  // For admin routes and auth pages, we need to check the session
  if (isAuthPage || isAdminPage || isAdminApi) {
    const { supabaseResponse, user } = await updateSession(request)

    // Bounce logged-in users away from login/signup
    if (user && isAuthPage) {
      const dashUrl = request.nextUrl.clone()
      dashUrl.pathname = '/dashboard'
      return NextResponse.redirect(dashUrl)
    }

    // Block unauthenticated access to admin pages
    if (!user && isAdminPage) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Block unauthenticated access to admin API routes
    if (!user && isAdminApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return supabaseResponse
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/api/admin/:path*', '/login', '/signup'],
}
