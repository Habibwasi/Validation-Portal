import { NavLink, useParams, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, ClipboardList, BarChart2,
  ChevronLeft, LogOut, FolderOpen, Settings
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useProjectStore } from '@/store/projectStore';
import { cn } from '@/lib/utils';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}

function NavItem({ to, icon, label, end }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all',
          isActive
            ? 'bg-gradient-to-r from-[rgba(59,130,246,.18)] to-[rgba(6,182,212,.1)] text-[var(--text)] border border-[rgba(59,130,246,.25)]'
            : 'text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--surface2)]',
        )
      }
    >
      <span className="flex-shrink-0">{icon}</span>
      {label}
    </NavLink>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const { current } = useProjectStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col border-r border-[var(--border)] bg-[rgba(13,18,32,.95)] backdrop-blur-xl sticky top-0 h-screen overflow-y-auto">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-[var(--border)]">
          <div className="font-black text-[15px] tracking-wider text-[var(--text)] uppercase">
            Validate
          </div>
          <div className="text-[10px] text-[var(--text3)] tracking-wider mt-0.5">Research Portal</div>
        </div>

        {/* Project context */}
        {id && current && (
          <div className="px-4 pt-4 pb-2">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-[11px] text-[var(--text3)] hover:text-[var(--accent2)] transition-colors mb-3"
            >
              <ChevronLeft size={12} />
              All projects
            </button>
            <div className="bg-[var(--surface2)] border border-[var(--border)] rounded-xl px-3 py-2.5">
              <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider mb-0.5">Current project</div>
              <div className="font-semibold text-[13px] truncate">{current.name}</div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 px-3 py-3 flex flex-col gap-1">
          {id ? (
            <>
              <NavItem to={`/p/${id}`} icon={<LayoutDashboard size={15} />} label="Dashboard" end />
              <NavItem to={`/p/${id}/survey`} icon={<MessageSquare size={15} />} label="Survey Builder" />
              <NavItem to={`/p/${id}/interviews`} icon={<ClipboardList size={15} />} label="Interviews" />
              <NavItem to={`/p/${id}/analysis`} icon={<BarChart2 size={15} />} label="AI Analysis" />
              <NavItem to={`/p/${id}/settings`} icon={<Settings size={15} />} label="Settings" />
            </>
          ) : (
            <NavItem to="/" icon={<FolderOpen size={15} />} label="Projects" end />
          )}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 border-t border-[var(--border)] pt-3">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-[var(--text2)] hover:text-[var(--red)] hover:bg-[rgba(239,68,68,.06)] transition-all"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
