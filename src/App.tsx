import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useProjectStore } from '@/store/projectStore';
import { AppShell } from '@/components/layout/AppShell';

import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Projects from '@/pages/Projects';
import Dashboard from '@/pages/Dashboard';
import SurveyBuilder from '@/pages/SurveyBuilder';
import Interviews from '@/pages/Interviews';
import Analysis from '@/pages/Analysis';
import ProjectSettings from '@/pages/ProjectSettings';
import PublicSurvey from '@/pages/PublicSurvey';

// ── Auth guard ───────────────────────────────────────────────────────────────

function RequireAuth() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// ── Project loader wrapper ───────────────────────────────────────────────────

function ProjectLoader() {
  const { id } = useParams<{ id: string }>();
  const { loadProject, current: project } = useProjectStore();

  useEffect(() => {
    if (id && id !== project?.id) {
      loadProject(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return <Outlet />;
}

// ── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route
          path="/signup"
          element={
            import.meta.env.VITE_DISABLE_SIGNUP === 'true'
              ? <Navigate to="/login" replace />
              : <Signup />
          }
        />
        <Route path="/s/:slug" element={<PublicSurvey />} />

        {/* Protected routes */}
        <Route element={<RequireAuth />}>
          <Route element={<AppShell><Outlet /></AppShell>}>
            <Route path="/" element={<Projects />} />

            {/* Project sub-routes */}
            <Route path="/p/:id" element={<ProjectLoader />}>
              <Route index element={<Dashboard />} />
              <Route path="survey" element={<SurveyBuilder />} />
              <Route path="interviews" element={<Interviews />} />
              <Route path="analysis" element={<Analysis />} />
              <Route path="settings" element={<ProjectSettings />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

