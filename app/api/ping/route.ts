import { NextResponse } from 'next/server';

// Simple ping endpoint for connectivity checks
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: Date.now() });
}

// Support HEAD requests for lightweight connection checks
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
