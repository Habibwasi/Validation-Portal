import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

const LANG_NAMES: Record<string, string> = {
  ar: 'Arabic',
  bn: 'Bengali',
  fr: 'French',
  es: 'Spanish',
  tr: 'Turkish',
  hi: 'Hindi',
  da: 'Danish',
  de: 'German',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return res.status(503).json({ error: 'Groq API key not configured.' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(503).json({ error: 'Supabase not configured.' });
  }

  // Forward user JWT so Supabase RLS applies
  const jwt = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  const { projectId, languages } = req.body as { projectId?: string; languages?: string[] };
  if (!projectId || !Array.isArray(languages) || languages.length === 0) {
    return res.status(400).json({ error: 'Missing projectId or languages.' });
  }

  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, label, options')
    .eq('project_id', projectId)
    .order('display_order');

  if (error || !questions?.length) {
    return res.status(400).json({ error: 'No questions found for this project.' });
  }

  const langList = languages
    .map((l) => `${l} (${LANG_NAMES[l] ?? l})`)
    .join(', ');

  const prompt = `You are a professional survey translator. Translate the following survey questions into the requested languages.

Questions:
${JSON.stringify(questions.map((q) => ({ id: q.id, label: q.label, options: q.options })))}

Target languages: ${langList}

Return ONLY a JSON object in this exact shape:
{
  "<question_id>": {
    "<lang_code>": { "label": "<translated label>", "options": ["<translated option 1>", "<translated option 2>"] }
  }
}

Rules:
- Include "options" only if the original question has a non-null options array
- Keep options in the same order as the original
- Do not include any text outside the JSON object`;

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqKey}`,
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
    return res.status(groqRes.status).json({ error: errText });
  }

  const groqData = await groqRes.json() as {
    choices: { message: { content: string } }[];
  };
  const translated = JSON.parse(
    groqData.choices[0]?.message?.content ?? '{}'
  ) as Record<string, Record<string, { label: string; options?: string[] }>>;

  // Persist translations to each question row
  const updates = await Promise.all(
    Object.entries(translated).map(([qId, trans]) =>
      supabase
        .from('questions')
        .update({ translations: trans })
        .eq('id', qId)
    )
  );

  const failed = updates.filter((r) => r.error).length;
  if (failed > 0) {
    return res.status(500).json({ error: `${failed} question(s) failed to save translations.` });
  }

  return res.status(200).json({ ok: true, translatedCount: Object.keys(translated).length });
}
