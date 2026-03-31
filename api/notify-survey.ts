import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 10;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.NOTIFICATION_EMAIL;

  // Silently succeed if not configured — notifications are optional
  if (!apiKey || !toEmail) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  const { projectName, region } = req.body as { projectName?: string; region?: string };

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: 'Validate Portal <notifications@resend.dev>',
      to: [toEmail],
      subject: `New survey response — ${projectName ?? 'your project'}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
          <h2 style="margin:0 0 8px">📬 New survey response</h2>
          <p style="color:#555;margin:0 0 16px">
            Someone just filled in your survey for <strong>${projectName ?? 'your project'}</strong>.
            ${region ? `They're from <strong>${region}</strong>.` : ''}
          </p>
          <a
            href="${process.env.VITE_APP_URL ?? 'https://validate-portal.vercel.app'}/app"
            style="display:inline-block;background:#f59e0b;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600"
          >
            View responses →
          </a>
        </div>
      `,
    }),
  });

  if (!emailRes.ok) {
    // Don't fail the survey submission — just log
    console.error('Resend error:', await emailRes.text());
    return res.status(200).json({ ok: true, emailFailed: true });
  }

  return res.status(200).json({ ok: true });
}
