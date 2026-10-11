import { NextResponse } from 'next/server';

// Raw, guessable download links are disabled. All downloads must go through a
// signed, time-limited URL minted by /api/download/sign and served by
// /api/download/file. This prevents public exposure of purchased files.
export async function GET() {
  return NextResponse.json(
    { error: 'Direct download links are disabled. Open your account and use the Download button to get a secure, time-limited link.' },
    { status: 403 },
  );
}
