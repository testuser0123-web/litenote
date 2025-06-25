import { NextResponse } from 'next/server';

export async function GET() {
  // Get all environment variables that might be related to database
  const allEnvVars = Object.keys(process.env).filter(key => 
    key.includes('POSTGRES') || 
    key.includes('DATABASE') || 
    key.includes('DB') ||
    key.includes('VERCEL')
  );

  const envInfo: Record<string, boolean | string> = {};
  
  allEnvVars.forEach(key => {
    if (key.includes('PASSWORD') || key.includes('SECRET')) {
      envInfo[key] = '***HIDDEN***';
    } else {
      envInfo[key] = process.env[key] || 'undefined';
    }
  });

  return NextResponse.json({
    message: 'Environment Debug Info',
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    environmentVariables: envInfo,
    availableKeys: allEnvVars,
    totalEnvVars: Object.keys(process.env).length
  });
}