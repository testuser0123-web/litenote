import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const filename = params.filename;
  
  // Redirect to the actual file with .jpg extension
  const redirectUrl = new URL(`/uploads/${filename}.jpg`, request.url);
  
  return NextResponse.redirect(redirectUrl, 302);
}