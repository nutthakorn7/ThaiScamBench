import { ImageResponse } from 'next/og';
 
export const runtime = 'edge';
 
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
 
    // ?title=<title>&variant=<scam|safe>
    const hasTitle = searchParams.has('title');
    const title = hasTitle
      ? searchParams.get('title')?.slice(0, 100)
      : 'ThaiScamDetector';
    
    const variant = searchParams.get('variant');
    const isScam = variant === 'scam';
    const isSafe = variant === 'safe';

    // Viral Colors
    const bgGradient = isScam 
      ? 'linear-gradient(to bottom right, #450a0a, #7f1d1d)' // Dark Red
      : isSafe 
      ? 'linear-gradient(to bottom right, #052e16, #14532d)' // Dark Green
      : '#0f172a'; // Default Navy

    const iconColor = isScam ? '#ef4444' : isSafe ? '#4ade80' : 'white';

    return new ImageResponse(
      (
        <div
          style={{
            background: bgGradient,
            height: '100%',
            width: '100%',
            display: 'flex',
            textAlign: 'center',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            flexWrap: 'nowrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              justifyItems: 'center',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '100px',
              padding: '20px',
              border: `2px solid ${iconColor}40`
            }}
          >
            {isScam ? (
              // Warning Icon
              <svg width="75" height="75" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ) : isSafe ? (
              // Check Icon
              <svg width="75" height="75" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                 <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              // Shield Icon (Default)
              <svg width="75" height="75" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            )}
          </div>
          <div
            style={{
              fontSize: 60,
              fontStyle: 'normal',
              fontWeight: 900,
              letterSpacing: '-0.025em',
              color: 'white',
              marginTop: 30,
              padding: '0 120px',
              lineHeight: 1.2,
              whiteSpace: 'pre-wrap',
              textShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 30,
              fontStyle: 'normal',
              color: '#94a3b8',
              marginTop: 20,
            }}
          >
            ตรวจสอบการหลอกลวงด้วย AI
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch {
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
