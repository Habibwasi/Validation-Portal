import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = process.env.VITE_SUPABASE_URL      ?? process.env.SUPABASE_URL      ?? '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
const GROQ_API_URL      = 'https://api.groq.com/openai/v1/chat/completions';

// Allow up to 60s — large translation jobs can be slow
export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(503).json({ error: 'Groq API key not configured.', hint: 'GROQ_API_KEY env var is missing or empty on the server.' });
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return res.status(503).json({ error: 'Supabase not configured.' });

  const { project_id, languages } = req.body as {
    project_id?: string;
    languages?: string[];
  };

  if (!project_id || !Array.isArray(languages) || languages.length === 0) {
    return res.status(400).json({ error: 'project_id and languages[] are required.' });
  }

  // Forward the user's JWT so RLS policies allow the UPDATE
  const authHeader = req.headers.authorization;
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  });

  // Fetch all questions for the project
  const { data: questions, error: qErr } = await supabase
    .from('questions')
    .select('id, label, options, type')
    .eq('project_id', project_id);

  if (qErr || !questions) {
    return res.status(500).json({ error: 'Failed to fetch questions.' });
  }

  // Build one prompt that translates all questions into all requested languages at once
  const questionsPayload = questions.map((q) => ({
    id: q.id,
    label: q.label,
    options: q.options ?? [],
  }));

  const targetLangs = languages.filter((l) => l !== 'en'); // English is the source
  if (targetLangs.length === 0) {
    return res.status(200).json({ translated: 0 });
  }

  const prompt = `You are a professional survey translator. Translate the following survey questions into each of the requested languages.

Return ONLY valid JSON in this exact shape:
{
  "<question_id>": {
    "<lang_code>": { "label": "<translated label>", "options": ["<opt1>", "<opt2>"] }
  }
}

If a question has no options, return "options": [].
Preserve the meaning and tone exactly. For Arabic set right-to-left text naturally.

Languages to translate into: ${targetLangs.join(', ')}

Questions:
${JSON.stringify(questionsPayload, null, 2)}`;

  let parsed: Record<string, Record<string, { label: string; options: string[] }>>;
  try {
    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });
    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return res.status(502).json({ error: `Translation failed: ${errText}`, keyPrefix: key.slice(0, 8) });
    }
    const groqData = await groqRes.json() as {
      choices?: { message?: { content?: string } }[];
    };
    const text = groqData.choices?.[0]?.message?.content ?? '{}';
    parsed = JSON.parse(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: `Translation failed: ${msg}` });
  }

  // Persist translations for each question
  const updates = questions.map((q) => {
    const trans = parsed[q.id] ?? {};
    return supabase
      .from('questions')
      .update({ translations: trans })
      .eq('id', q.id);
  });

  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error)?.error;
  const failed = results.filter((r) => r.error).length;

  if (failed > 0) {
    return res.status(500).json({ error: `${failed} question(s) failed to save: ${firstError?.message ?? 'RLS or schema error — ensure the translations column exists and you are authenticated.'}` });
  }

  return res.status(200).json({ translated: questions.length, languages: targetLangs });
}
