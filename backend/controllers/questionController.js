const Question = require('../models/Question');

// @desc  Add single question
exports.addQuestion = async (req, res) => {
    try {
        const question = await Question.create(req.body);
        res.status(201).json(question);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Bulk upload questions
exports.bulkUploadQuestions = async (req, res) => {
    try {
        const questions = await Question.insertMany(req.body.questions);
        res.status(201).json({ count: questions.length, questions });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get all questions (with filters)
exports.getQuestions = async (req, res) => {
    try {
        const { topic, concept, difficulty, structure_type } = req.query;
        const filter = {};
        if (topic) filter.topic = topic;
        if (concept) filter.concept = concept;
        if (difficulty) filter.difficulty = difficulty;
        if (structure_type) filter.structure_type = structure_type;
        const questions = await Question.find(filter);
        res.json(questions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get single question
exports.getQuestion = async (req, res) => {
    try {
        const q = await Question.findById(req.params.id);
        if (!q) return res.status(404).json({ message: 'Question not found' });
        res.json(q);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Update question
exports.updateQuestion = async (req, res) => {
    try {
        const q = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!q) return res.status(404).json({ message: 'Question not found' });
        res.json(q);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Delete question
exports.deleteQuestion = async (req, res) => {
    try {
        await Question.findByIdAndDelete(req.params.id);
        res.json({ message: 'Question removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
