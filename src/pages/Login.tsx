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
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email, password }: FormData) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,.08),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,.06),transparent_40%),var(--bg)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-black text-[22px] tracking-wider uppercase mb-1">Validate</div>
          <p className="text-[var(--text2)] text-[13px]">Research Portal — Sign in to continue</p>
        </div>

        <div className="bg-[var(--surface)] border border-[rgba(255,255,255,.05)] rounded-2xl p-6 shadow-[0_24px_60px_rgba(0,0,0,.4)]">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button variant="primary" size="lg" type="submit" loading={loading} className="w-full mt-1">
              Sign in
            </Button>
          </form>

          {import.meta.env.VITE_DISABLE_SIGNUP !== 'true' && (
            <p className="text-center text-[12px] text-[var(--text3)] mt-4">
              No account?{' '}
              <Link to="/signup" className="text-[var(--accent)] hover:underline">Create one</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
