import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 10;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Silently succeed if not configured ΓÇö notifications are optional
  if (!apiKey || !supabaseUrl || !serviceRoleKey) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  const { projectId, projectName, region } = req.body as { projectId?: string; projectName?: string; region?: string };

  if (!projectId) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  // Look up project owner's email using service role key
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: project } = await admin.from('projects').select('user_id').eq('id', projectId).single();
  if (!project?.user_id) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  const { data: { user } } = await admin.auth.admin.getUserById(project.user_id);
  const ownerEmail = user?.email;

  if (!ownerEmail) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: 'Validate Portal <onboarding@resend.dev>',
      to: [ownerEmail],
      subject: `New survey response ΓÇö ${projectName ?? 'your project'}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
          <h2 style="margin:0 0 8px">≡ƒô¼ New survey response</h2>
          <p style="color:#555;margin:0 0 16px">
            Someone just filled in your survey for <strong>${projectName ?? 'your project'}</strong>.
            ${region ? `They're from <strong>${region}</strong>.` : ''}
          </p>
          <a
            href="${process.env.VITE_APP_URL ?? 'https://validate-portal.vercel.app'}/app"
            style="display:inline-block;background:#f59e0b;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600"
          >
            View responses ΓåÆ
          </a>
        </div>
      `,
    }),
  });

  if (!emailRes.ok) {
    // Don't fail the survey submission ΓÇö just log
    console.error('Resend error:', await emailRes.text());
    return res.status(200).json({ ok: true, emailFailed: true });
  }

  return res.status(200).json({ ok: true });
}
