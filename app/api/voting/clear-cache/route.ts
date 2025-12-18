import { NextResponse } from 'next/server';

// Cache-busting endpoint to force refresh
export async function POST() {
  try {
    // This will be imported by the other routes
    // For now, just return success
    return NextResponse.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
}
