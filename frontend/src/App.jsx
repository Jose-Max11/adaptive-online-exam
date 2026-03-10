import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Home from './pages/Home';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import ExamPage from './pages/ExamPage';
import AdminDashboard from './pages/AdminDashboard';
import ExamConfig from './pages/ExamConfig';

// ─────────────────────────────────────────────
// Blocks access to login page if already logged in
// If logged in → redirect straight to their dashboard
// ─────────────────────────────────────────────
const PublicRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (token && role) {
        return <Navigate to={role === 'admin' ? '/admin' : '/student'} replace />;
    }

    return children;
};

// ─────────────────────────────────────────────
// Blocks access to protected pages if not logged in
// OR if logged in with the wrong role
// ─────────────────────────────────────────────
const PrivateRoute = ({ children, role }) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    // Not logged in → go to login
    if (!token) return <Navigate to="/login" replace />;

    // Wrong role → redirect to their own dashboard
    if (role && userRole !== role) {
        return <Navigate to={userRole === 'admin' ? '/admin' : '/student'} replace />;
    }

    return children;
};

export default function App() {
    return (
        <ThemeProvider>
        <BrowserRouter>
            <Routes>
                {/* ── Public home page (no auth needed) ── */}
                <Route path="/" element={<Home />} />

                {/* ── Login page (blocked if already logged in) ── */}
                <Route path="/login" element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                } />

                {/* ── Student routes (student role only) ── */}
                <Route path="/student" element={
                    <PrivateRoute role="student">
                        <StudentDashboard />
                    </PrivateRoute>
                } />
                <Route path="/exam/:examId" element={
                    <PrivateRoute role="student">
                        <ExamPage />
                    </PrivateRoute>
                } />

                {/* ── Admin routes (admin role only) ── */}
                <Route path="/admin" element={
                    <PrivateRoute role="admin">
                        <AdminDashboard />
                    </PrivateRoute>
                } />
                <Route path="/admin/exam/:examId" element={
                    <PrivateRoute role="admin">
                        <ExamConfig />
                    </PrivateRoute>
                } />

                {/* ── Fallback: unknown routes → home ── */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
        </ThemeProvider>
    );
}