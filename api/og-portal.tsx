import { ImageResponse } from '@vercel/og';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#0F172A',
          padding: '64px 80px',
          position: 'relative',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Indigo radial glow — top right */}
        <div
          style={{
            position: 'absolute',
            top: -160,
            right: -160,
            width: 560,
            height: 560,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Purple radial glow — bottom left */}
        <div
          style={{
            position: 'absolute',
            bottom: -120,
            left: -80,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
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

        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 52 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 900,
              color: 'white',
              boxShadow: '0 0 24px rgba(99,102,241,0.5)',
            }}
          >
            V
          </div>
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#475569',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Validate Portal
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 74,
            fontWeight: 800,
            color: '#F8FAFC',
            lineHeight: 1.0,
            letterSpacing: '-0.03em',
            marginBottom: 24,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span>Startup Validation</span>
          <span style={{ color: '#818CF8' }}>Research Tool.</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: '#64748B',
            marginBottom: 56,
            display: 'flex',
            letterSpacing: '-0.01em',
          }}
        >
          Know what customers need — before you build.
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 14 }}>
          {[
            { icon: '📋', label: 'Surveys' },
            { icon: '🎙️', label: 'Interviews' },
            { icon: '✦', label: 'AI Analysis' },
          ].map(({ icon, label }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '13px 26px',
                borderRadius: 100,
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.28)',
                fontSize: 20,
                fontWeight: 600,
                color: '#A5B4FC',
              }}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Bottom domain */}
        <div
          style={{
            position: 'absolute',
            bottom: 44,
            right: 80,
            fontSize: 16,
            color: '#1E293B',
            display: 'flex',
            letterSpacing: '0.02em',
          }}
        >
          validation-portal.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.send(buffer);
}
