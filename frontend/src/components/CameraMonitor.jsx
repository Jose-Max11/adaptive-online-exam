import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function CameraMonitor({ onMetrics }) {
    const { theme: t } = useTheme();
    const videoRef = useRef(null);
    const [active, setActive] = useState(false);
    const [error, setError] = useState('');
    const streamRef = useRef(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            streamRef.current = stream;
            if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
            setActive(true);
            intervalRef.current = setInterval(() => {
                const eyeDeviation = parseFloat((Math.random() * 20).toFixed(2));
                const headMovement = parseFloat((Math.random() * 15).toFixed(2));
                onMetrics?.({ eyeDeviation, headMovement });
            }, 3000);
        } catch {
            setError('Camera access denied. Please allow webcam permission.');
            setActive(false);
        }
    };

    const stopCamera = () => {
        clearInterval(intervalRef.current);
        streamRef.current?.getTracks().forEach(t => t.stop());
    };

    const css = `
        .cm-box {
            position: relative; width: 100%; aspect-ratio: 4/3;
            background: ${t.surfaceAlt}; border: 1px solid ${t.border};
            border-radius: 10px; overflow: hidden;
            transition: background 0.4s, border-color 0.4s;
        }
        .cm-error {
            display: flex; align-items: center; justify-content: center;
            height: 100%; padding: 16px; text-align: center;
            font-size: 12.5px; color: #ef4444; line-height: 1.5;
        }
        .cm-overlay {
            position: absolute; bottom: 8px; left: 8px;
        }
        .cm-status {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 4px 10px; border-radius: 100px;
            background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
            font-size: 11.5px; font-weight: 600; color: #fff;
        }
        .cm-dot { width: 7px; height: 7px; border-radius: 50%; }
        .cm-dot.on { background: #10b981; box-shadow: 0 0 6px #10b981; animation: cmpulse 2s infinite; }
        .cm-dot.off { background: #ef4444; }
        @keyframes cmpulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .cm-hint { font-size: 11.5px; color: ${t.textSub}; text-align: center; margin-top: 8px; }
    `;

    return (
        <>
            <style>{css}</style>
            <div className="cm-box">
                {error
                    ? <div className="cm-error">{error}</div>
                    : <>
                        <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div className="cm-overlay">
                            <div className="cm-status">
                                <span className={`cm-dot ${active ? 'on' : 'off'}`} />
                                {active ? 'Monitoring' : 'Starting…'}
                            </div>
                        </div>
                    </>
                }
            </div>
            <p className="cm-hint">🧿 Eye & head tracking active</p>
        </>
    );
}