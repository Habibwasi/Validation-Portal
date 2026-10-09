import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { GUEST_ENABLED, GUEST_RETENTION_DAYS, useAuthUser } from '@/lib/auth';
import { CAPTCHA_ENABLED } from './Turnstile';
import { Button } from './Button';
import toast from 'react-hot-toast';

interface GuestSignInProps {
  captchaToken: string | null;
  /** Called after each attempt so the parent can reset the (single-use) CAPTCHA token. */
  onAttempt: () => void;
}

export function GuestSignIn({ captchaToken, onAttempt }: GuestSignInProps) {
  const navigate = useNavigate();
  const { isGuest } = useAuthUser();
  const [loading, setLoading] = useState(false);

  if (!GUEST_ENABLED) return null;

  const handleClick = async () => {
    // Already in a guest session — resume it rather than creating a second, empty guest.
    if (isGuest) { navigate('/app'); return; }

    setLoading(true);
    const { error } = await supabase.auth.signInAnonymously({
      options: { captchaToken: captchaToken ?? undefined },
    });
    setLoading(false);
    onAttempt();
    if (error) { toast.error(error.message); return; }
    navigate('/app');
  };

  return (
    <>
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-[var(--border)]" />
        <span className="text-[11px] uppercase tracking-wider text-[var(--text3)]">or</span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>
      <Button
        variant="outline"
        size="lg"
        type="button"
        className="w-full"
        loading={loading}
        disabled={!isGuest && CAPTCHA_ENABLED && !captchaToken}
        onClick={handleClick}
      >
        {isGuest ? 'Continue your guest session' : 'Continue as guest'}
      </Button>
      <p className="text-center text-[11px] text-[var(--text3)] mt-2">
        No sign-up needed. Guest data is deleted after {GUEST_RETENTION_DAYS} days unless you save your account.
      </p>
    </>
  );
}
