import { NextResponse } from 'next/server';

export async function GET() {
  const missingEnvVars: string[] = [];
  
  // Check required environment variables
  if (!process.env.GOOGLE_CLIENT_ID) missingEnvVars.push('GOOGLE_CLIENT_ID');
  if (!process.env.GOOGLE_CLIENT_SECRET) missingEnvVars.push('GOOGLE_CLIENT_SECRET');
  if (!process.env.NEXTAUTH_SECRET) missingEnvVars.push('NEXTAUTH_SECRET');
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    missingEnvVars.push('DATABASE_URL or POSTGRES_URL');
  }
  
  const hasAllRequiredVars = missingEnvVars.length === 0;
  
  return NextResponse.json({
    status: hasAllRequiredVars ? 'healthy' : 'configuration_incomplete',
    message: hasAllRequiredVars 
      ? 'All required environment variables are set' 
      : `Missing environment variables: ${missingEnvVars.join(', ')}`,
    missingEnvVars,
    hasGoogleOAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    hasDatabase: !!(process.env.DATABASE_URL || process.env.POSTGRES_URL),
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    timestamp: new Date().toISOString()
  });
}