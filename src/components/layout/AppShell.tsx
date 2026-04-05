import { useState, useEffect } from 'react';
import { NavLink, useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, ClipboardList, BarChart2,
  ChevronLeft, ChevronDown, LogOut, FolderOpen, Settings, Sun, Moon, UserCircle
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
            ? 'bg-gradient-to-r from-[rgba(245,158,11,.15)] to-[rgba(251,146,60,.08)] text-[var(--text)] border border-[rgba(245,158,11,.25)]'
            : 'text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--surface2)]',
        )
      }
    >
      <span className="flex-shrink-0">{icon}</span>
      {label}
    </NavLink>
  );
}

function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') ?? 'dark';
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  return { theme, toggle: () => setTheme((t) => t === 'dark' ? 'light' : 'dark') };
}

// ── Mobile bottom nav item ───────────────────────────────────────────────────

function MobileNavItem({ to, icon, label, end }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
          isActive ? 'text-[var(--accent)]' : 'text-[var(--text3)]',
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const { current } = useProjectStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [allProjects, setAllProjects] = useState<{ id: string; name: string }[]>([]);
  const { theme, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    if (!id) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('projects')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('archived', false)
        .order('created_at', { ascending: false })
        .then(({ data }) => setAllProjects(data ?? []));
    });
  }, [id]);

  // Keep sub-path (e.g. '/interviews') so switching projects lands on the same page
  const subPath = id ? location.pathname.slice(`/p/${id}`.length) : '';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Mobile top bar ─────────────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[var(--bg2)] border-b border-[var(--border)] safe-top">
      <div className="h-12 flex items-center px-4 gap-2">
        <button
          onClick={() => id ? navigate('/app') : undefined}
          className="font-black text-[13px] tracking-wider uppercase text-[var(--text)] flex-shrink-0"
        >
          Validate
        </button>
        {current && (
          <>
            <span className="text-[var(--text3)] text-[12px]">/</span>
            <span className="text-[12px] text-[var(--text2)] truncate flex-1">{current.name}</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-1">
          {id && (
            <button
              onClick={() => navigate(`/p/${id}/settings`)}
              className="p-2 rounded-lg text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-all"
            >
              <Settings size={15} />
            </button>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-all"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg text-[var(--text3)] hover:text-[var(--red)] hover:bg-[rgba(239,68,68,.06)] transition-all"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
      </div>

      {/* ── Desktop Sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg2)] backdrop-blur-xl sticky top-0 h-screen overflow-y-auto">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-[var(--border)]">
          <div className="font-black text-[15px] tracking-wider text-[var(--text)] uppercase">
            Validate
          </div>
          <div className="text-[10px] text-[var(--text3)] tracking-wider mt-0.5">Idea Validator</div>
        </div>

        {/* Project context */}
        {id && (
          <div className="px-4 pt-4 pb-2">
            <button
              onClick={() => navigate('/app')}
              className="flex items-center gap-1.5 text-[11px] text-[var(--text3)] hover:text-[var(--accent2)] transition-colors mb-3"
            >
              <ChevronLeft size={12} />
              All ideas
            </button>
            <div className="bg-[var(--surface2)] border border-[var(--border)] rounded-xl px-3 py-2.5">
              <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider mb-1">Project</div>
              <div className="relative">
                <select
                  value={id}
                  onChange={(e) => { if (e.target.value !== id) navigate(`/p/${e.target.value}${subPath}`); }}
                  className="w-full appearance-none bg-transparent text-[var(--text)] text-[13px] font-semibold cursor-pointer border-0 outline-none pr-4"
                >
                  {allProjects.length > 0
                    ? allProjects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))
                    : current && <option value={current.id}>{current.name}</option>
                  }
                </select>
                {allProjects.length > 1 && (
                  <ChevronDown size={11} className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--text3)] pointer-events-none" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 px-3 py-3 flex flex-col gap-1">
          {id ? (
            <>
              <NavItem to={`/p/${id}`} icon={<LayoutDashboard size={15} />} label="Dashboard" end />
              <NavItem to={`/p/${id}/survey`} icon={<MessageSquare size={15} />} label="Survey Builder" />
              <NavItem to={`/p/${id}/interviews`} icon={<ClipboardList size={15} />} label="Conversations" />
              <NavItem to={`/p/${id}/analysis`} icon={<BarChart2 size={15} />} label="My Results" />
              <NavItem to={`/p/${id}/settings`} icon={<Settings size={15} />} label="Settings" />
            </>
          ) : (
            <NavItem to="/app" icon={<FolderOpen size={15} />} label="My Ideas" end />
          )}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 border-t border-[var(--border)] pt-3 space-y-1">
          <button
            onClick={() => navigate('/profile', id ? { state: { projectId: id } } : {})}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-all"
          >
            <UserCircle size={15} className="flex-shrink-0" />
            Profile
          </button>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-all"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-[var(--text2)] hover:text-[var(--red)] hover:bg-[rgba(239,68,68,.06)] transition-all"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-x-hidden mobile-main-padding">
        {children}
      </main>

      {/* ── Mobile bottom nav ───────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg2)] border-t border-[var(--border)] flex items-stretch safe-bottom">
        {id ? (
          <>
            <MobileNavItem to={`/p/${id}`} icon={<LayoutDashboard size={18} />} label="Dashboard" end />
            <MobileNavItem to={`/p/${id}/survey`} icon={<MessageSquare size={18} />} label="Survey" />
            <MobileNavItem to={`/p/${id}/interviews`} icon={<ClipboardList size={18} />} label="Interviews" />
            <MobileNavItem to={`/p/${id}/analysis`} icon={<BarChart2 size={18} />} label="Results" />
            <MobileNavItem to="/profile" icon={<UserCircle size={18} />} label="Profile" />
          </>
        ) : (
          <>
            <MobileNavItem to="/app" icon={<FolderOpen size={18} />} label="My Ideas" end />
            <MobileNavItem to="/profile" icon={<UserCircle size={18} />} label="Profile" />
          </>
        )}
      </nav>
    </div>
  );
}
