import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
  confirm:  z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});
type FormData = z.infer<typeof schema>;

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email, password }: FormData) => {
    setLoading(true);
    const redirectTo = `${(import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ?? window.location.origin}/login`;
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Account created — check your email to confirm.');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,.08),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,.06),transparent_40%),var(--bg)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-black text-[22px] tracking-wider uppercase mb-1">Validate</div>
          <p className="text-[var(--text2)] text-[13px]">Create your researcher account</p>
        </div>

        <div className="bg-[var(--surface)] border border-[rgba(255,255,255,.05)] rounded-2xl p-6 shadow-[0_24px_60px_rgba(0,0,0,.4)]">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Email" type="email" placeholder="you@example.com"
              error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" placeholder="••••••••"
              error={errors.password?.message} {...register('password')} />
            <Input label="Confirm password" type="password" placeholder="••••••••"
              error={errors.confirm?.message} {...register('confirm')} />
            <Button variant="primary" size="lg" type="submit" loading={loading} className="w-full mt-1">
              Create account
            </Button>
          </form>
          <p className="text-center text-[12px] text-[var(--text3)] mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--accent)] hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
