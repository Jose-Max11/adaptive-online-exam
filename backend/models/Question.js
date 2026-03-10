const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    question_text: { type: String, required: true },
    options: [{ type: String }],
    correct_answer: { type: String, required: true },
    topic: { type: String, required: true },
    concept: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    structure_type: { type: String, required: true },  // e.g., 'mcq', 'true_false', 'scenario'
    marks: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('Question', QuestionSchema);
