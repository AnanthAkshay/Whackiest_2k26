import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HealthPage } from "./health/HealthPage";
import { ResultsPage } from "./results/ResultsPage";
import { SessionPage } from "./session/SessionPage";
import { SetupFlow } from "./setup/SetupFlow";
import { SetupProvider } from "./setup/SetupContext";
import { SkillPage } from "./skill/SkillPage";

export default function App(): JSX.Element {
  return (
    <BrowserRouter>
      <SetupProvider>
        <Routes>
          <Route path="/" element={<SetupFlow />} />
          <Route path="/session" element={<SessionPage />} />
          <Route path="/explain" element={<SessionPage />} />
          <Route path="/results/:id" element={<ResultsPage />} />
          <Route path="/skill/:id" element={<SkillPage />} />
          <Route path="/passport/:id" element={<SkillPage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route path="*" element={<SetupFlow />} />
        </Routes>
      </SetupProvider>
    </BrowserRouter>
  );
}
