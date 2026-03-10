import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExam, logBehavior, submitResult } from '../services/api';
import CameraMonitor from '../components/CameraMonitor';
import QuestionCard from '../components/QuestionCard';
import Timer from '../components/Timer';
import BehaviorTracker from '../components/BehaviorTracker';
import { useTheme } from '../context/ThemeContext';
import ThemeSwitcher from '../components/ThemeSwitcher';

export default function ExamPage() {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { theme: t } = useTheme();
    const studentId = localStorage.getItem('studentId');

    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [qIndex, setQIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [replaced, setReplaced] = useState({});
    const [riskScore, setRiskScore] = useState(0);
    const [tabWarnings, setTabWarnings] = useState(0);
    const [alert, setAlert] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);

    const trackerRef = useRef(null);
    const cameraMetrics = useRef({ eyeDeviation: 0, headMovement: 0 });

    useEffect(() => {
        getExam(examId)
            .then(res => { setExam(res.data); setQuestions(res.data.questions || []); })
            .catch(() => setAlert('Failed to load exam.'))
            .finally(() => setLoading(false));
    }, [examId]);

    useEffect(() => {
        const tracker = new BehaviorTracker((switchCount) => {
            setTabWarnings(switchCount);
            if (switchCount >= 3) setAlert('⚠️ Multiple tab switches detected! This will be flagged in your behavior report.');
            else setAlert(`⚠️ Tab switch detected (${switchCount}/3). Please stay on the exam page.`);
        });
        tracker.start();
        trackerRef.current = tracker;
        return () => tracker.stop();
    }, []);

    const currentQ = questions[qIndex];

    const handleCameraMetrics = useCallback(({ eyeDeviation, headMovement }) => {
        cameraMetrics.current = { eyeDeviation, headMovement };
    }, []);

    useEffect(() => {
        if (!currentQ || submitted) return;
        const interval = setInterval(async () => {
            try {
                const browserMetrics = trackerRef.current?.getMetrics() || {};
                const payload = {
                    student_id: studentId, exam_id: examId, question_id: currentQ._id,
                    eyeDeviation: cameraMetrics.current.eyeDeviation,
                    headMovement: cameraMetrics.current.headMovement,
                    mouseIdleTime: browserMetrics.mouseIdleTime || 0,
                    responseTime: browserMetrics.responseTime || 0,
                };
                const res = await logBehavior(payload);
                const { riskScore: rs, adaptiveQuestion } = res.data;
                setRiskScore(rs || 0);
                if (adaptiveQuestion) {
                    setQuestions(prev => { const u = [...prev]; u[qIndex] = adaptiveQuestion; return u; });
                    setReplaced(prev => ({ ...prev, [qIndex]: true }));
                    setAlert('⚡ Question adapted based on behavior analysis.');
                    setTimeout(() => setAlert(''), 4000);
                }
            } catch (_) {}
        }, 10000);
        return () => clearInterval(interval);
    }, [currentQ, qIndex, submitted]);

    const handleNext = () => { if (qIndex < questions.length - 1) { trackerRef.current?.resetQuestion(); setQIndex(i => i + 1); } };
    const handlePrev = () => { if (qIndex > 0) { trackerRef.current?.resetQuestion(); setQIndex(i => i - 1); } };

    const handleSubmit = async () => {
        trackerRef.current?.stop();
        const payload = {
            student_id: studentId, exam_id: examId,
            answers: Object.entries(answers).map(([question_id, selected_option]) => ({ question_id, selected_option })),
        };
        try {
            const res = await submitResult(payload);
            navigate(`/student`, { state: { result: res.data } });
        } catch { setAlert('Failed to submit exam. Please try again.'); }
    };

    const riskPct = (riskScore * 100).toFixed(0);
    const riskColor = riskScore >= 0.6 ? '#ef4444' : riskScore >= 0.3 ? '#f59e0b' : '#10b981';
    const answeredCount = Object.keys(answers).length;

    const css = `
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ep-root { min-height: 100vh; background: ${t.bg}; color: ${t.text}; font-family: 'DM Sans', sans-serif; transition: background 0.4s, color 0.4s; }

        .ep-nav {
            position: sticky; top: 0; z-index: 40;
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 32px; height: 60px;
            background: ${t.surface}; border-bottom: 1px solid ${t.border};
            box-shadow: 0 1px 16px ${t.cardShadow};
            transition: background 0.4s, border-color 0.4s;
        }
        .ep-nav-logo { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800; color: ${t.text}; }
        .ep-nav-logo span { background: ${t.gradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .ep-nav-right { display: flex; align-items: center; gap: 12px; }
        .ep-warn-chip {
            display: flex; align-items: center; gap: 6px;
            padding: 4px 12px; border-radius: 100px;
            background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3);
            color: #f59e0b; font-size: 12.5px; font-weight: 600;
        }

        .ep-alert {
            margin: 14px 32px; padding: 12px 16px; border-radius: 10px;
            font-size: 13.5px; font-weight: 500;
            background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); color: #f59e0b;
        }

        .ep-body { display: grid; grid-template-columns: 1fr 300px; gap: 24px; padding: 28px 32px; max-width: 1280px; margin: 0 auto; }

        /* LEFT COLUMN */
        .ep-left { display: flex; flex-direction: column; gap: 16px; min-width: 0; }

        /* QUESTION MAP */
        .ep-qmap { display: flex; flex-wrap: wrap; gap: 8px; }
        .ep-qmap-btn {
            width: 36px; height: 36px; border-radius: 8px; border: 1.5px solid ${t.border};
            background: ${t.surfaceAlt}; color: ${t.textMuted};
            font-weight: 700; font-size: 13px; cursor: pointer;
            transition: all 0.18s ease; font-family: 'DM Sans', sans-serif;
            display: flex; align-items: center; justify-content: center;
        }
        .ep-qmap-btn.answered { background: ${t.accent}; border-color: ${t.accent}; color: #fff; }
        .ep-qmap-btn.replaced { background: rgba(245,158,11,0.25); border-color: #f59e0b; color: #f59e0b; }
        .ep-qmap-btn.current { outline: 2.5px solid ${t.accent}; outline-offset: 2px; }
        .ep-qmap-btn:hover { border-color: ${t.accent}; color: ${t.text}; }

        /* NAV BUTTONS */
        .ep-nav-btns { display: flex; justify-content: space-between; align-items: center; }
        .ep-btn {
            padding: 10px 22px; border-radius: 9px; border: none;
            font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer;
            transition: all 0.2s ease;
        }
        .ep-btn-prev { background: ${t.surfaceAlt}; color: ${t.textMuted}; border: 1px solid ${t.border}; }
        .ep-btn-prev:hover:not(:disabled) { color: ${t.text}; border-color: ${t.accent}; }
        .ep-btn-prev:disabled { opacity: 0.4; cursor: not-allowed; }
        .ep-btn-next { background: ${t.gradient}; color: #fff; box-shadow: 0 4px 14px ${t.accentGlow}; }
        .ep-btn-next:hover { transform: translateY(-1px); filter: brightness(1.08); box-shadow: 0 6px 20px ${t.accentGlow}; }
        .ep-btn-submit { background: linear-gradient(135deg, #10b981, #059669); color: #fff; box-shadow: 0 4px 14px rgba(16,185,129,0.3); }
        .ep-btn-submit:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.08); }
        .ep-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        /* RIGHT SIDEBAR */
        .ep-sidebar { display: flex; flex-direction: column; gap: 14px; }
        .ep-widget {
            background: ${t.surface}; border: 1px solid ${t.border};
            border-radius: 14px; padding: 18px; transition: background 0.4s, border-color 0.4s;
        }
        .ep-widget-label {
            font-size: 11px; font-weight: 600; letter-spacing: 0.6px; text-transform: uppercase;
            color: ${t.textSub}; margin-bottom: 12px;
        }

        /* TIMER */
        .ep-timer-display {
            font-family: 'Syne', sans-serif; font-size: 36px; font-weight: 800;
            text-align: center; letter-spacing: 1px; line-height: 1;
            color: ${t.text}; transition: color 0.3s;
        }
        .ep-timer-display.warning { color: #f59e0b; }
        .ep-timer-display.danger { color: #ef4444; animation: epblink 1s infinite; }
        @keyframes epblink { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        .ep-progress-bar-bg { height: 6px; background: ${t.surfaceAlt}; border-radius: 99px; overflow: hidden; margin-top: 10px; }
        .ep-progress-bar-fill { height: 100%; border-radius: 99px; transition: width 1s linear, background 0.5s; }

        /* RISK METER */
        .ep-risk-bar-bg { height: 8px; background: ${t.surfaceAlt}; border-radius: 99px; overflow: hidden; margin: 8px 0 6px; }
        .ep-risk-bar-fill { height: 100%; border-radius: 99px; transition: width 0.5s ease, background 0.5s; }
        .ep-risk-labels { display: flex; justify-content: space-between; }
        .ep-risk-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; text-align: center; }

        /* PROGRESS */
        .ep-prog-big { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; text-align: center; background: ${t.gradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .ep-prog-sub { font-size: 12px; color: ${t.textSub}; text-align: center; margin-top: 4px; }

        /* LOADING / ERROR */
        .ep-center { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: ${t.bg}; }
        .ep-center p { font-size: 15px; color: ${t.textMuted}; }

        @media (max-width: 768px) {
            .ep-body { grid-template-columns: 1fr; }
            .ep-sidebar { order: -1; display: grid; grid-template-columns: 1fr 1fr; }
            .ep-nav { padding: 0 16px; }
            .ep-body { padding: 16px; }
        }
    `;

    if (loading) return <><style>{css}</style><div className="ep-center"><p>Loading exam…</p></div></>;
    if (!exam) return <><style>{css}</style><div className="ep-center"><p>Exam not found.</p></div></>;

    return (
        <>
            <style>{css}</style>
            <ThemeSwitcher />
            <div className="ep-root">
                <nav className="ep-nav">
                    <div className="ep-nav-logo"><span>{exam.title}</span></div>
                    <div className="ep-nav-right">
                        {tabWarnings > 0 && (
                            <div className="ep-warn-chip">⚠️ {tabWarnings} tab switch{tabWarnings > 1 ? 'es' : ''}</div>
                        )}
                    </div>
                </nav>

                {alert && <div className="ep-alert">{alert}</div>}

                <div className="ep-body">
                    {/* LEFT */}
                    <div className="ep-left">
                        <QuestionCard
                            question={currentQ}
                            index={qIndex}
                            total={questions.length}
                            selected={answers[currentQ?._id] || ''}
                            onSelect={(opt) => setAnswers(prev => ({ ...prev, [currentQ._id]: opt }))}
                            isReplaced={!!replaced[qIndex]}
                        />

                        <div className="ep-nav-btns">
                            <button className="ep-btn ep-btn-prev" onClick={handlePrev} disabled={qIndex === 0}>← Previous</button>
                            {qIndex < questions.length - 1
                                ? <button className="ep-btn ep-btn-next" onClick={handleNext}>Next →</button>
                                : <button className="ep-btn ep-btn-submit" onClick={handleSubmit} disabled={submitted}>✔ Submit Exam</button>
                            }
                        </div>

                        <div className="ep-qmap">
                            {questions.map((q, i) => (
                                <button key={i}
                                    className={`ep-qmap-btn ${answers[q._id] ? 'answered' : ''} ${replaced[i] ? 'replaced' : ''} ${i === qIndex ? 'current' : ''}`}
                                    onClick={() => { trackerRef.current?.resetQuestion(); setQIndex(i); }}>
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="ep-sidebar">
                        <TimerWidget duration={exam.duration} onExpire={handleSubmit} t={t} />

                        <div className="ep-widget">
                            <div className="ep-widget-label">📸 Camera Monitor</div>
                            <CameraMonitor onMetrics={handleCameraMetrics} />
                        </div>

                        <div className="ep-widget">
                            <div className="ep-widget-label">🧠 Behavior Risk</div>
                            <div className="ep-risk-val" style={{ color: riskColor }}>{riskPct}%</div>
                            <div className="ep-risk-bar-bg">
                                <div className="ep-risk-bar-fill" style={{ width: `${riskPct}%`, background: riskColor }} />
                            </div>
                            <div className="ep-risk-labels">
                                <span style={{ fontSize: 11, color: t.textSub }}>Low</span>
                                <span style={{ fontSize: 11, color: t.textSub }}>High</span>
                            </div>
                        </div>

                        <div className="ep-widget" style={{ textAlign: 'center' }}>
                            <div className="ep-widget-label">📊 Progress</div>
                            <div className="ep-prog-big">{answeredCount} / {questions.length}</div>
                            <div className="ep-prog-sub">questions answered</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// Internal timer so it re-renders independently without polluting theme
function TimerWidget({ duration, onExpire, t }) {
    const total = duration * 60;
    const [seconds, setSeconds] = useState(total);

    useEffect(() => {
        if (seconds <= 0) { onExpire?.(); return; }
        const id = setInterval(() => setSeconds(s => s - 1), 1000);
        return () => clearInterval(id);
    }, [seconds]);

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const pad = n => String(n).padStart(2, '0');
    const pct = (seconds / total) * 100;
    const warning = seconds <= 300;
    const danger = seconds <= 60;
    const color = danger ? '#ef4444' : warning ? '#f59e0b' : t.accent;

    return (
        <div className="ep-widget" style={{ textAlign: 'center' }}>
            <div className="ep-widget-label">⏱ Time Remaining</div>
            <div className={`ep-timer-display ${danger ? 'danger' : warning ? 'warning' : ''}`} style={{ color }}>
                {pad(mins)}:{pad(secs)}
            </div>
            <div className="ep-progress-bar-bg">
                <div className="ep-progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
        </div>
    );
}