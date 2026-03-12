import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getStudentExams,
    getStudentResults,      // GET /api/results/student/:studentId
    getStudentBehaviorLogs, // GET /api/behavior/student/:studentId
    getStudentProfile,      // GET /api/students/:studentId
} from '../services/api';
import { useTheme } from '../context/ThemeContext';
import ThemeSwitcher from '../components/ThemeSwitcher';

const SECTIONS = ['Overview', 'My Exams', 'My Results', 'Behavior', 'Profile'];
const SECTION_ICONS = {
    Overview:    '🏠',
    'My Exams':  '📋',
    'My Results':'📊',
    Behavior:    '🧠',
    Profile:     '👤',
};

export default function StudentDashboard() {
    const navigate     = useNavigate();
    const { theme: t } = useTheme();

    const studentId    = localStorage.getItem('studentId') || localStorage.getItem('userId') || '';
    const studentName  = localStorage.getItem('name')  || 'Student';
    const studentEmail = localStorage.getItem('email') || '';

    const [section, setSection] = useState('Overview');
    const [exams,   setExams]   = useState([]);
    const [results, setResults] = useState([]);
    const [logs,    setLogs]    = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState('');

    // ─── Check if exam already submitted (results + localStorage fallback) ───
    const isExamDone = (exam) => {
        if (results.some(r =>
            r.exam_id?._id === exam._id || r.exam_id === exam._id
        )) return true;
        if (exam.submitted === true) return true;
        if (localStorage.getItem(`exam_submitted_${studentId}_${exam._id}`) === 'true') return true;
        return false;
    };

    useEffect(() => {
        if (!studentId) { setLoading(false); setError('Student ID not found. Please log in again.'); return; }
        loadAll();
    }, [studentId]);

    const loadAll = async () => {
        setLoading(true);
        setError('');
        try {
            // All four calls are student-scoped — no admin access needed
            const [examRes, resultRes, logRes, profileRes] = await Promise.allSettled([
                getStudentExams(studentId),
                getStudentResults(studentId),
                getStudentBehaviorLogs(studentId),
                getStudentProfile(studentId),
            ]);

            // Exams — required, so surface the error
            if (examRes.status === 'fulfilled') {
                setExams(examRes.value.data || []);
            } else {
                setError('Failed to load your exams. Please try again.');
            }

            // Results — non-critical, default to []
            if (resultRes.status === 'fulfilled') {
                setResults(resultRes.value.data || []);
            }

            // Behavior logs — non-critical, default to []
            if (logRes.status === 'fulfilled') {
                setLogs(logRes.value.data || []);
            }

            // Profile — non-critical, fallback to localStorage values
            if (profileRes.status === 'fulfilled') {
                setProfile(profileRes.value.data || null);
            }

        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => { localStorage.clear(); navigate('/'); };

    const handleStartExam = (exam) => {
        if (isExamDone(exam)) {
            alert('You have already submitted this exam. Each exam can only be taken once.');
            return;
        }
        navigate(`/exam/${exam._id}`);
    };

    // ─── Derived stats ───
    const completedExams = exams.filter(ex => isExamDone(ex));
    const pendingExams   = exams.filter(ex => !isExamDone(ex));

    const totalScore = results.reduce((a, r) => a + (r.score      || 0), 0);
    const totalMarks = results.reduce((a, r) => a + (r.total_marks || 0), 0);
    const avgPct     = totalMarks ? ((totalScore / totalMarks) * 100).toFixed(1) : '—';

    const getRisk = (l) => { const r = l.riskScore ?? l.risk_score ?? 0; return r > 1 ? r / 100 : r; };
    const avgRisk = logs.length
        ? (logs.reduce((a, l) => a + getRisk(l), 0) / logs.length * 100).toFixed(0)
        : 0;

    // ─── Sub-components ───
    const riskBadge = (rawScore) => {
        const pct = (rawScore ?? 0) <= 1 ? (rawScore ?? 0) * 100 : (rawScore ?? 0);
        if (pct >= 60) return <span className="sd-badge sd-badge-high">{pct.toFixed(0)}%</span>;
        if (pct >= 30) return <span className="sd-badge sd-badge-med">{pct.toFixed(0)}%</span>;
        return <span className="sd-badge sd-badge-low">{pct.toFixed(0)}%</span>;
    };

    const ScoreBar = ({ score, total }) => {
        const pct   = total ? Math.round((score / total) * 100) : 0;
        const color = pct >= 70 ? '#059669' : pct >= 40 ? '#ca8a04' : '#ef4444';
        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <strong>{score}/{total}</strong>
                <span className="sd-bar-wrap">
                    <span className="sd-bar-fill" style={{ width: `${pct}%`, background: color }} />
                </span>
                <span style={{ fontSize: 12, color: t.textMuted }}>{pct}%</span>
            </span>
        );
    };

    const ProfileRow = ({ label, value }) => (
        <div className="sd-profile-row">
            <span className="sd-profile-label">{label}</span>
            <span className="sd-profile-value">{value || '—'}</span>
        </div>
    );

    const css = `
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .sd-root { display: flex; min-height: 100vh; background: ${t.bg}; color: ${t.text}; font-family: 'DM Sans', sans-serif; transition: background 0.4s ease, color 0.4s ease; }
        .sd-sidebar { width: 220px; flex-shrink: 0; background: ${t.surface}; border-right: 1px solid ${t.border}; display: flex; flex-direction: column; padding: 24px 12px; position: sticky; top: 0; height: 100vh; }
        .sd-logo { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: ${t.text}; padding: 0 12px; margin-bottom: 28px; }
        .sd-logo span { background: ${t.gradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .sd-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 9px; border: none; background: transparent; color: ${t.textMuted}; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.18s ease; text-align: left; width: 100%; margin-bottom: 2px; }
        .sd-nav-item:hover  { background: ${t.surfaceAlt}; color: ${t.text}; }
        .sd-nav-item.active { background: ${t.tabActiveBg}; color: ${t.accent}; font-weight: 600; }
        .sd-nav-spacer { flex: 1; }
        .sd-logout { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 9px; border: none; background: transparent; color: ${t.textMuted}; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.18s ease; width: 100%; }
        .sd-logout:hover { background: ${t.errorBg}; color: ${t.errorText}; }
        .sd-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .sd-topbar { display: flex; align-items: center; justify-content: space-between; padding: 0 32px; height: 60px; background: ${t.surface}; border-bottom: 1px solid ${t.border}; position: sticky; top: 0; z-index: 30; }
        .sd-topbar-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: ${t.text}; }
        .sd-topbar-user { display: flex; align-items: center; gap: 8px; padding: 5px 14px; background: ${t.surfaceAlt}; border: 1px solid ${t.border}; border-radius: 100px; font-size: 13px; color: ${t.textMuted}; }
        .sd-user-dot { width: 7px; height: 7px; border-radius: 50%; background: ${t.accent}; box-shadow: 0 0 6px ${t.accentGlow}; }
        .sd-content { padding: 32px; flex: 1; }
        .sd-flash { display: flex; align-items: center; gap: 10px; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; font-size: 13.5px; font-weight: 500; }
        .sd-flash.error { background: ${t.errorBg}; border: 1px solid ${t.errorBorder}55; color: ${t.errorText}; }
        .sd-page-title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: ${t.text}; margin-bottom: 28px; }
        .sd-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(155px,1fr)); gap: 16px; margin-bottom: 32px; }
        .sd-stat { background: ${t.surface}; border: 1px solid ${t.border}; border-radius: 14px; padding: 20px 22px; transition: all 0.22s ease; }
        .sd-stat:hover { border-color: ${t.accent}; box-shadow: 0 4px 20px ${t.accentGlow}; transform: translateY(-2px); }
        .sd-stat-val { font-family: 'Syne', sans-serif; font-size: 30px; font-weight: 800; background: ${t.gradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1.1; }
        .sd-stat-lbl { font-size: 12px; color: ${t.textSub}; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 6px; }
        .sd-card { background: ${t.surface}; border: 1px solid ${t.border}; border-radius: 14px; padding: 24px; margin-bottom: 20px; }
        .sd-card-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: ${t.text}; margin-bottom: 16px; }
        .sd-exam-list { display: flex; flex-direction: column; gap: 14px; }
        .sd-exam-card { background: ${t.surface}; border: 1px solid ${t.border}; border-radius: 14px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; gap: 20px; transition: all 0.25s ease; }
        .sd-exam-card:hover { border-color: ${t.accent}; box-shadow: 0 4px 24px ${t.accentGlow}; transform: translateY(-2px); }
        .sd-exam-card.done { opacity: 0.65; border-style: dashed; }
        .sd-exam-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: ${t.text}; margin-bottom: 10px; }
        .sd-exam-meta { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .sd-meta-chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; background: ${t.surfaceAlt}; border: 1px solid ${t.border}; border-radius: 100px; font-size: 12px; color: ${t.textMuted}; }
        .sd-table-wrap { background: ${t.surface}; border: 1px solid ${t.border}; border-radius: 14px; overflow: hidden; overflow-x: auto; }
        .sd-table { width: 100%; border-collapse: collapse; }
        .sd-table thead tr { background: ${t.surfaceAlt}; border-bottom: 1px solid ${t.border}; }
        .sd-table th { padding: 12px 16px; text-align: left; font-size: 11.5px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: ${t.textSub}; white-space: nowrap; }
        .sd-table td { padding: 13px 16px; font-size: 13.5px; color: ${t.text}; border-bottom: 1px solid ${t.border}66; }
        .sd-table tbody tr:last-child td { border-bottom: none; }
        .sd-table tbody tr:hover { background: ${t.surfaceAlt}; }
        .sd-cell-muted { color: ${t.textMuted}; font-size: 12.5px; }
        .sd-bar-wrap { display: inline-block; width: 80px; height: 6px; background: ${t.border}; border-radius: 100px; overflow: hidden; vertical-align: middle; }
        .sd-bar-fill { height: 100%; border-radius: 100px; transition: width 0.6s ease; }
        .sd-badge { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 100px; font-size: 11.5px; font-weight: 600; }
        .sd-badge-low  { background: rgba(5,150,105,0.12); color: #059669; }
        .sd-badge-med  { background: rgba(234,179,8,0.12);  color: #ca8a04; }
        .sd-badge-high { background: ${t.errorBg}; color: ${t.errorText}; }
        .sd-badge-ok   { background: ${t.tabActiveBg}; color: ${t.accent}; }
        .sd-btn-start { padding: 10px 22px; border-radius: 9px; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; background: ${t.gradient}; color: #fff; box-shadow: 0 4px 16px ${t.accentGlow}; white-space: nowrap; transition: all 0.2s ease; flex-shrink: 0; }
        .sd-btn-start:hover { transform: translateY(-1px); filter: brightness(1.08); }
        .sd-done-btn { padding: 10px 22px; background: transparent; border: 1px solid ${t.border}; border-radius: 9px; color: ${t.textSub}; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: not-allowed; white-space: nowrap; flex-shrink: 0; opacity: 0.7; }
        .sd-profile-avatar { width: 64px; height: 64px; border-radius: 50%; background: ${t.gradient}; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 24px; box-shadow: 0 4px 20px ${t.accentGlow}; }
        .sd-profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
        .sd-profile-row { display: flex; flex-direction: column; gap: 4px; padding: 14px 0; border-bottom: 1px solid ${t.border}55; }
        .sd-profile-row:nth-child(odd)  { padding-right: 24px; }
        .sd-profile-row:nth-child(even) { padding-left: 24px; border-left: 1px solid ${t.border}55; }
        .sd-profile-label { font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: ${t.textSub}; }
        .sd-profile-value { font-size: 14px; color: ${t.text}; font-weight: 500; }
        .sd-empty { background: ${t.surface}; border: 1px dashed ${t.border}; border-radius: 16px; padding: 56px 24px; text-align: center; }
        .sd-empty-icon { font-size: 40px; margin-bottom: 14px; }
        .sd-empty p { font-size: 14px; color: ${t.textMuted}; }
        .sd-loading { display: flex; align-items: center; gap: 10px; color: ${t.textMuted}; font-size: 14px; padding: 16px 0; }
        .sd-spinner { width: 18px; height: 18px; border: 2px solid ${t.border}; border-top-color: ${t.accent}; border-radius: 50%; animation: sdspin 0.7s linear infinite; }
        @keyframes sdspin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
            .sd-sidebar { display: none; }
            .sd-content { padding: 20px 16px; }
            .sd-exam-card { flex-direction: column; align-items: flex-start; }
            .sd-btn-start, .sd-done-btn { width: 100%; text-align: center; }
            .sd-profile-grid { grid-template-columns: 1fr; }
            .sd-profile-row:nth-child(even) { padding-left: 0; border-left: none; }
        }
    `;

    return (
        <>
            <style>{css}</style>
            <ThemeSwitcher />
            <div className="sd-root">

                <aside className="sd-sidebar">
                    <div className="sd-logo"><span>Adapt</span>Exam</div>
                    {SECTIONS.map(s => (
                        <button key={s}
                            className={`sd-nav-item ${section === s ? 'active' : ''}`}
                            onClick={() => setSection(s)}>
                            <span>{SECTION_ICONS[s]}</span> {s}
                        </button>
                    ))}
                    <div className="sd-nav-spacer" />
                    <button className="sd-logout" onClick={handleLogout}>🚪 Logout</button>
                </aside>

                <div className="sd-main">
                    <div className="sd-topbar">
                        <div className="sd-topbar-title">{SECTION_ICONS[section]} {section}</div>
                        <div className="sd-topbar-user">
                            <span className="sd-user-dot" />
                            {studentName}
                        </div>
                    </div>

                    <div className="sd-content">
                        {error   && <div className="sd-flash error">⚠ {error}</div>}
                        {loading && <div className="sd-loading"><span className="sd-spinner" /> Loading…</div>}

                        {/* ── OVERVIEW ── */}
                        {section === 'Overview' && !loading && (
                            <>
                                <div className="sd-page-title">Welcome back, {studentName} 👋</div>
                                <div className="sd-stats">
                                    {[
                                        { val: exams.length,          lbl: 'Assigned Exams' },
                                        { val: completedExams.length, lbl: 'Completed'       },
                                        { val: pendingExams.length,   lbl: 'Pending'         },
                                        { val: `${avgPct}%`,          lbl: 'Avg Score'       },
                                        { val: `${avgRisk}%`,         lbl: 'Avg Risk'        },
                                    ].map(({ val, lbl }) => (
                                        <div key={lbl} className="sd-stat">
                                            <div className="sd-stat-val">{val}</div>
                                            <div className="sd-stat-lbl">{lbl}</div>
                                        </div>
                                    ))}
                                </div>

                                {pendingExams.length > 0 && (
                                    <div className="sd-card">
                                        <div className="sd-card-title">⏳ Pending Exams</div>
                                        <div className="sd-exam-list">
                                            {pendingExams.map(exam => (
                                                <div key={exam._id} className="sd-exam-card">
                                                    <div style={{ flex: 1 }}>
                                                        <div className="sd-exam-title">{exam.title}</div>
                                                        <div className="sd-exam-meta">
                                                            <span className="sd-meta-chip">⏱ {exam.duration} min</span>
                                                            <span className="sd-meta-chip">📝 {exam.total_questions} questions</span>
                                                        </div>
                                                    </div>
                                                    <button className="sd-btn-start" onClick={() => handleStartExam(exam)}>
                                                        Start Exam →
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {results.length > 0 && (
                                    <div className="sd-card">
                                        <div className="sd-card-title">📊 Recent Results</div>
                                        <div className="sd-table-wrap">
                                            <table className="sd-table">
                                                <thead><tr>
                                                    <th>Exam</th><th>Score</th><th>Avg Risk</th><th>Date</th>
                                                </tr></thead>
                                                <tbody>
                                                    {results.slice(0, 5).map(r => {
                                                        const brs  = r.behaviorRiskSummary || {};
                                                        const avgR = brs.average_risk ?? 0;
                                                        return (
                                                            <tr key={r._id}>
                                                                <td>{r.exam_id?.title || '—'}</td>
                                                                <td><ScoreBar score={r.score} total={r.total_marks} /></td>
                                                                <td>{riskBadge(avgR)}</td>
                                                                <td className="sd-cell-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ── MY EXAMS ── */}
                        {section === 'My Exams' && !loading && (
                            <>
                                <div className="sd-page-title">My Exams</div>
                                {exams.length === 0 ? (
                                    <div className="sd-empty">
                                        <div className="sd-empty-icon">📋</div>
                                        <p>No exams assigned yet. Check back later.</p>
                                    </div>
                                ) : (
                                    <div className="sd-exam-list">
                                        {exams.map(exam => {
                                            const done = isExamDone(exam);
                                            return (
                                                <div key={exam._id} className={`sd-exam-card ${done ? 'done' : ''}`}>
                                                    <div style={{ flex: 1 }}>
                                                        <div className="sd-exam-title">{exam.title}</div>
                                                        <div className="sd-exam-meta">
                                                            <span className="sd-meta-chip">⏱ {exam.duration} min</span>
                                                            <span className="sd-meta-chip">📝 {exam.total_questions} questions</span>
                                                            <span className="sd-meta-chip">
                                                                🎯 E:{exam.difficulty_distribution?.easy || 0} M:{exam.difficulty_distribution?.medium || 0} H:{exam.difficulty_distribution?.hard || 0}
                                                            </span>
                                                            {done && <span className="sd-badge sd-badge-ok">✓ Completed</span>}
                                                        </div>
                                                    </div>
                                                    {done
                                                        ? <button className="sd-done-btn" disabled>Submitted ✓</button>
                                                        : <button className="sd-btn-start" onClick={() => handleStartExam(exam)}>Start Exam →</button>
                                                    }
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}

                        {/* ── MY RESULTS ── */}
                        {section === 'My Results' && !loading && (
                            <>
                                <div className="sd-page-title">My Results</div>
                                {results.length === 0 ? (
                                    <div className="sd-empty">
                                        <div className="sd-empty-icon">📊</div>
                                        <p>No results yet. Complete an exam to see your scores here.</p>
                                    </div>
                                ) : (
                                    <div className="sd-table-wrap">
                                        <table className="sd-table">
                                            <thead><tr>
                                                <th>Exam</th><th>Score</th><th>Avg Risk</th><th>Max Risk</th><th>Flagged</th><th>Date</th>
                                            </tr></thead>
                                            <tbody>
                                                {results.map(r => {
                                                    const brs     = r.behaviorRiskSummary || {};
                                                    const avgR    = brs.average_risk  ?? 0;
                                                    const maxR    = brs.max_risk      ?? 0;
                                                    const flagged = brs.flagged_count ?? 0;
                                                    return (
                                                        <tr key={r._id}>
                                                            <td>{r.exam_id?.title || '—'}</td>
                                                            <td><ScoreBar score={r.score} total={r.total_marks} /></td>
                                                            <td>{riskBadge(avgR)}</td>
                                                            <td>{riskBadge(maxR)}</td>
                                                            <td>
                                                                <span className={`sd-badge ${flagged > 0 ? 'sd-badge-high' : 'sd-badge-low'}`}>
                                                                    {flagged} flagged
                                                                </span>
                                                            </td>
                                                            <td className="sd-cell-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ── BEHAVIOR ── */}
                        {section === 'Behavior' && !loading && (
                            <>
                                <div className="sd-page-title">My Behavior Logs</div>
                                {logs.length === 0 ? (
                                    <div className="sd-empty">
                                        <div className="sd-empty-icon">🧠</div>
                                        <p>No behavior logs recorded yet.</p>
                                    </div>
                                ) : (
                                    <div className="sd-table-wrap">
                                        <table className="sd-table">
                                            <thead><tr>
                                                <th>Exam</th><th>Eye Dev.</th><th>Head Mov.</th><th>Idle (s)</th><th>Resp. (s)</th><th>Risk</th><th>Time</th>
                                            </tr></thead>
                                            <tbody>
                                                {logs.slice(0, 50).map(l => (
                                                    <tr key={l._id}>
                                                        <td>{l.exam_id?.title || '—'}</td>
                                                        <td>{l.eyeDeviation  ?? '—'}</td>
                                                        <td>{l.headMovement  ?? '—'}</td>
                                                        <td>{l.mouseIdleTime ?? '—'}</td>
                                                        <td>{l.responseTime  ?? '—'}</td>
                                                        <td>{riskBadge(getRisk(l))}</td>
                                                        <td className="sd-cell-muted">{new Date(l.timestamp).toLocaleTimeString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ── PROFILE ── */}
                        {section === 'Profile' && !loading && (
                            <>
                                <div className="sd-page-title">My Profile</div>
                                <div className="sd-card">
                                    <div className="sd-profile-avatar">
                                        {studentName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="sd-profile-grid">
                                        <ProfileRow label="Full Name"       value={profile?.name          || studentName}  />
                                        <ProfileRow label="Email"           value={profile?.email         || studentEmail} />
                                        <ProfileRow label="Roll No"         value={profile?.rollno}           />
                                        <ProfileRow label="Gender"          value={profile?.gender}           />
                                        <ProfileRow label="Age"             value={profile?.age}              />
                                        <ProfileRow label="Phone"           value={profile?.phone_number}     />
                                        <ProfileRow label="Department"      value={profile?.department}       />
                                        <ProfileRow label="Year of Study"   value={profile?.year_of_study}    />
                                        <ProfileRow label="College"         value={profile?.college}          />
                                        <ProfileRow label="Impairment Type" value={profile?.impairment_type}  />
                                    </div>
                                </div>
                            </>
                        )}

                    </div>
                </div>
            </div>
        </>
    );
}