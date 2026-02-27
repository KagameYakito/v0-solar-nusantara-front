// middleware.ts - DINONAKTIFKAN SEMENTARA
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Tidak melakukan apa-apa. Biarkan semua request lolos.
  return NextResponse.next()
}

export const config = {
  matcher: [], // Kosongkan matcher agar tidak jalan sama sekali
}