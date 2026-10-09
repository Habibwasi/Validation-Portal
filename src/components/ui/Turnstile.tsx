import { useEffect, useRef } from 'react';

// Cloudflare Turnstile CAPTCHA. Supabase Auth has CAPTCHA protection on, so every sign-in/sign-up
// must send a token — the site key is public, so default to it rather than silently dropping the
// widget when the env var is missing from a build. Set VITE_TURNSTILE_SITE_KEY= (empty) to disable
// it, e.g. against a Supabase project with CAPTCHA protection off.
// Tokens are single-use: after every auth attempt, remount the widget (change its `key`) to get a fresh one.
const DEFAULT_SITE_KEY = '0x4AAAAAAFSAArW1hzd7xNuo';
const SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ?? DEFAULT_SITE_KEY;
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export const CAPTCHA_ENABLED = !!SITE_KEY;

interface TurnstileApi {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  remove(widgetId: string): void;
}

declare global {
  interface Window { turnstile?: TurnstileApi }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { scriptPromise = null; reject(new Error('Failed to load CAPTCHA')); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);

  useEffect(() => { onTokenRef.current = onToken; }, [onToken]);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    let widgetId: string | null = null;

    loadScript()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return;
        widgetId = window.turnstile.render(container.current, {
          sitekey: SITE_KEY,
          theme: localStorage.getItem('theme') === 'light' ? 'light' : 'dark',
          callback: (token: string) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => onTokenRef.current(null),
        });
      })
      .catch(() => onTokenRef.current(null));

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={container} className="flex justify-center min-h-[65px]" />;
}
