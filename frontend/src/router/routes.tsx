import { createBrowserRouter, RouterProvider } from "react-router-dom";
import DefaultLayout from "../components/layout/DefaultLayout";
import MainDashboardPage from "../features/dashboard/MainDashboardPage";
import ResumeAnalysisPage from "../features/analysis/ResumeAnalysisPage";
import AnalysisResultPage from "../features/analysis/AnalysisResultPage";
import AnalysisHistoryPage from "../features/history/AnalysisHistoryPage";
import InterviewSetupPage from "../pages/interviews/InterviewSetupPage";
import InterviewSessionPage from "../pages/interviews/InterviewSessionPage";
import InterviewResultPage from "../pages/interviews/InterviewResultPage";
import LoginPage from "../pages/LoginPage";
import SignUpPage from "../pages/SignUpPage";
import SettingsPage from "../pages/SettingsPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <DefaultLayout>
        <MainDashboardPage />
      </DefaultLayout>
    ),
  },
  {
    path: "/analysis",
    element: (
      <DefaultLayout>
        <ResumeAnalysisPage />
      </DefaultLayout>
    ),
  },
  {
    path: "/analysis/result",
    element: (
      <DefaultLayout>
        <AnalysisResultPage />
      </DefaultLayout>
    ),
  },
  {
    path: "/history",
    element: (
      <DefaultLayout>
        <AnalysisHistoryPage />
      </DefaultLayout>
    ),
  },
  {
    path: "/interviews/setup",
    element: (
      <DefaultLayout>
        <InterviewSetupPage />
      </DefaultLayout>
    ),
  },
  {
    path: "/interviews/session/:sessionId",
    element: (
      <DefaultLayout>
        <InterviewSessionPage />
      </DefaultLayout>
    ),
  },
  {
    path: "/interviews/result/:sessionId",
    element: (
      <DefaultLayout>
        <InterviewResultPage />
      </DefaultLayout>
    ),
  },
  {
    path: "/settings",
    element: (
      <DefaultLayout>
        <SettingsPage />
      </DefaultLayout>
    ),
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignUpPage />,
  },
]);

const AppRouter = () => <RouterProvider router={router} />;

export default AppRouter;
