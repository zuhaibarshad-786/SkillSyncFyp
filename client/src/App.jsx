// client/src/App.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import useAuth from './hooks/useAuth';

// --- Page Imports ---
// Auth Pages
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
// Scheduling Pages
import CalendarPage from './pages/Scheduling/CalendarPage';
import ConfirmSessionPage from './pages/Scheduling/ConfirmSessionPage';
import UpcomingSessionsPage from './pages/Scheduling/UpcomingSessionsPage';
import SessionHistoryPage from './pages/Scheduling/SessionHistoryPage';
// Application Pages
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ListingPage from './pages/ListingPage';
import MatchingPage from './pages/MatchingPage';
import ChatPage from './pages/ChatPage';
import VideoCallPage from './pages/VideoCallPage';
import SettingsPage from './pages/SettingsPage';
import AIChatbotPage from './pages/AIChatbotPage';

// --- Page Imports (Feedback) ---
import GiveFeedbackPage from './pages/Feedback/GiveFeedbackPage';

// Credits Pages 🆕
import WalletPage from './pages/Credits/WalletPage';
import BuyCreditsPage from './pages/Credits/BuyCreditsPage';
import ContributionCenterPage from './pages/Credits/ContributionCenterPage';
import CreditHistoryPage from './pages/Credits/CreditHistoryPage';

import RewardsPage from './pages/RewardsPage';



// --- 1. Protected Route Wrapper Component ---

/**
 * Ensures the user is authenticated before rendering the child route.
 * Redirects to the login page if not authenticated.
 */
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        // Simple loading screen while checking auth status
        return <div className="min-h-screen flex items-center justify-center text-xl text-indigo-600">Loading...</div>;
    }

    if (!isAuthenticated) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" replace />;
    }

    // Render the children (or Outlet for nested routes) if authenticated
    return children ? children : <Outlet />;
};


// --- 2. Main Layout Component ---

/**
 * Standard layout for all authenticated pages: Header + Sidebar + Content.
 */
const MainLayout = () => (
    <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-1 max-w-7xl mx-auto w-full">
            {/* Sidebar (Fixed width on desktop) */}
            <aside className="w-64 hidden md:block bg-white border-r">
                <Sidebar />
            </aside>
            
            {/* Main Content Area */}
            <main className="flex-1 p-6 lg:p-10">
                <Outlet /> {/* Renders the current nested route page */}
            </main>
        </div>
    </div>
);


// --- 3. Main App Component ---

const App = () => {
    return (
        <Router>
            <Routes>
                {/* --- Public Routes --- */}
                
                {/* Default root path redirects to Dashboard if logged in, otherwise Login */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* --- Protected Routes (Uses the ProtectedRoute wrapper) --- */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<MainLayout />}>
                        {/* Nested Routes inside MainLayout */}
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/listing" element={<ListingPage />} />
                        <Route path="/matching" element={<MatchingPage />} />
                        <Route path="/chat" element={<ChatPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/ai-chat" element={<AIChatbotPage />} />
                        {/* Scheduling Route */}
                        <Route path="/schedule" element={<CalendarPage />} />
                        <Route path="/schedule/confirm" element={<ConfirmSessionPage />} />
                        <Route path="/schedule/upcoming" element={<UpcomingSessionsPage />} />
                        <Route path="/schedule/history" element={<SessionHistoryPage />} />

                        {/* 🆕 Credits & Monetization Routes (Parent: /credits/wallet) */}
                        <Route path="/credits" element={<Navigate to="/credits/wallet" replace />} />
                        <Route path="/credits/wallet" element={<WalletPage />} />
                        <Route path="/credits/buy" element={<BuyCreditsPage />} />
                        <Route path="/credits/contribute" element={<ContributionCenterPage />} />
                        <Route path="/credits/history" element={<CreditHistoryPage />} />

                        <Route path="rewards" element={<RewardsPage/>}/>
                     


                        {/* Video Call Page - Might be fullscreen outside the standard layout */}
                        {/* <Route path="/video/:roomId" element={<VideoCallPage />} /> */}
                    </Route>

                    {/* Example of a full-screen, protected route without the sidebar/header */}
                    <Route path="/video/:roomId" element={<VideoCallPage />} />
                    <Route path="/feedback/:sessionId" element={<GiveFeedbackPage />} />
                </Route>

                {/* --- Fallback Route (404 Not Found) --- */}
                <Route path="*" element={
                    <div className="min-h-screen flex flex-col items-center justify-center">
                        <h1 className="text-6xl font-extrabold text-indigo-600">404</h1>
                        <p className="text-xl text-gray-700 mt-4">Page Not Found</p>
                        <Link to="/" className="mt-6 text-indigo-500 hover:text-indigo-700">Go Home</Link>
                    </div>
                } />

            </Routes>
        </Router>
    );
};

export default App;