import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value
    const { pathname } = request.nextUrl

    if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    // Verify token with backend
    const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'

    try {
    const res = await fetch(`${backendUrl}/api/me`, {
    headers: {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    },
    })

    if (!res.ok) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const data = await res.json()
    const role = data?.data?.role

    // strict route check
    const roleRouteMap: Record<string, string> = {
    super_admin: '/super',
    admin: '/admin',
    accountant: '/accountant',
    super_admin_viewer: '/viewer',
    }

    const allowedRoute = roleRouteMap[role]

    if (!allowedRoute || !pathname.startsWith(allowedRoute)) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    } catch {
    return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
      '/super/:path*',
      '/admin/:path*',
      '/accountant/:path*',
      '/viewer/:path*',
    ],
  }