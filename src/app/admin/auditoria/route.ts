import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.redirect(new URL('/admin/auditoria/tombo', process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'));
}
