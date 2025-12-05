import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  
  const apiUrl = 'https://api.thaiscam.zcr.ai/v1/public/detect/text';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to API' },
      { status: 500 }
    );
  }
}
