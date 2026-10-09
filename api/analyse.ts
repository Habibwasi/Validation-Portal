import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from './_auth.js';

export const maxDuration = 30;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await requireUser(req, res))) return;

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return res.status(503).json({ error: 'Groq API key not configured on server.' });
  }

  const { prompt } = req.body as { prompt?: string };
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing prompt in request body.' });
  }

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      reasoning_effort: 'low',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!groqRes.ok) {
    const errText = await groqRes.text();
    return res.status(groqRes.status).json({ error: errText });
  }

  const data = await groqRes.json() as { choices: { message: { content: string } }[] };
  const text = data.choices[0]?.message?.content ?? '{}';
  return res.status(200).json(JSON.parse(text));
}
