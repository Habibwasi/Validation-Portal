import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { User, Mail, KeyRound, LogOut, Trash2, Save, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { appBaseUrl, guestExpiresAt, useAuthUser } from '@/lib/auth';
import { Card, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import toast from 'react-hot-toast';

// ── Schemas ──────────────────────────────────────────────────────────────────

const nameSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(80),
});
type NameForm = z.infer<typeof nameSchema>;

const passwordSchema = z
  .object({
    password:    z.string().min(6, 'At least 6 characters'),
    confirm:     z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ['confirm'],
  });
type PasswordForm = z.infer<typeof passwordSchema>;

const saveAccountSchema = z.object({
  email: z.string().email('Enter a valid email'),
});
type SaveAccountForm = z.infer<typeof saveAccountSchema>;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnProjectId: string | undefined = (location.state as { projectId?: string } | null)?.projectId;
  // Set by the email-confirmation link a guest receives when saving their account.
  const [searchParams] = useSearchParams();
  const justUpgraded = searchParams.get('upgrade') === '1';
  const { user, isGuest } = useAuthUser();
  const email = user?.email ?? '';
  const [initials, setInitials]       = useState('');
  const [savingName, setSavingName]   = useState(false);
  const [savingPw, setSavingPw]       = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const nameForm = useForm<NameForm>({
    resolver: zodResolver(nameSchema),
    defaultValues: { full_name: '' },
  });

  const pwForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirm: '' },
  });

  const accountForm = useForm<SaveAccountForm>({
    resolver: zodResolver(saveAccountSchema),
    defaultValues: { email: '' },
  });

  // Load current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/login'); return; }
      const name: string = user.user_metadata?.full_name ?? '';
      nameForm.reset({ full_name: name });
      const parts = name.trim().split(/\s+/);
      setInitials(
        parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : (name[0] ?? (user.email?.[0] ?? '?')).toUpperCase(),
      );
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSaveName = async ({ full_name }: NameForm) => {
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name } });
    setSavingName(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Name updated');
    const parts = full_name.trim().split(/\s+/);
    setInitials(
      parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : (full_name[0] ?? '?').toUpperCase(),
    );
  };

  const onChangePassword = async ({ password }: PasswordForm) => {
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPw(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Password updated');
    pwForm.reset();
  };

  // Converting a guest keeps the same user id, so all their projects carry over.
  // Step 1: attach an email (Supabase sends a confirmation link back to /profile?upgrade=1).
  // Step 2: once confirmed, they set a password with the regular password form.
  const onSaveAccount = async ({ email: newEmail }: SaveAccountForm) => {
    setSavingAccount(true);
    const { error } = await supabase.auth.updateUser(
      { email: newEmail },
      { emailRedirectTo: `${appBaseUrl()}/profile?upgrade=1` },
    );
    setSavingAccount(false);
    if (error) {
      toast.error(
        /already (been )?registered|already exists/i.test(error.message)
          ? 'That email already has an account. Use a different email, or sign in to it (your guest projects won\'t be transferred).'
          : error.message,
      );
      return;
    }
    toast.success(`Confirmation link sent to ${newEmail}`);
    accountForm.reset();
  };

  const handleSignOut = async () => {
    if (isGuest && !confirmSignOut) { setConfirmSignOut(true); return; }
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    // Delete all user projects (cascade deletes are set on DB)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('projects').delete().eq('user_id', user.id);
    }
    const { error } = await supabase.rpc('delete_user');
    setDeleting(false);
    if (error) {
      // Fallback: just sign out if RPC not available
      toast.error('Could not delete account automatically. Please contact support.');
      return;
    }
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="p-4 sm:p-8 max-w-xl">
      {returnProjectId && (
        <button
          onClick={() => navigate(`/p/${returnProjectId}`)}
          className="flex items-center gap-1.5 text-[12px] text-[var(--text3)] hover:text-[var(--accent2)] transition-colors mb-4"
        >
          <ArrowLeft size={13} />
          Back to project
        </button>
      )}
      <PageHeader
        title="Profile"
        subtitle="Manage your account details and security settings."
      />

      {/* Avatar + email */}
      <Card className="mb-4" accent="yellow">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-white font-black text-[18px] flex-shrink-0 shadow-[0_6px_20px_rgba(245,158,11,.3)]">
            {initials || <User size={22} />}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[14px] text-[var(--text)] truncate">
              {nameForm.watch('full_name') || 'Your account'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Mail size={11} className="text-[var(--text3)] flex-shrink-0" />
              <span className="text-[12px] text-[var(--text3)] truncate">
                {isGuest && user
                  ? `Guest account · deleted on ${format(guestExpiresAt(user), 'MMM d, yyyy')}`
                  : email}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Display name */}
      <Card className="mb-4">
        <CardTitle><User size={14} /> Display name</CardTitle>
        <form onSubmit={nameForm.handleSubmit(onSaveName)} className="flex flex-col gap-4">
          <Input
            label="Full name"
            placeholder="Ada Lovelace"
            error={nameForm.formState.errors.full_name?.message}
            {...nameForm.register('full_name')}
          />
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" loading={savingName}>
              <Save size={13} /> Save name
            </Button>
          </div>
        </form>
      </Card>

      {isGuest ? (
      /* Save guest account */
      <Card className="mb-4" accent="yellow">
        <CardTitle><Save size={14} /> Save your account</CardTitle>
        <p className="text-[12px] text-[var(--text2)] mb-4">
          Add an email to keep your projects and sign in from any device. Without it, this guest
          account and everything in it is deleted on{' '}
          <span className="font-semibold text-[var(--text)]">{user && format(guestExpiresAt(user), 'MMM d')}</span>.
        </p>
        {user?.new_email && (
          <p className="text-[12px] text-[var(--text)] bg-[var(--surface2)] border border-[var(--border)] rounded-lg px-3 py-2 mb-4">
            Confirmation sent to <span className="font-semibold">{user.new_email}</span>. Click the link in that email to finish — you can resend below.
          </p>
        )}
        <form onSubmit={accountForm.handleSubmit(onSaveAccount)} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={accountForm.formState.errors.email?.message}
            {...accountForm.register('email')}
          />
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" loading={savingAccount}>
              <Mail size={13} /> {user?.new_email ? 'Resend confirmation' : 'Send confirmation link'}
            </Button>
          </div>
        </form>
      </Card>
      ) : (
      /* Change password — also the second step of saving a guest account */
      <Card className="mb-4" accent={justUpgraded ? 'yellow' : undefined}>
        <CardTitle><KeyRound size={14} /> {justUpgraded ? 'Set your password' : 'Change password'}</CardTitle>
        {justUpgraded && (
          <p className="text-[12px] text-[var(--text2)] mb-4">
            Your email is confirmed and your projects are saved. Set a password so you can sign in next time.
          </p>
        )}
        <form onSubmit={pwForm.handleSubmit(onChangePassword)} className="flex flex-col gap-4">
          <Input
            label="New password"
            type="password"
            placeholder="••••••••"
            error={pwForm.formState.errors.password?.message}
            {...pwForm.register('password')}
          />
          <Input
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            error={pwForm.formState.errors.confirm?.message}
            {...pwForm.register('confirm')}
          />
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" loading={savingPw}>
              <Save size={13} /> {justUpgraded ? 'Set password' : 'Update password'}
            </Button>
          </div>
        </form>
      </Card>
      )}

      {/* Sign out */}
      <Card className="mb-4">
        <CardTitle><LogOut size={14} /> Session</CardTitle>
        <p className="text-[12px] text-[var(--text2)] mb-4">
          {isGuest
            ? 'You are using a guest account.'
            : <>You are signed in as <span className="font-semibold text-[var(--text)]">{email}</span>.</>}
        </p>
        {confirmSignOut && (
          <p className="text-[12px] text-[var(--red)] font-semibold mb-3">
            Guest accounts can't be signed back into. Your projects will be lost unless you save your account first. Click again to sign out anyway.
          </p>
        )}
        <Button variant={confirmSignOut ? 'danger' : 'secondary'} size="sm" onClick={handleSignOut}>
          <LogOut size={13} /> {confirmSignOut ? 'Sign out anyway' : 'Sign out'}
        </Button>
        {confirmSignOut && (
          <button
            onClick={() => setConfirmSignOut(false)}
            className="ml-3 text-[12px] text-[var(--text3)] hover:text-[var(--text)] transition-colors"
          >
            Cancel
          </button>
        )}
      </Card>

      {/* Danger zone */}
      <Card className="border-[rgba(239,68,68,.25)]">
        <CardTitle className="text-[var(--red)]"><Trash2 size={14} /> Danger zone</CardTitle>
        <p className="text-[12px] text-[var(--text2)] mb-4">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        {confirmDelete && (
          <p className="text-[12px] text-[var(--red)] font-semibold mb-3">
            Are you sure? Click again to confirm permanent deletion.
          </p>
        )}
        <Button
          variant="danger"
          size="sm"
          loading={deleting}
          onClick={handleDeleteAccount}
        >
          <Trash2 size={13} />
          {confirmDelete ? 'Yes, delete my account' : 'Delete account'}
        </Button>
        {confirmDelete && (
          <button
            onClick={() => setConfirmDelete(false)}
            className="ml-3 text-[12px] text-[var(--text3)] hover:text-[var(--text)] transition-colors"
          >
            Cancel
          </button>
        )}
      </Card>
    </div>
  );
}
