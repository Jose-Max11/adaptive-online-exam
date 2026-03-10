const Result = require('../models/Result');
const Question = require('../models/Question');
const BehaviorLog = require('../models/BehaviorLog');

// @desc  Submit exam and calculate result
exports.submitResult = async (req, res) => {
    try {
        const { student_id, exam_id, answers } = req.body;
        // answers: [{ question_id, selected_option }]

        let score = 0;
        let total_marks = 0;
        const processedAnswers = [];

        for (const ans of answers) {
            const question = await Question.findById(ans.question_id);
            if (!question) continue;
            const is_correct = question.correct_answer === ans.selected_option;
            const marks_awarded = is_correct ? question.marks : 0;
            score += marks_awarded;
            total_marks += question.marks;
            processedAnswers.push({ question_id: ans.question_id, selected_option: ans.selected_option, is_correct, marks_awarded });
        }

        // Behavior risk summary
        const logs = await BehaviorLog.find({ student_id, exam_id });
        const riskScores = logs.map(l => l.riskScore);
        const average_risk = riskScores.length ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length : 0;
        const max_risk = riskScores.length ? Math.max(...riskScores) : 0;
        const RISK_THRESHOLD = parseFloat(process.env.RISK_THRESHOLD) || 0.6;
        const flagged_count = riskScores.filter(r => r >= RISK_THRESHOLD).length;

        const result = await Result.create({
            student_id, exam_id,
            score, total_marks,
            answers: processedAnswers,
            behaviorRiskSummary: { average_risk, max_risk, flagged_count },
        });

        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get result for a student exam
exports.getResult = async (req, res) => {
    try {
        const result = await Result.findOne({ student_id: req.params.studentId, exam_id: req.params.examId })
            .populate('student_id', 'name email')
            .populate('exam_id', 'title duration')
            .populate('answers.question_id', 'question_text correct_answer');
        if (!result) return res.status(404).json({ message: 'Result not found' });
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get all results (admin)
exports.getAllResults = async (req, res) => {
    try {
        const results = await Result.find()
            .populate('student_id', 'name email')
            .populate('exam_id', 'title')
            .sort({ createdAt: -1 });
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
