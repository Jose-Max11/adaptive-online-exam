const BehaviorLog = require('../models/BehaviorLog');
const riskEngine = require('../services/riskEngine');
const adaptiveQuestionEngine = require('../services/adaptiveQuestionEngine');

// @desc  Log behavior data and trigger adaptive engine
exports.logBehavior = async (req, res) => {
    try {
        const { student_id, exam_id, question_id, eyeDeviation, headMovement, mouseIdleTime, responseTime } = req.body;

        // Call ML service for risk score
        const riskScore = await riskEngine.getRiskScore({
            eyeDeviation, headMovement, mouseIdleTime, responseTime,
        });

        // Save behavior log
        const log = await BehaviorLog.create({
            student_id, exam_id, question_id,
            eyeDeviation, headMovement, mouseIdleTime, responseTime,
            riskScore,
        });

        // Adaptive question replacement if risk is high
        let adaptiveQuestion = null;
        const RISK_THRESHOLD = parseFloat(process.env.RISK_THRESHOLD) || 0.6;
        if (riskScore >= RISK_THRESHOLD) {
            adaptiveQuestion = await adaptiveQuestionEngine.getAlternativeQuestion(question_id);
        }

        res.json({ log, riskScore, adaptiveQuestion });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get behavior logs for a student exam
exports.getBehaviorLogs = async (req, res) => {
    try {
        const { studentId, examId } = req.params;
        const logs = await BehaviorLog.find({ student_id: studentId, exam_id: examId })
            .populate('question_id', 'question_text');
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get all behavior logs (admin)
exports.getAllBehaviorLogs = async (req, res) => {
    try {
        const logs = await BehaviorLog.find()
            .populate('student_id', 'name email')
            .populate('exam_id', 'title')
            .populate('question_id', 'question_text')
            .sort({ timestamp: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
