/**
 * API Route for receiving error reports from client
 * Forwards to backend API for email and GitHub issue creation
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const reportData = await request.json();

    // Forward to backend API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${apiUrl}/api/report-error`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('❌ Error reporting failed:', error);
    return NextResponse.json(
      { error: 'Failed to report error' },
      { status: 500 }
    );
  }
}


