// client/src/pages/HomePage.jsx
// Public landing page — shown to guests at /
// Logged-in users are redirected to /dashboard before this ever renders.
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaExchangeAlt, FaComments, FaVideo, FaRobot,
    FaTrophy, FaCalendarCheck, FaArrowRight, FaCheckCircle,
} from 'react-icons/fa';

// ── Sub-components ─────────────────────────────────────────────────────────────

const FeatureCard = ({ icon: Icon, title, desc, color }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
            <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
);

const Step = ({ num, title, desc }) => (
    <div className="flex gap-4 items-start">
        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-extrabold shrink-0 shadow-md">
            {num}
        </div>
        <div>
            <h4 className="font-bold text-gray-900 text-sm sm:text-base">{title}</h4>
            <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
        </div>
    </div>
);

// ── HomePage ───────────────────────────────────────────────────────────────────
const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col bg-[#f8f7ff]">

            {/* ══════════════════════════════════════════════════════
                HEADER
            ══════════════════════════════════════════════════════ */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 sm:h-16">
                    {/* Logo */}
                    <Link to="/" className="text-xl sm:text-2xl font-extrabold text-indigo-600 tracking-tight">
                        SkillSwap 💡
                    </Link>

                    {/* Nav */}
                    <nav className="flex items-center gap-2 sm:gap-4">
                        <Link
                            to="/login"
                            className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition px-2 py-1"
                        >
                            Log In
                        </Link>
                        <Link
                            to="/register"
                            className="text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition shadow-sm active:scale-95"
                        >
                            Get Started Free
                        </Link>
                    </nav>
                </div>
            </header>

            {/* ══════════════════════════════════════════════════════
                HERO
            ══════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-indigo-200/40 blur-3xl" />
                    <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] rounded-full bg-purple-200/40 blur-3xl" />
                </div>

                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
                    {/* Eyebrow badge */}
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-100 px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
                        <FaExchangeAlt className="w-3 h-3" />
                        Free Peer-to-Peer Skill Exchange
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
                        Trade skills,{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            not money
                        </span>
                    </h1>

                    {/* Sub-headline */}
                    <p className="mt-5 text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        SkillSwap matches you with people who have what you want to learn —
                        and want to learn what you know. Teach, learn, and grow completely free
                        through two-way barter sessions.
                    </p>

                    {/* CTAs */}
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            to="/register"
                            className="flex items-center gap-2 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-7 py-3.5 rounded-2xl shadow-lg hover:shadow-indigo-200 transition-all active:scale-95 w-full sm:w-auto justify-center"
                        >
                            Start for Free <FaArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                            to="/login"
                            className="flex items-center gap-2 text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 px-7 py-3.5 rounded-2xl shadow-sm transition-all active:scale-95 w-full sm:w-auto justify-center"
                        >
                            I already have an account
                        </Link>
                    </div>

                    {/* Trust chips */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500">
                        {['No credit card needed', '100% free barter sessions', 'AI-powered matching'].map(t => (
                            <span key={t} className="flex items-center gap-1.5 bg-white border border-gray-100 px-3 py-1.5 rounded-full shadow-sm">
                                <FaCheckCircle className="text-green-500 w-3 h-3 shrink-0" /> {t}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════
                FEATURES
            ══════════════════════════════════════════════════════ */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                <div className="text-center mb-12">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900">
                        Everything you need to exchange skills
                    </h2>
                    <p className="mt-3 text-gray-500 sm:text-lg max-w-xl mx-auto">
                        Built for real learners — no course fees, no subscriptions, no catch.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <FeatureCard icon={FaExchangeAlt} title="Smart Matching"
                        desc="Our algorithm finds your ideal complement — someone who teaches what you want and wants to learn what you teach."
                        color="bg-indigo-100 text-indigo-600" />
                    <FeatureCard icon={FaComments} title="Built-in Chat"
                        desc="Discuss details, share resources, and schedule sessions — all inside the platform before you even meet."
                        color="bg-blue-100 text-blue-600" />
                    <FeatureCard icon={FaVideo} title="Live Video Sessions"
                        desc="HD video calls with screen sharing built right in. No third-party tools needed."
                        color="bg-green-100 text-green-600" />
                    <FeatureCard icon={FaRobot} title="AI Learning Assistant"
                        desc="Personalised study tips, resource recommendations, and on-demand help between sessions."
                        color="bg-purple-100 text-purple-600" />
                    <FeatureCard icon={FaTrophy} title="Reputation & Rewards"
                        desc="Build your trust score through peer reviews. Top contributors earn badges and climb leaderboards."
                        color="bg-yellow-100 text-yellow-600" />
                    <FeatureCard icon={FaCalendarCheck} title="Session Scheduling"
                        desc="Propose times, confirm sessions, track history, and get notified — a full session lifecycle in one place."
                        color="bg-pink-100 text-pink-600" />
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════
                HOW IT WORKS
            ══════════════════════════════════════════════════════ */}
            <section className="bg-white border-y border-gray-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900">
                            How SkillSwap works
                        </h2>
                        <p className="mt-3 text-gray-500 sm:text-lg">
                            From sign-up to your first session in four simple steps.
                        </p>
                    </div>

                    <div className="space-y-8 max-w-2xl mx-auto">
                        <Step num="1" title="Create your listing"
                            desc="Tell us what you can teach (e.g. Spanish, Python, Guitar) and what you want to learn. Set your proficiency level and priority order." />
                        <Step num="2" title="Get matched automatically"
                            desc="Our engine finds people whose teach list matches your learn list — and vice versa — for a perfect two-way barter." />
                        <Step num="3" title="Connect, chat & schedule"
                            desc="Send a connection request, chat inside the app, and lock in a session time that works for both of you." />
                        <Step num="4" title="Learn live, leave a review"
                            desc="Join the video call, share your screen, and afterwards leave a peer review to build each other's trust score." />
                    </div>

                    <div className="mt-12 text-center">
                        <Link
                            to="/register"
                            className="inline-flex items-center gap-2 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-8 py-4 rounded-2xl shadow-lg hover:shadow-indigo-200 transition-all active:scale-95"
                        >
                            Create a free account <FaArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════
                FOOTER
            ══════════════════════════════════════════════════════ */}
            <footer className="mt-auto bg-gray-900 text-gray-400">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-8">

                        {/* Brand */}
                        <div className="max-w-xs">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xl font-extrabold text-white">SkillSwap</span>
                                <span className="text-xl">💡</span>
                            </div>
                            <p className="text-sm leading-relaxed">
                                A peer-to-peer skill exchange platform built to make learning free,
                                social, and rewarding for everyone.
                            </p>
                        </div>

                        {/* Links */}
                        <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                            <div className="space-y-2">
                                <p className="text-white font-semibold mb-1">Platform</p>
                                <Link to="/register" className="block hover:text-white transition">Sign Up</Link>
                                <Link to="/login"    className="block hover:text-white transition">Log In</Link>
                            </div>
                            <div className="space-y-2">
                                <p className="text-white font-semibold mb-1">Learn</p>
                                <span className="block">How It Works</span>
                                <span className="block">Skill Credits</span>
                                <span className="block">Video Sessions</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row sm:justify-between items-center gap-2 text-xs text-gray-600">
                        <span>&copy; {new Date().getFullYear()} SkillSwap. All rights reserved.</span>
                        <span>Made for learners, by learners 🤝</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;