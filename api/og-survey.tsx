/** @jsxImportSource react */
import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default function handler(req: Request) {
  const title = new URL(req.url).searchParams.get('title') ?? "We'd love your feedback";

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0F172A',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Indigo centre glow */}
        <div
          style={{
            position: 'absolute',
            width: 700,
            height: 700,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(99,102,241,0.16) 0%, transparent 65%)',
            display: 'flex',
          }}
        />

        {/* Left accent bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 5,
            background: 'linear-gradient(180deg, #6366F1 0%, #8B5CF6 100%)',
            display: 'flex',
          }}
        />

        {/* Lock badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 88,
            height: 88,
            borderRadius: 24,
            background: 'rgba(99,102,241,0.15)',
            border: '1.5px solid rgba(99,102,241,0.35)',
            fontSize: 44,
            marginBottom: 32,
            boxShadow: '0 0 32px rgba(99,102,241,0.2)',
          }}
        >
          🔒
        </div>

        {/* Survey title */}
        <div
          style={{
            fontSize: 58,
            fontWeight: 800,
            color: '#F8FAFC',
            textAlign: 'center',
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
            maxWidth: 900,
            marginBottom: 28,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {title}
        </div>

        {/* Attribute chips */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 60 }}>
          {['Anonymous', '2 minutes', 'No sign-up'].map((tag) => (
            <div
              key={tag}
              style={{
                display: 'flex',
                padding: '9px 22px',
                borderRadius: 100,
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.22)',
                fontSize: 18,
                color: '#64748B',
              }}
            >
              {tag}
            </div>
          ))}
        </div>

        {/* Progress bar mock */}
        <div
          style={{
            width: 280,
            height: 5,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 100,
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          <div
            style={{
              width: '30%',
              height: '100%',
              background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
              borderRadius: 100,
              display: 'flex',
            }}
          />
        </div>

        {/* Footer branding */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              fontWeight: 900,
              color: 'white',
            }}
          >
            V
          </div>
          <span style={{ fontSize: 16, color: '#334155' }}>Validate Portal</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
