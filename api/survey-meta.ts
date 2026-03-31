import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = process.env.VITE_SUPABASE_URL     ?? process.env.SUPABASE_URL     ?? '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';

// Known social / link-preview crawlers
const BOT_PATTERN =
  /facebookexternalhit|whatsapp|twitterbot|linkedinbot|slackbot|telegrambot|discordbot|googlebot|baiduspider|applebot|imessagebot|iMessageLinkBot/i;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ua   = (req.headers['user-agent'] ?? '') as string;
  const slug = (req.query.slug as string | undefined) ?? '';

  // Only serve the OG stub to crawlers — real users get the SPA
  if (!BOT_PATTERN.test(ua)) {
    res.setHeader('Location', `/s/${slug}`);
    return res.status(302).end();
  }

  // Fetch project name from Supabase
  let title       = "We'd love your feedback — quick anonymous survey";
  let description = 'Anonymous · 2 minutes · No sign-up needed.';

  if (slug && SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data } = await supabase
        .from('projects')
        .select('name, description')
        .eq('slug', slug)
        .single();

      if (data?.name) {
        title       = `${escapeHtml(data.name)} — quick anonymous survey`;
        description = data.description
          ? escapeHtml(data.description)
          : description;
      }
    } catch {
      // Fall back to defaults — don't crash the preview
    }
  }

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://validation-portal.vercel.app';

  const imageUrl  = `${baseUrl}/og-preview.png`;
  const pageUrl   = `${baseUrl}/s/${slug}`;
  const safeTitle = escapeHtml(title);
  const safeDesc  = escapeHtml(description);

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />

  <!-- Open Graph -->
  <meta property="og:type"         content="website" />
  <meta property="og:url"          content="${pageUrl}" />
  <meta property="og:title"        content="${safeTitle}" />
  <meta property="og:description"  content="${safeDesc}" />
  <meta property="og:image"        content="${imageUrl}" />
  <meta property="og:image:width"  content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter / X -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image"       content="${imageUrl}" />

  <!-- Redirect browsers that somehow land here -->
  <meta http-equiv="refresh" content="0; url=${pageUrl}" />
</head>
<body>
  <p><a href="${pageUrl}">Click here to open the survey</a></p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  return res.status(200).send(html);
}
