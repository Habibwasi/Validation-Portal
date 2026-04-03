import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Archive, Trash2, ExternalLink, BarChart2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useProjectStore } from '@/store/projectStore';
import type { Project } from '@/types';
import { uniqueSlug, formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, SkeletonCard } from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  description: z.string().max(300).optional(),
  target_interviews: z.number().min(1).max(1000),
  target_surveys: z.number().min(1).max(10000),
});
type FormData = z.infer<typeof schema>;

export default function Projects() {
  const navigate = useNavigate();
  const { projects, setProjects } = useProjectStore();
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [delTarget, setDelTarget] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [filter, setFilter] = useState<'active' | 'archived'>('active');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { target_interviews: 20, target_surveys: 50 },
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setProjects(data ?? []);
      setLoading(false);
    })();
  }, [navigate, setProjects]);

  const onCreate = async (data: FormData) => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const slug = uniqueSlug(data.name);
    const { data: created, error } = await supabase
      .from('projects')
      .insert({
        user_id: user!.id,
        name: data.name,
        description: data.description ?? null,
        slug,
        target_interviews: data.target_interviews,
        target_surveys: data.target_surveys,
        archived: false,
        settings: {},
      })
      .select()
      .single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setProjects([created, ...projects]);
    setShowCreate(false);
    reset();
    toast.success("You're off to a great start!");
    navigate(`/p/${created.id}`, { state: { onboarding: true } });
  };

  const onArchive = async (p: Project) => {
    const { error } = await supabase
      .from('projects')
      .update({ archived: !p.archived })
      .eq('id', p.id);
    if (error) { toast.error(error.message); return; }
    setProjects(projects.map((x) => x.id === p.id ? { ...x, archived: !x.archived } : x));
    toast.success(p.archived ? 'Idea restored' : 'Idea archived');
  };

  const onDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('projects').delete().eq('id', delTarget.id);
    setDeleting(false);
    if (error) { toast.error(error.message); return; }
    setProjects(projects.filter((p) => p.id !== delTarget.id));
    setDelTarget(null);
    toast.success('Idea deleted');
  };

  const filtered = projects.filter((p) => p.archived === (filter === 'archived'));

  return (
    <div className="p-4 sm:p-8">
      <PageHeader
        title="Your Ideas"
        subtitle="Pick an idea to work on, or start validating a new one."
        actions={
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Start a new idea
          </Button>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 w-fit mb-6">
        {(['active', 'archived'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all capitalize ${
              filter === f
                ? 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white shadow-[0_4px_12px_rgba(245,158,11,.3)]'
                : 'text-[var(--text2)] hover:text-[var(--text)]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map((k) => <SkeletonCard key={k} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={filter === 'archived' ? '📁' : '🚀'}
          title={filter === 'archived' ? 'No archived ideas' : "You haven't started yet — that's okay"}
          description={filter === 'active' ? "Add your first idea and we'll help you find out if people actually want it." : undefined}
          action={
            filter === 'active'
              ? <Button variant="primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Start a new idea</Button>
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onOpen={() => navigate(`/p/${p.id}`)}
              onArchive={() => onArchive(p)}
              onDelete={() => setDelTarget(p)}
              onShareSurvey={() => {
                const url = `${window.location.origin}/s/${p.slug}`;
                navigator.clipboard.writeText(url);
                toast.success('Survey link copied!');
              }}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); reset(); }}
        title="What's your idea?"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowCreate(false); reset(); }}>Never mind</Button>
            <Button variant="primary" loading={saving} onClick={handleSubmit(onCreate)}>Let's go</Button>
          </>
        }
      >
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onCreate)}>
          <Input
            label="What are you calling it?"
            placeholder="e.g. My remittance app"
            required
            error={errors.name?.message}
            {...register('name')}
          />
          <Textarea
            label="What problem does it solve?"
            placeholder="Describe the problem and who has it — in plain language"
            error={errors.description?.message}
            {...register('description')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="How many conversations do you want?"
              type="number"
              min={1}
              error={errors.target_interviews?.message}
              {...register('target_interviews', { valueAsNumber: true })}
            />
            <Input
              label="How many survey responses?"
              type="number"
              min={1}
              error={errors.target_surveys?.message}
              {...register('target_surveys', { valueAsNumber: true })}
            />
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={onDelete}
        title="Delete this idea?"
        message={`This will permanently delete everything in "${delTarget?.name}" — conversations, surveys, and analysis. There's no going back.`}
        loading={deleting}
      />
    </div>
  );
}

// ── Project Card ─────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: Project;
  onOpen: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onShareSurvey: () => void;
}

function ProjectCard({ project: p, onOpen, onArchive, onDelete, onShareSurvey }: ProjectCardProps) {
  return (
    <Card className="group hover:border-[rgba(245,158,11,.3)] transition-all cursor-pointer" accent="blue">
      <div onClick={onOpen}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[15px] truncate">{p.name}</div>
            <div className="text-[11px] text-[var(--text3)] mt-0.5">{formatDate(p.created_at)}</div>
          </div>
          {p.archived && <Badge variant="neutral" className="ml-2 flex-shrink-0">Archived</Badge>}
        </div>
        {p.description && (
          <p className="text-[12px] text-[var(--text2)] line-clamp-2 mb-3">{p.description}</p>
        )}
        <div className="text-[11px] text-[var(--text3)]">
          Slug: <span className="font-mono text-[var(--accent2)]">/s/{p.slug}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-[var(--border)]">
        <Button size="sm" variant="primary" onClick={onOpen}>
          <BarChart2 size={13} /> View
        </Button>
        <Button size="sm" variant="secondary" onClick={onShareSurvey}>
          <ExternalLink size={13} /> Share link
        </Button>
        <div className="flex gap-1 ml-auto">
          <Button size="sm" variant="ghost" onClick={onArchive} title={p.archived ? 'Restore' : 'Archive'}>
            <Archive size={13} />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} title="Delete" className="hover:text-[var(--red)]">
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
