const mongoose = require('mongoose');

const BehaviorLogSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    exam_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    eyeDeviation: { type: Number, default: 0 },
    headMovement: { type: Number, default: 0 },
    mouseIdleTime: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
    riskScore: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('BehaviorLog', BehaviorLogSchema);
