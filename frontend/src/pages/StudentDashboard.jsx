import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentExams } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import ThemeSwitcher from '../components/ThemeSwitcher';

export default function StudentDashboard() {
    const navigate = useNavigate();
    const { theme: t } = useTheme();
    const name = localStorage.getItem('name') || 'Student';
    const studentId = localStorage.getItem('studentId') || '';
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!studentId) return;
        getStudentExams(studentId)
            .then(res => setExams(res.data))
            .catch(() => setError('Failed to load exams.'))
            .finally(() => setLoading(false));
    }, [studentId]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const css = `
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .sd-root {
            min-height: 100vh;
            background: ${t.bg};
            color: ${t.text};
            font-family: 'DM Sans', sans-serif;
            transition: background 0.4s ease, color 0.4s ease;
        }

        /* NAV */
        .sd-nav {
            position: sticky; top: 0; z-index: 40;
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 40px;
            height: 64px;
            background: ${t.surface};
            border-bottom: 1px solid ${t.border};
            box-shadow: 0 1px 24px ${t.cardShadow};
            transition: background 0.4s ease, border-color 0.4s ease;
        }
        .sd-nav-logo {
            font-family: 'Syne', sans-serif;
            font-size: 20px; font-weight: 800; letter-spacing: -0.5px;
            color: ${t.text};
        }
        .sd-nav-logo span {
            background: ${t.gradient};
            -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .sd-nav-right { display: flex; align-items: center; gap: 14px; }
        .sd-avatar {
            display: flex; align-items: center; gap: 9px;
            padding: 6px 14px;
            background: ${t.surfaceAlt};
            border: 1px solid ${t.border};
            border-radius: 100px;
            font-size: 13.5px; font-weight: 500; color: ${t.textMuted};
            transition: background 0.4s ease;
        }
        .sd-avatar-dot {
            width: 8px; height: 8px; border-radius: 50%;
            background: ${t.accent};
            box-shadow: 0 0 6px ${t.accentGlow};
        }
        .sd-logout {
            padding: 7px 18px;
            background: transparent;
            border: 1px solid ${t.border};
            border-radius: 8px;
            color: ${t.textMuted};
            font-family: 'DM Sans', sans-serif;
            font-size: 13.5px; font-weight: 500; cursor: pointer;
            transition: all 0.2s ease;
        }
        .sd-logout:hover {
            border-color: ${t.errorBorder};
            color: ${t.errorText};
            background: ${t.errorBg};
        }

        /* BODY */
        .sd-body { max-width: 920px; margin: 0 auto; padding: 40px 24px; }

        /* HEADER */
        .sd-header { margin-bottom: 32px; }
        .sd-header h1 {
            font-family: 'Syne', sans-serif;
            font-size: 28px; font-weight: 800; letter-spacing: -0.5px;
            color: ${t.text}; transition: color 0.4s ease;
        }
        .sd-header p { margin-top: 6px; font-size: 14px; color: ${t.textMuted}; transition: color 0.4s ease; }

        /* STATS */
        .sd-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 36px; }
        .sd-stat {
            background: ${t.surface};
            border: 1px solid ${t.border};
            border-radius: 14px; padding: 22px 24px;
            transition: all 0.25s ease;
        }
        .sd-stat:hover {
            border-color: ${t.accent};
            box-shadow: 0 4px 24px ${t.accentGlow};
            transform: translateY(-2px);
        }
        .sd-stat-value {
            font-family: 'Syne', sans-serif;
            font-size: 32px; font-weight: 800;
            background: ${t.gradient};
            -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
            line-height: 1.1;
        }
        .sd-stat-label {
            font-size: 12px; color: ${t.textSub}; font-weight: 500;
            letter-spacing: 0.5px; text-transform: uppercase; margin-top: 6px;
            transition: color 0.4s ease;
        }

        /* SECTION TITLE */
        .sd-section-title {
            font-family: 'Syne', sans-serif;
            font-size: 15px; font-weight: 700;
            color: ${t.textMuted}; letter-spacing: 0.5px;
            text-transform: uppercase; margin-bottom: 16px;
            transition: color 0.4s ease;
        }

        /* EXAM CARDS */
        .sd-exam-list { display: flex; flex-direction: column; gap: 14px; }
        .sd-exam-card {
            background: ${t.surface};
            border: 1px solid ${t.border};
            border-radius: 14px; padding: 22px 24px;
            display: flex; align-items: center; justify-content: space-between; gap: 20px;
            transition: all 0.25s ease;
        }
        .sd-exam-card:hover {
            border-color: ${t.accent};
            box-shadow: 0 4px 32px ${t.accentGlow};
            transform: translateY(-2px);
        }
        .sd-exam-card.submitted {
            opacity: 0.6;
            border-style: dashed;
        }
        .sd-exam-title {
            font-family: 'Syne', sans-serif;
            font-size: 16px; font-weight: 700;
            color: ${t.text}; margin-bottom: 10px; transition: color 0.4s ease;
        }
        .sd-exam-meta { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }
        .sd-meta-chip {
            display: inline-flex; align-items: center; gap: 5px;
            padding: 3px 10px;
            background: ${t.surfaceAlt};
            border: 1px solid ${t.border};
            border-radius: 100px;
            font-size: 12px; color: ${t.textMuted};
            transition: background 0.4s ease;
        }
        .sd-badge-done {
            display: inline-flex; align-items: center; gap: 5px;
            padding: 3px 10px;
            background: ${t.tabActiveBg};
            border: 1px solid ${t.accent}44;
            border-radius: 100px;
            font-size: 12px; color: ${t.accent}; font-weight: 600;
        }
        .sd-start-btn {
            padding: 10px 22px;
            background: ${t.gradient};
            border: none; border-radius: 9px; color: #fff;
            font-family: 'DM Sans', sans-serif;
            font-size: 14px; font-weight: 600; cursor: pointer;
            box-shadow: 0 4px 16px ${t.accentGlow};
            white-space: nowrap;
            transition: all 0.2s ease;
            flex-shrink: 0;
        }
        .sd-start-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 22px ${t.accentGlow};
            filter: brightness(1.08);
        }
        .sd-done-btn {
            padding: 10px 22px;
            background: transparent;
            border: 1px solid ${t.border};
            border-radius: 9px; color: ${t.textSub};
            font-family: 'DM Sans', sans-serif;
            font-size: 14px; font-weight: 500; cursor: default;
            white-space: nowrap; flex-shrink: 0;
        }

        /* EMPTY STATE */
        .sd-empty {
            background: ${t.surface}; border: 1px dashed ${t.border};
            border-radius: 16px; padding: 56px 24px;
            text-align: center;
            transition: background 0.4s ease, border-color 0.4s ease;
        }
        .sd-empty-icon { font-size: 40px; margin-bottom: 14px; }
        .sd-empty p { font-size: 14px; color: ${t.textMuted}; transition: color 0.4s ease; }

        /* ERROR */
        .sd-error {
            display: flex; align-items: center; gap: 10px;
            background: ${t.errorBg}; border: 1px solid ${t.errorBorder}55;
            border-radius: 10px; padding: 12px 16px; margin-bottom: 20px;
            color: ${t.errorText}; font-size: 13.5px;
        }

        /* LOADING */
        .sd-loading { display: flex; align-items: center; gap: 10px; color: ${t.textMuted}; font-size: 14px; padding: 20px 0; }
        .sd-spinner {
            width: 18px; height: 18px;
            border: 2px solid ${t.border}; border-top-color: ${t.accent};
            border-radius: 50%; animation: sdspin 0.7s linear infinite;
        }
        @keyframes sdspin { to { transform: rotate(360deg); } }

        @media (max-width: 640px) {
            .sd-nav { padding: 0 16px; }
            .sd-body { padding: 24px 16px; }
            .sd-stats { grid-template-columns: 1fr 1fr; }
            .sd-exam-card { flex-direction: column; align-items: flex-start; }
            .sd-start-btn, .sd-done-btn { width: 100%; text-align: center; }
        }
    `;

    const totalExams = exams.length;
    const completed = exams.filter(e => e.submitted).length;
    const pending = exams.filter(e => !e.submitted).length;

    return (
        <>
            <style>{css}</style>
            <ThemeSwitcher />
            <div className="sd-root">

                {/* Nav */}
                <nav className="sd-nav">
                    <div className="sd-nav-logo"><span>Adapt</span>Exam</div>
                    <div className="sd-nav-right">
                        <div className="sd-avatar">
                            <span className="sd-avatar-dot" />
                            {name}
                        </div>
                        <button className="sd-logout" onClick={handleLogout}>Logout</button>
                    </div>
                </nav>

                <div className="sd-body">

                    {/* Header */}
                    <div className="sd-header">
                        <h1>My Dashboard</h1>
                        <p>View and start your assigned exams</p>
                    </div>

                    {/* Stats */}
                    <div className="sd-stats">
                        <div className="sd-stat">
                            <div className="sd-stat-value">{totalExams}</div>
                            <div className="sd-stat-label">Assigned Exams</div>
                        </div>
                        <div className="sd-stat">
                            <div className="sd-stat-value">{completed}</div>
                            <div className="sd-stat-label">Completed</div>
                        </div>
                        <div className="sd-stat">
                            <div className="sd-stat-value">{pending}</div>
                            <div className="sd-stat-label">Pending</div>
                        </div>
                    </div>

                    {/* Exam List */}
                    <div className="sd-section-title">Your Exams</div>

                    {loading && (
                        <div className="sd-loading">
                            <span className="sd-spinner" /> Loading exams…
                        </div>
                    )}

                    {error && (
                        <div className="sd-error">⚠ {error}</div>
                    )}

                    {!loading && exams.length === 0 && !error && (
                        <div className="sd-empty">
                            <div className="sd-empty-icon">📋</div>
                            <p>No exams assigned yet. Check back later.</p>
                        </div>
                    )}

                    <div className="sd-exam-list">
                        {exams.map(exam => (
                            <div key={exam._id} className={`sd-exam-card ${exam.submitted ? 'submitted' : ''}`}>
                                <div style={{ flex: 1 }}>
                                    <div className="sd-exam-title">{exam.title}</div>
                                    <div className="sd-exam-meta">
                                        <span className="sd-meta-chip">⏱ {exam.duration} min</span>
                                        <span className="sd-meta-chip">📝 {exam.total_questions} questions</span>
                                        <span className="sd-meta-chip">
                                            🎯 E:{exam.difficulty_distribution?.easy || 0} M:{exam.difficulty_distribution?.medium || 0} H:{exam.difficulty_distribution?.hard || 0}
                                        </span>
                                        {exam.submitted && <span className="sd-badge-done">✓ Completed</span>}
                                    </div>
                                </div>
                                {exam.submitted ? (
                                    <button className="sd-done-btn" disabled>Submitted ✓</button>
                                ) : (
                                    <button className="sd-start-btn" onClick={() => navigate(`/exam/${exam._id}`)}>
                                        Start Exam →
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </>
    );
}