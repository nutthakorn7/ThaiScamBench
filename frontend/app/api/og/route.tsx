import { ImageResponse } from 'next/og';
 
export const runtime = 'edge';
 
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
 
    // ?title=<title>
    const hasTitle = searchParams.has('title');
    const title = hasTitle
      ? searchParams.get('title')?.slice(0, 100)
      : 'ThaiScamDetector';
 
    return new ImageResponse(
      (
        <div
          style={{
            backgroundColor: '#0f172a',
            backgroundSize: '150px 150px',
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
            }}
          >
            <svg
              width="75"
              height="75"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style={{ margin: '0 20px' }}
            >
               <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div
            style={{
              fontSize: 60,
              fontStyle: 'normal',
              letterSpacing: '-0.025em',
              color: 'white',
              marginTop: 30,
              padding: '0 120px',
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap',
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
