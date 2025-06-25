import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      session: session,
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!session?.user?.id,
      userEmail: session?.user?.email,
      userId: session?.user?.id,
      userName: session?.user?.name,
    });
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json({ 
      error: 'Failed to get session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}