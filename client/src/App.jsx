// client/src/App.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    Outlet,
} from 'react-router-dom';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import IncomingCallBanner from './components/common/IncomingCallBanner';
import useAuth from './hooks/useAuth';

// ── Page imports ───────────────────────────────────────────────────────────────
import HomePage             from './pages/HomePage';
import LoginPage            from './pages/Auth/LoginPage';
import RegisterPage         from './pages/Auth/RegisterPage';
import CalendarPage         from './pages/Scheduling/CalendarPage';
import ConfirmSessionPage   from './pages/Scheduling/ConfirmSessionPage';
import UpcomingSessionsPage from './pages/Scheduling/UpcomingSessionsPage';
import SessionHistoryPage   from './pages/Scheduling/SessionHistoryPage';
import DashboardPage        from './pages/DashboardPage';
import ProfilePage          from './pages/ProfilePage';
import ListingPage          from './pages/ListingPage';
import MatchingPage         from './pages/MatchingPage';
import ChatPage             from './pages/ChatPage';
import VideoCallPage        from './pages/VideoCallPage';
import SettingsPage         from './pages/SettingsPage';
import AIChatbotPage        from './pages/AIChatbotPage';
import GiveFeedbackPage     from './pages/Feedback/GiveFeedbackPage';
import WalletPage           from './pages/Credits/WalletPage';
import BuyCreditsPage       from './pages/Credits/BuyCreditsPage';
import ContributionCenterPage from './pages/Credits/ContributionCenterPage';
import CreditHistoryPage    from './pages/Credits/CreditHistoryPage';
import RewardsPage          from './pages/RewardsPage';

// ── Root redirect ──────────────────────────────────────────────────────────────
// • Guest            → show the public HomePage
// • Logged-in user   → send straight to /dashboard
// • Still loading    → blank loading screen (avoids flash)
const RootRedirect = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-xl text-indigo-600">
                Loading…
            </div>
        );
    }

    // Authenticated → skip the landing page, go straight to the app
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;

    // Guest → show the landing page
    return <HomePage />;
};

// ── Protected route ────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-xl text-indigo-600">
                Loading…
            </div>
        );
    }

    // Not logged in → send to home (not login) so they see the landing page first
    if (!isAuthenticated) return <Navigate to="/" replace />;

    return children ? children : <Outlet />;
};

// ── Authenticated-only redirect for /login and /register ──────────────────────
// Prevents logged-in users from seeing auth pages
const GuestRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return null;
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return children;
};

// ── Main layout (sidebar + header) ────────────────────────────────────────────
const MainLayout = () => (
    <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-1 max-w-7xl mx-auto w-full">
            <aside className="w-64 hidden md:block bg-white border-r">
                <Sidebar />
            </aside>
            <main className="flex-1 p-6 lg:p-10">
                <Outlet />
            </main>
        </div>
    </div>
);

// ── App ────────────────────────────────────────────────────────────────────────
const App = () => (
    <Router>
        <IncomingCallBanner />
        <Routes>
            {/* ── Public root ─────────────────────────────────────────────────
                Guests see HomePage. Logged-in users are sent to /dashboard.   */}
            <Route path="/" element={<RootRedirect />} />

            {/* ── Auth pages (guests only) ────────────────────────────────── */}
            <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

            {/* ── Protected pages ─────────────────────────────────────────── */}
            <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                    <Route path="/dashboard"          element={<DashboardPage />} />
                    <Route path="/profile"            element={<ProfilePage />} />
                    <Route path="/profile/:userId"    element={<ProfilePage />} />
                    <Route path="/listing"            element={<ListingPage />} />
                    <Route path="/matching"           element={<MatchingPage />} />
                    <Route path="/chat"               element={<ChatPage />} />
                    <Route path="/settings"           element={<SettingsPage />} />
                    <Route path="/ai-chat"            element={<AIChatbotPage />} />
                    <Route path="/schedule"           element={<CalendarPage />} />
                    <Route path="/schedule/confirm"   element={<ConfirmSessionPage />} />
                    <Route path="/schedule/upcoming"  element={<UpcomingSessionsPage />} />
                    <Route path="/schedule/history"   element={<SessionHistoryPage />} />
                    <Route path="/credits"            element={<Navigate to="/credits/wallet" replace />} />
                    <Route path="/credits/wallet"     element={<WalletPage />} />
                    <Route path="/credits/buy"        element={<BuyCreditsPage />} />
                    <Route path="/credits/contribute" element={<ContributionCenterPage />} />
                    <Route path="/credits/history"    element={<CreditHistoryPage />} />
                    <Route path="/rewards"            element={<RewardsPage />} />
                </Route>

                {/* Full-screen (no sidebar) */}
                <Route path="/video/:roomId"       element={<VideoCallPage />} />
                <Route path="/feedback/:sessionId" element={<GiveFeedbackPage />} />
            </Route>

            {/* ── 404 ─────────────────────────────────────────────────────── */}
            <Route path="*" element={
                <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
                    <h1 className="text-6xl font-extrabold text-indigo-600">404</h1>
                    <p className="text-xl text-gray-700 mt-4">Page Not Found</p>
                    <Link to="/" className="mt-6 text-indigo-500 hover:text-indigo-700">
                        Go Home
                    </Link>
                </div>
            } />
        </Routes>
    </Router>
);

export default App;