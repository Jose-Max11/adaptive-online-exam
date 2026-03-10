const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
    title: { type: String, required: true },
    duration: { type: Number, required: true },  // in minutes
    total_questions: { type: Number, required: true },
    difficulty_distribution: {
        easy: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        hard: { type: Number, default: 0 },
    },
    assigned_students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
}, { timestamps: true });

module.exports = mongoose.model('Exam', ExamSchema);
