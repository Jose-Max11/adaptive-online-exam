import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getStudents, createStudent, deleteStudent, bulkUploadStudents,
    getExams, createExam, deleteExam, assignExam,
    getQuestions, bulkUploadQ,
    getAllResults, getAllBehaviorLogs,
} from '../services/api';
import { useTheme } from '../context/ThemeContext';
import ThemeSwitcher from '../components/ThemeSwitcher';

const SECTIONS = ['Overview', 'Students', 'Exams', 'Questions', 'Results', 'Behavior'];
const SECTION_ICONS = { Overview: '🏠', Students: '👥', Exams: '📋', Questions: '❓', Results: '📊', Behavior: '🧠' };

// ── Constant empty state so we always reset to a fresh object reference ──
const EMPTY_STUDENT = {
    name: '', email: '', password: '', rollno: '', gender: '',
    age: '', phone_number: '', department: '', year_of_study: '',
    college: '', impairment_type: ''
};

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { theme: t } = useTheme();
    const adminName = localStorage.getItem('name') || 'Admin';
    const [section, setSection] = useState('Overview');
    const fileInputRef = useRef(null);
    const studentFormRef = useRef(null); // ← ref to the <form> for native reset

    const [students, setStudents] = useState([]);
    const [exams, setExams] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [results, setResults] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Always initialise from the constant so references are fresh
    const [studentForm, setStudentForm] = useState({ ...EMPTY_STUDENT });
    const [examForm, setExamForm] = useState({ title: '', duration: 60, total_questions: 10, difficulty_distribution: { easy: 4, medium: 4, hard: 2 } });
    const [assignForm, setAssignForm] = useState({ examId: '', studentIds: [] });
    const [qBulk, setQBulk] = useState('');

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [s, e, q, r, l] = await Promise.all([
                getStudents(), getExams(), getQuestions(), getAllResults(), getAllBehaviorLogs(),
            ]);
            setStudents(s.data); setExams(e.data); setQuestions(q.data); setResults(r.data); setLogs(l.data);
        } catch { setError('Failed to load data.'); }
        finally { setLoading(false); }
    };

    const flash = (msg, isErr = false) => {
        isErr ? setError(msg) : setSuccess(msg);
        setTimeout(() => { setError(''); setSuccess(''); }, 3500);
    };

    const handleLogout = () => { localStorage.clear(); navigate('/'); };

    // ── FIX: reset state + native form so the form is fully clean each time ──
    const handleCreateStudent = async (e) => {
        e.preventDefault();
        const payload = { ...studentForm }; // snapshot before reset
        try {
            await createStudent(payload);
            setStudentForm({ ...EMPTY_STUDENT });         // reset controlled state
            if (studentFormRef.current) studentFormRef.current.reset(); // reset native form (clears file inputs etc.)
            flash('Student created!');
            await loadAll();
        } catch (err) {
            flash(err.response?.data?.message || 'Error creating student', true);
        }
    };

    const handleBulkUploadStudents = async (e) => {
        e.preventDefault(); e.stopPropagation();
        const file = fileInputRef.current?.files?.[0];
        if (!file) { flash('Please select an Excel file', true); return; }
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await bulkUploadStudents(formData);
            let msg = response.data.message;
            if (response.data.errors?.length > 0) {
                const errorPreview = response.data.errors.slice(0, 3).join('\n');
                msg = `${response.data.message}\n\nFirst errors:\n${errorPreview}`;
                if (response.data.errors.length > 3) msg += `\n...and ${response.data.errors.length - 3} more errors`;
            }
            flash(msg, response.data.errors?.length > 0);
            if (fileInputRef.current) fileInputRef.current.value = '';
            loadAll();
        } catch (err) { flash(err.response?.data?.message || err.message || 'Error uploading file', true); }
    };

    const handleDeleteStudent = async (id) => {
        if (!window.confirm('Delete this student?')) return;
        await deleteStudent(id); flash('Student deleted.'); loadAll();
    };

    const handleCreateExam = async (e) => {
        e.preventDefault();
        try {
            await createExam(examForm);
            setExamForm({ title: '', duration: 60, total_questions: 10, difficulty_distribution: { easy: 4, medium: 4, hard: 2 } });
            flash('Exam created!'); loadAll();
        } catch (err) { flash(err.response?.data?.message || 'Error creating exam', true); }
    };

    const handleDeleteExam = async (id) => {
        if (!window.confirm('Delete this exam?')) return;
        await deleteExam(id); flash('Exam deleted.'); loadAll();
    };

    const handleAssignExam = async (e) => {
        e.preventDefault();
        try {
            await assignExam({ examId: assignForm.examId, studentIds: assignForm.studentIds });
            flash('Exam assigned!'); loadAll();
        } catch { flash('Error assigning exam', true); }
    };

    const handleBulkUpload = async (e) => {
        e.preventDefault();
        try {
            const parsed = JSON.parse(qBulk);
            const arr = Array.isArray(parsed) ? parsed : [parsed];
            await bulkUploadQ({ questions: arr });
            flash(`${arr.length} question(s) uploaded!`); setQBulk(''); loadAll();
        } catch { flash('Invalid JSON or upload error', true); }
    };

    const css = `
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ad-root {
            display: flex; min-height: 100vh;
            background: ${t.bg}; color: ${t.text};
            font-family: 'DM Sans', sans-serif;
            transition: background 0.4s ease, color 0.4s ease;
        }

        /* ── SIDEBAR ── */
        .ad-sidebar {
            width: 220px; flex-shrink: 0;
            background: ${t.surface};
            border-right: 1px solid ${t.border};
            display: flex; flex-direction: column;
            padding: 24px 12px;
            position: sticky; top: 0; height: 100vh;
            transition: background 0.4s ease, border-color 0.4s ease;
        }
        .ad-sidebar-logo {
            font-family: 'Syne', sans-serif;
            font-size: 20px; font-weight: 800; letter-spacing: -0.5px;
            color: ${t.text};
            padding: 0 12px; margin-bottom: 28px;
        }
        .ad-sidebar-logo span {
            background: ${t.gradient};
            -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .ad-nav-item {
            display: flex; align-items: center; gap: 10px;
            padding: 10px 12px; border-radius: 9px;
            border: none; background: transparent;
            color: ${t.textMuted}; font-family: 'DM Sans', sans-serif;
            font-size: 14px; font-weight: 500; cursor: pointer;
            transition: all 0.18s ease; text-align: left; width: 100%;
            margin-bottom: 2px;
        }
        .ad-nav-item:hover { background: ${t.surfaceAlt}; color: ${t.text}; }
        .ad-nav-item.active {
            background: ${t.tabActiveBg}; color: ${t.accent};
            font-weight: 600;
        }
        .ad-nav-item.active .ad-nav-icon { filter: none; }
        .ad-nav-spacer { flex: 1; }
        .ad-logout {
            display: flex; align-items: center; gap: 10px;
            padding: 10px 12px; border-radius: 9px;
            border: none; background: transparent;
            color: ${t.textMuted}; font-family: 'DM Sans', sans-serif;
            font-size: 14px; font-weight: 500; cursor: pointer;
            transition: all 0.18s ease; width: 100%;
        }
        .ad-logout:hover { background: ${t.errorBg}; color: ${t.errorText}; }

        /* ── MAIN ── */
        .ad-main {
            flex: 1; display: flex; flex-direction: column;
            min-width: 0;
        }
        .ad-topbar {
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 32px; height: 60px;
            background: ${t.surface};
            border-bottom: 1px solid ${t.border};
            position: sticky; top: 0; z-index: 30;
            transition: background 0.4s ease, border-color 0.4s ease;
        }
        .ad-topbar-title {
            font-family: 'Syne', sans-serif;
            font-size: 16px; font-weight: 700; color: ${t.text};
        }
        .ad-topbar-user {
            display: flex; align-items: center; gap: 8px;
            padding: 5px 14px;
            background: ${t.surfaceAlt}; border: 1px solid ${t.border};
            border-radius: 100px; font-size: 13px; color: ${t.textMuted};
        }
        .ad-user-dot {
            width: 7px; height: 7px; border-radius: 50%;
            background: ${t.accent}; box-shadow: 0 0 6px ${t.accentGlow};
        }
        .ad-content { padding: 32px; flex: 1; }

        /* ── FLASH ── */
        .ad-flash {
            display: flex; align-items: center; gap: 10px;
            border-radius: 10px; padding: 12px 16px; margin-bottom: 20px;
            font-size: 13.5px; font-weight: 500;
        }
        .ad-flash.success { background: ${t.tabActiveBg}; border: 1px solid ${t.accent}44; color: ${t.accent}; }
        .ad-flash.error { background: ${t.errorBg}; border: 1px solid ${t.errorBorder}55; color: ${t.errorText}; }

        /* ── SECTION TITLE ── */
        .ad-page-title {
            font-family: 'Syne', sans-serif;
            font-size: 24px; font-weight: 800; letter-spacing: -0.5px;
            color: ${t.text}; margin-bottom: 28px; transition: color 0.4s ease;
        }

        /* ── STATS ── */
        .ad-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px,1fr)); gap: 16px; margin-bottom: 32px; }
        .ad-stat {
            background: ${t.surface}; border: 1px solid ${t.border};
            border-radius: 14px; padding: 20px 22px;
            transition: all 0.22s ease;
        }
        .ad-stat:hover { border-color: ${t.accent}; box-shadow: 0 4px 20px ${t.accentGlow}; transform: translateY(-2px); }
        .ad-stat-val {
            font-family: 'Syne', sans-serif; font-size: 30px; font-weight: 800;
            background: ${t.gradient};
            -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
            line-height: 1.1;
        }
        .ad-stat-lbl {
            font-size: 12px; color: ${t.textSub}; font-weight: 500;
            letter-spacing: 0.5px; text-transform: uppercase; margin-top: 6px;
        }

        /* ── CARD ── */
        .ad-card {
            background: ${t.surface}; border: 1px solid ${t.border};
            border-radius: 14px; padding: 24px; margin-bottom: 20px;
            transition: background 0.4s ease, border-color 0.4s ease;
        }
        .ad-card-title {
            font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
            color: ${t.text}; margin-bottom: 16px; transition: color 0.4s ease;
        }
        .ad-card-hint {
            font-size: 12.5px; color: ${t.textMuted}; margin-bottom: 14px; line-height: 1.5;
            transition: color 0.4s ease;
        }

        /* ── FORM INPUTS ── */
        .ad-input, .ad-select, .ad-textarea {
            background: ${t.inputBg}; border: 1.5px solid ${t.border};
            border-radius: 9px; color: ${t.text};
            font-family: 'DM Sans', sans-serif; font-size: 14px;
            padding: 10px 13px; outline: none; width: 100%;
            transition: all 0.2s ease;
        }
        .ad-input::placeholder, .ad-textarea::placeholder { color: ${t.textSub}; }
        .ad-input:focus, .ad-select:focus, .ad-textarea:focus {
            border-color: ${t.accent}; box-shadow: 0 0 0 3px ${t.accentGlow};
            background: ${t.surfaceAlt};
        }
        .ad-select option { background: ${t.surface}; color: ${t.text}; }
        .ad-textarea { resize: vertical; font-family: monospace; font-size: 12.5px; }
        .ad-form-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(190px,1fr)); gap: 10px; margin-bottom: 16px;
        }
        .ad-form-row { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; }

        /* ── BUTTONS ── */
        .ad-btn {
            padding: 10px 20px; border-radius: 9px; border: none; cursor: pointer;
            font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
            transition: all 0.2s ease; white-space: nowrap;
        }
        .ad-btn-primary {
            background: ${t.gradient}; color: #fff;
            box-shadow: 0 4px 14px ${t.accentGlow};
        }
        .ad-btn-primary:hover { transform: translateY(-1px); filter: brightness(1.08); box-shadow: 0 6px 20px ${t.accentGlow}; }
        .ad-btn-secondary {
            background: ${t.surfaceAlt}; color: ${t.textMuted};
            border: 1px solid ${t.border};
        }
        .ad-btn-secondary:hover { color: ${t.text}; border-color: ${t.accent}; background: ${t.tabActiveBg}; }
        .ad-btn-danger {
            background: ${t.errorBg}; color: ${t.errorText};
            border: 1px solid ${t.errorBorder}44;
            padding: 7px 14px; font-size: 12.5px;
        }
        .ad-btn-danger:hover { background: ${t.errorBorder}22; border-color: ${t.errorBorder}; }
        .ad-btn-sm { padding: 6px 13px; font-size: 12.5px; }

        /* ── TABLE ── */
        .ad-table-wrap {
            background: ${t.surface}; border: 1px solid ${t.border};
            border-radius: 14px; overflow: hidden; overflow-x: auto;
            transition: background 0.4s ease, border-color 0.4s ease;
        }
        .ad-table { width: 100%; border-collapse: collapse; }
        .ad-table thead tr {
            background: ${t.surfaceAlt}; border-bottom: 1px solid ${t.border};
        }
        .ad-table th {
            padding: 12px 16px; text-align: left;
            font-size: 11.5px; font-weight: 600; letter-spacing: 0.5px;
            text-transform: uppercase; color: ${t.textSub};
            white-space: nowrap;
        }
        .ad-table td {
            padding: 13px 16px; font-size: 13.5px; color: ${t.text};
            border-bottom: 1px solid ${t.border}66;
            transition: color 0.4s ease;
        }
        .ad-table tbody tr:last-child td { border-bottom: none; }
        .ad-table tbody tr:hover { background: ${t.surfaceAlt}; }
        .ad-cell-muted { color: ${t.textMuted}; font-size: 12.5px; }
        .ad-td-actions { display: flex; gap: 8px; align-items: center; }

        /* ── BADGES ── */
        .ad-badge {
            display: inline-flex; align-items: center;
            padding: 2px 10px; border-radius: 100px;
            font-size: 11.5px; font-weight: 600;
        }
        .ad-badge-easy { background: rgba(5,150,105,0.12); color: #059669; }
        .ad-badge-medium { background: rgba(234,179,8,0.12); color: #ca8a04; }
        .ad-badge-hard { background: ${t.errorBg}; color: ${t.errorText}; }
        .ad-badge-ok { background: ${t.tabActiveBg}; color: ${t.accent}; }

        /* ── LOADING ── */
        .ad-loading { display: flex; align-items: center; gap: 10px; color: ${t.textMuted}; font-size: 14px; padding: 16px 0; }
        .ad-spinner {
            width: 18px; height: 18px;
            border: 2px solid ${t.border}; border-top-color: ${t.accent};
            border-radius: 50%; animation: adspin 0.7s linear infinite;
        }
        @keyframes adspin { to { transform: rotate(360deg); } }

        /* ── MOBILE ── */
        @media (max-width: 768px) {
            .ad-sidebar { display: none; }
            .ad-content { padding: 20px 16px; }
        }
    `;

    return (
        <>
            <style>{css}</style>
            <ThemeSwitcher />
            <div className="ad-root">

                {/* Sidebar */}
                <aside className="ad-sidebar">
                    <div className="ad-sidebar-logo"><span>Adapt</span>Exam</div>
                    {SECTIONS.map(s => (
                        <button key={s}
                            className={`ad-nav-item ${section === s ? 'active' : ''}`}
                            onClick={() => setSection(s)}>
                            <span>{SECTION_ICONS[s]}</span> {s}
                        </button>
                    ))}
                    <div className="ad-nav-spacer" />
                    <button className="ad-logout" onClick={handleLogout}>🚪 Logout</button>
                </aside>

                {/* Main */}
                <div className="ad-main">

                    {/* Topbar */}
                    <div className="ad-topbar">
                        <div className="ad-topbar-title">{SECTION_ICONS[section]} {section}</div>
                        <div className="ad-topbar-user">
                            <span className="ad-user-dot" />
                            {adminName}
                        </div>
                    </div>

                    <div className="ad-content">
                        {success && <div className="ad-flash success">✓ {success}</div>}
                        {error && <div className="ad-flash error">⚠ {error}</div>}
                        {loading && <div className="ad-loading"><span className="ad-spinner" /> Loading…</div>}

                        {/* ── OVERVIEW ── */}
                        {section === 'Overview' && (
                            <>
                                <div className="ad-page-title">Welcome back, {adminName} 👋</div>
                                <div className="ad-stats">
                                    {[
                                        { val: students.length, lbl: 'Students' },
                                        { val: exams.length, lbl: 'Exams' },
                                        { val: questions.length, lbl: 'Questions' },
                                        { val: results.length, lbl: 'Results' },
                                        { val: logs.length, lbl: 'Behavior Logs' },
                                        { val: `${logs.length ? (logs.reduce((a,l)=>a+l.riskScore,0)/logs.length*100).toFixed(0) : 0}%`, lbl: 'Avg Risk' },
                                    ].map(({ val, lbl }) => (
                                        <div key={lbl} className="ad-stat">
                                            <div className="ad-stat-val">{val}</div>
                                            <div className="ad-stat-lbl">{lbl}</div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* ── STUDENTS ── */}
                        {section === 'Students' && (
                            <>
                                <div className="ad-page-title">Students</div>

                                <div className="ad-card">
                                    <div className="ad-card-title">Add New Student</div>
                                    {/* ── ref added so we can call .reset() after submit ── */}
                                    <form ref={studentFormRef} onSubmit={handleCreateStudent}>
                                        <div className="ad-form-grid">
                                            {[
                                                { ph: 'Full Name *', key: 'name', type: 'text', req: true },
                                                { ph: 'Email *', key: 'email', type: 'email', req: true },
                                                { ph: 'Password *', key: 'password', type: 'password', req: true },
                                                { ph: 'Roll No', key: 'rollno', type: 'text' },
                                                { ph: 'Age', key: 'age', type: 'number' },
                                                { ph: 'Phone Number', key: 'phone_number', type: 'text' },
                                                { ph: 'Department', key: 'department', type: 'text' },
                                                { ph: 'Year of Study', key: 'year_of_study', type: 'text' },
                                                { ph: 'College', key: 'college', type: 'text' },
                                                { ph: 'Impairment Type', key: 'impairment_type', type: 'text' },
                                            ].map(({ ph, key, type, req }) => (
                                                <input key={key} className="ad-input" placeholder={ph} type={type}
                                                    value={studentForm[key]} required={req}
                                                    onChange={e => setStudentForm(prev => ({ ...prev, [key]: e.target.value }))} />
                                            ))}
                                            <select className="ad-select" value={studentForm.gender}
                                                onChange={e => setStudentForm(prev => ({ ...prev, gender: e.target.value }))}>
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <button type="submit" className="ad-btn ad-btn-primary">+ Add Student</button>
                                    </form>
                                </div>

                                <div className="ad-card">
                                    <div className="ad-card-title">Bulk Upload (Excel)</div>
                                    <div className="ad-card-hint">
                                        Upload .xlsx or .xls with columns: name, email, password, rollno, gender, age, phone_number, department, year_of_study, college, impairment_type
                                    </div>
                                    <form onSubmit={handleBulkUploadStudents} className="ad-form-row">
                                        <input type="file" ref={fileInputRef} accept=".xlsx,.xls" className="ad-input" style={{ flex: '1 1 240px' }} />
                                        <button type="submit" className="ad-btn ad-btn-secondary">Upload Excel</button>
                                    </form>
                                </div>

                                <div className="ad-table-wrap">
                                    <table className="ad-table">
                                        <thead><tr>
                                            {['Name','Email','Roll No','Gender','Age','Phone','Dept','Year','College','Impairment','Exams','Action'].map(h => (
                                                <th key={h}>{h}</th>
                                            ))}
                                        </tr></thead>
                                        <tbody>
                                            {students.map(s => (
                                                <tr key={s._id}>
                                                    <td>{s.name}</td>
                                                    <td className="ad-cell-muted">{s.email}</td>
                                                    <td>{s.rollno || '—'}</td>
                                                    <td>{s.gender || '—'}</td>
                                                    <td>{s.age || '—'}</td>
                                                    <td>{s.phone_number || '—'}</td>
                                                    <td>{s.department || '—'}</td>
                                                    <td>{s.year_of_study || '—'}</td>
                                                    <td>{s.college || '—'}</td>
                                                    <td>{s.impairment_type || '—'}</td>
                                                    <td>{s.assigned_exams?.length || 0}</td>
                                                    <td>
                                                        <button className="ad-btn ad-btn-danger ad-btn-sm" onClick={() => handleDeleteStudent(s._id)}>Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* ── EXAMS ── */}
                        {section === 'Exams' && (
                            <>
                                <div className="ad-page-title">Exams</div>
                                <div className="ad-card">
                                    <div className="ad-card-title">Create Exam</div>
                                    <form onSubmit={handleCreateExam} className="ad-form-row">
                                        <input className="ad-input" placeholder="Exam Title" value={examForm.title}
                                            onChange={e => setExamForm({ ...examForm, title: e.target.value })} required style={{ flex: '1 1 200px' }} />
                                        <input className="ad-input" type="number" placeholder="Duration (min)" value={examForm.duration}
                                            onChange={e => setExamForm({ ...examForm, duration: +e.target.value })} min={1} style={{ flex: '0 0 150px' }} />
                                        <input className="ad-input" type="number" placeholder="Total Questions" value={examForm.total_questions}
                                            onChange={e => setExamForm({ ...examForm, total_questions: +e.target.value })} min={1} style={{ flex: '0 0 150px' }} />
                                        <button type="submit" className="ad-btn ad-btn-primary">+ Create</button>
                                    </form>
                                </div>

                                <div className="ad-card">
                                    <div className="ad-card-title">Assign Exam to Students</div>
                                    <form onSubmit={handleAssignExam} className="ad-form-row">
                                        <select className="ad-select" value={assignForm.examId}
                                            onChange={e => setAssignForm({ ...assignForm, examId: e.target.value })} required style={{ flex: '1 1 200px' }}>
                                            <option value="">Select Exam</option>
                                            {exams.map(ex => <option key={ex._id} value={ex._id}>{ex.title}</option>)}
                                        </select>
                                        <select multiple className="ad-select" value={assignForm.studentIds}
                                            onChange={e => setAssignForm({ ...assignForm, studentIds: [...e.target.selectedOptions].map(o => o.value) })}
                                            style={{ flex: '1 1 200px', height: 100 }}>
                                            {students.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                        </select>
                                        <button type="submit" className="ad-btn ad-btn-primary">Assign</button>
                                    </form>
                                    <div className="ad-card-hint" style={{ marginTop: 10, marginBottom: 0 }}>Hold Ctrl/Cmd to select multiple students</div>
                                </div>

                                <div className="ad-table-wrap">
                                    <table className="ad-table">
                                        <thead><tr><th>Title</th><th>Duration</th><th>Questions</th><th>Students</th><th>Actions</th></tr></thead>
                                        <tbody>
                                            {exams.map(ex => (
                                                <tr key={ex._id}>
                                                    <td>{ex.title}</td>
                                                    <td>{ex.duration} min</td>
                                                    <td>{ex.questions?.length || 0}</td>
                                                    <td>{ex.assigned_students?.length || 0}</td>
                                                    <td>
                                                        <div className="ad-td-actions">
                                                            <button className="ad-btn ad-btn-secondary ad-btn-sm" onClick={() => navigate(`/admin/exam/${ex._id}`)}>Configure</button>
                                                            <button className="ad-btn ad-btn-danger ad-btn-sm" onClick={() => handleDeleteExam(ex._id)}>Delete</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* ── QUESTIONS ── */}
                        {section === 'Questions' && (
                            <>
                                <div className="ad-page-title">Question Bank</div>
                                <div className="ad-card">
                                    <div className="ad-card-title">Bulk Upload (JSON Array)</div>
                                    <div className="ad-card-hint">
                                        Paste a JSON array. Each object needs: question_text, options, correct_answer, topic, concept, difficulty, structure_type, marks.
                                    </div>
                                    <form onSubmit={handleBulkUpload}>
                                        <textarea className="ad-textarea" rows={8} value={qBulk}
                                            onChange={e => setQBulk(e.target.value)}
                                            placeholder='[{"question_text":"...","options":["A","B","C","D"],"correct_answer":"A","topic":"Math","concept":"Algebra","difficulty":"easy","structure_type":"mcq","marks":1}]'
                                            style={{ marginBottom: 12 }} />
                                        <button type="submit" className="ad-btn ad-btn-primary">Upload Questions</button>
                                    </form>
                                </div>
                                <div className="ad-table-wrap">
                                    <table className="ad-table">
                                        <thead><tr><th>Question</th><th>Topic</th><th>Concept</th><th>Difficulty</th><th>Type</th><th>Marks</th></tr></thead>
                                        <tbody>
                                            {questions.map(q => (
                                                <tr key={q._id}>
                                                    <td style={{ maxWidth: 320 }}>{q.question_text}</td>
                                                    <td>{q.topic}</td>
                                                    <td>{q.concept}</td>
                                                    <td><span className={`ad-badge ad-badge-${q.difficulty}`}>{q.difficulty}</span></td>
                                                    <td>{q.structure_type}</td>
                                                    <td>{q.marks}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* ── RESULTS ── */}
                        {section === 'Results' && (
                            <>
                                <div className="ad-page-title">Exam Results</div>
                                <div className="ad-table-wrap">
                                    <table className="ad-table">
                                        <thead><tr><th>Student</th><th>Exam</th><th>Score</th><th>Avg Risk</th><th>Max Risk</th><th>Flagged</th><th>Date</th></tr></thead>
                                        <tbody>
                                            {results.map(r => (
                                                <tr key={r._id}>
                                                    <td>{r.student_id?.name}</td>
                                                    <td>{r.exam_id?.title}</td>
                                                    <td><strong>{r.score}/{r.total_marks}</strong></td>
                                                    <td>{(r.behaviorRiskSummary?.average_risk * 100 || 0).toFixed(0)}%</td>
                                                    <td>{(r.behaviorRiskSummary?.max_risk * 100 || 0).toFixed(0)}%</td>
                                                    <td>
                                                        <span className={`ad-badge ${r.behaviorRiskSummary?.flagged_count > 0 ? 'ad-badge-hard' : 'ad-badge-easy'}`}>
                                                            {r.behaviorRiskSummary?.flagged_count || 0}
                                                        </span>
                                                    </td>
                                                    <td className="ad-cell-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* ── BEHAVIOR ── */}
                        {section === 'Behavior' && (
                            <>
                                <div className="ad-page-title">Behavior Monitoring</div>
                                <div className="ad-table-wrap">
                                    <table className="ad-table">
                                        <thead><tr><th>Student</th><th>Exam</th><th>Eye Dev.</th><th>Head Mov.</th><th>Idle (s)</th><th>Resp. (s)</th><th>Risk</th><th>Time</th></tr></thead>
                                        <tbody>
                                            {logs.slice(0, 50).map(l => (
                                                <tr key={l._id}>
                                                    <td>{l.student_id?.name}</td>
                                                    <td>{l.exam_id?.title}</td>
                                                    <td>{l.eyeDeviation}</td>
                                                    <td>{l.headMovement}</td>
                                                    <td>{l.mouseIdleTime}</td>
                                                    <td>{l.responseTime}</td>
                                                    <td>
                                                        <span className={`ad-badge ${l.riskScore >= 0.6 ? 'ad-badge-hard' : l.riskScore >= 0.3 ? 'ad-badge-medium' : 'ad-badge-easy'}`}>
                                                            {(l.riskScore * 100).toFixed(0)}%
                                                        </span>
                                                    </td>
                                                    <td className="ad-cell-muted">{new Date(l.timestamp).toLocaleTimeString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                    </div>
                </div>
            </div>
        </>
    );
}