import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.redirect(302, 'https://validation-portal.vercel.app/og-portal.png');
}

