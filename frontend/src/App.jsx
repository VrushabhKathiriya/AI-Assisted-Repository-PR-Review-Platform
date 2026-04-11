import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import useAuthStore from "./store/auth.store.js";

import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import VerifyOtpPage from "./pages/auth/VerifyOtpPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage.jsx";
import DashboardPage from "./pages/dashboard/DashboardPage.jsx";
import RepositoryListPage from "./pages/repository/RepositoryListPage.jsx";
import RepositoryDetailPage from "./pages/repository/RepositoryDetailPage.jsx";
import RepositorySettingsPage from "./pages/repository/RepositorySettingsPage.jsx";
import FileDetailPage from "./pages/file/FileDetailPage.jsx";
import PRListPage from "./pages/pullRequest/PRListPage.jsx";
import PRDetailPage from "./pages/pullRequest/PRDetailPage.jsx";
import CreatePRPage from "./pages/pullRequest/CreatePRPage.jsx";
import ContributorPage from "./pages/contributor/ContributorPage.jsx";
import AcceptInvitationPage from "./pages/invitation/AcceptInvitationPage.jsx";
import DeclineInvitationPage from "./pages/invitation/DeclineInvitationPage.jsx";
import NotificationPage from "./pages/notification/NotificationPage.jsx";
import StatsPage from "./pages/stats/StatsPage.jsx";
import SearchPage from "./pages/search/SearchPage.jsx";
import ActivityPage from "./pages/activity/ActivityPage.jsx";
import ProfilePage from "./pages/profile/ProfilePage.jsx";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: "#161b22",
          color: "#e6edf3",
          border: "1px solid #30363d"
        }
      }} />
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/verify-otp" element={<PublicRoute><VerifyOtpPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password/:token" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

        <Route path="/invitation/accept/:token" element={<ProtectedRoute><AcceptInvitationPage /></ProtectedRoute>} />
        <Route path="/invitation/decline/:token" element={<ProtectedRoute><DeclineInvitationPage /></ProtectedRoute>} />

        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/repos" element={<ProtectedRoute><RepositoryListPage /></ProtectedRoute>} />
        <Route path="/repos/:repoId" element={<ProtectedRoute><RepositoryDetailPage /></ProtectedRoute>} />
        <Route path="/repos/:repoId/settings" element={<ProtectedRoute><RepositorySettingsPage /></ProtectedRoute>} />
        <Route path="/repos/:repoId/files/:fileId" element={<ProtectedRoute><FileDetailPage /></ProtectedRoute>} />
        <Route path="/repos/:repoId/prs" element={<ProtectedRoute><PRListPage /></ProtectedRoute>} />
        <Route path="/repos/:repoId/prs/:prId" element={<ProtectedRoute><PRDetailPage /></ProtectedRoute>} />
        <Route path="/repos/:repoId/files/:fileId/create-pr" element={<ProtectedRoute><CreatePRPage /></ProtectedRoute>} />
        <Route path="/repos/:repoId/contributors" element={<ProtectedRoute><ContributorPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationPage /></ProtectedRoute>} />
        <Route path="/stats/:repoId" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
        <Route path="/activity" element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;