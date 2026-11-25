import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HealthPage } from "./health/HealthPage";
import { ChallengePage } from "./pages/ChallengePage";
import { IntegrationsPage } from "./pages/IntegrationsPage";
import { LearnPractisePage } from "./pages/LearnPractisePage";
import { OpportunitiesPage } from "./pages/OpportunitiesPage";
import { ProfileSetupPage } from "./pages/ProfileSetupPage";
import { RoleSelectionPage } from "./pages/RoleSelectionPage";
import { ValidationReportPage } from "./pages/ValidationReportPage";
import { WelcomePage } from "./pages/WelcomePage";
import { ResultsPage } from "./results/ResultsPage";
import { SessionPage } from "./session/SessionPage";
import { SetupFlow } from "./setup/SetupFlow";
import { SetupProvider } from "./setup/SetupContext";
import { SkillPage } from "./skill/SkillPage";

export function AppRoutes(): JSX.Element {
  return (
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
      <Route path="*" element={<WelcomePage />} />
    </Routes>
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
