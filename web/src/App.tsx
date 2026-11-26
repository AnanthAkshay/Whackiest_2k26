import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { WelcomePage } from "./pages/WelcomePage";
import { SetupProvider } from "./setup/SetupContext";
import { AppShell } from "./shared/AppShell";
import { Skeleton } from "./shared/ui";

const ProfileSetupPage = lazy(() => import("./pages/ProfileSetupPage").then((m) => ({ default: m.ProfileSetupPage })));
const RoleSelectionPage = lazy(() => import("./pages/RoleSelectionPage").then((m) => ({ default: m.RoleSelectionPage })));
const LearnPractisePage = lazy(() => import("./pages/LearnPractisePage").then((m) => ({ default: m.LearnPractisePage })));
const ChallengePage = lazy(() => import("./pages/ChallengePage").then((m) => ({ default: m.ChallengePage })));
const ValidationReportPage = lazy(() => import("./pages/ValidationReportPage").then((m) => ({ default: m.ValidationReportPage })));
const OpportunitiesPage = lazy(() => import("./pages/OpportunitiesPage").then((m) => ({ default: m.OpportunitiesPage })));
const IntegrationsPage = lazy(() => import("./pages/IntegrationsPage").then((m) => ({ default: m.IntegrationsPage })));
const SessionPage = lazy(() => import("./session/SessionPage").then((m) => ({ default: m.SessionPage })));
const ResultsPage = lazy(() => import("./results/ResultsPage").then((m) => ({ default: m.ResultsPage })));
const SkillPage = lazy(() => import("./skill/SkillPage").then((m) => ({ default: m.SkillPage })));
const HealthPage = lazy(() => import("./health/HealthPage").then((m) => ({ default: m.HealthPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));
const SetupFlow = lazy(() => import("./setup/SetupFlow").then((m) => ({ default: m.SetupFlow })));

function RouteFallback(): JSX.Element {
  return (
    <main className="shell">
      <div className="pf-frame">
        <div className="form-stack">
          <Skeleton variant="title" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      </div>
    </main>
  );
}

export function AppRoutes(): JSX.Element {
  return (
    <AppShell>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/profile" element={<ProfileSetupPage />} />
          <Route path="/role" element={<RoleSelectionPage />} />
          <Route path="/learn" element={<LearnPractisePage />} />
          <Route path="/challenge" element={<ChallengePage />} />
          <Route path="/validation" element={<ValidationReportPage />} />
          <Route path="/setup-viva" element={<SetupFlow />} />
          <Route path="/session" element={<SessionPage />} />
          <Route path="/explain" element={<SessionPage />} />
          <Route path="/results/:id" element={<ResultsPage />} />
          <Route path="/skill/:id" element={<SkillPage />} />
          <Route path="/passport/:id" element={<SkillPage />} />
          <Route path="/opportunities" element={<OpportunitiesPage />} />
          <Route path="/connect" element={<OpportunitiesPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/sponsors" element={<IntegrationsPage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}

export default function App(): JSX.Element {
  return (
    <BrowserRouter>
      <SetupProvider>
        <AppRoutes />
      </SetupProvider>
    </BrowserRouter>
  );
}
