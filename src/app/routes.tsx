import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { Dashboard } from "./pages/Dashboard";
import { WorkspaceList } from "./pages/WorkspaceList";
import { WorkspaceDetail } from "./pages/WorkspaceDetail";
import { SourceIngestion } from "./pages/SourceIngestion";
import { ConversionWizard } from "./pages/ConversionWizard";
import { ConversionResult } from "./pages/ConversionResult";
import { MCPOptimization } from "./pages/MCPOptimization";
import { TestGeneration } from "./pages/TestGeneration";
import { Lineage } from "./pages/Lineage";
import { CICD } from "./pages/CICD";
import { Monitoring } from "./pages/Monitoring";
import { DemoMode } from "./pages/DemoMode";
import { Admin } from "./pages/Admin";
import { InitialSetup } from "./pages/InitialSetup";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/setup",
    element: <InitialSetup />,
  },
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "workspaces", element: <WorkspaceList /> },
      { path: "workspace/:id", element: <WorkspaceDetail /> },
      { path: "workspace/:id/ingest", element: <SourceIngestion /> },
      { path: "workspace/:id/convert", element: <ConversionWizard /> },
      { path: "workspace/:id/conversion/:conversionId", element: <ConversionResult /> },
      { path: "workspace/:id/optimize", element: <MCPOptimization /> },
      { path: "workspace/:id/tests", element: <TestGeneration /> },
      { path: "workspace/:id/lineage", element: <Lineage /> },
      { path: "cicd", element: <CICD /> },
      { path: "monitoring", element: <Monitoring /> },
      { path: "demo", element: <DemoMode /> },
      { path: "admin", element: <Admin /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);