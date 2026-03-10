const Exam = require('../models/Exam');
const Student = require('../models/Student');

// @desc  Create exam
exports.createExam = async (req, res) => {
    try {
        const exam = await Exam.create(req.body);
        res.status(201).json(exam);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get all exams
exports.getExams = async (req, res) => {
    try {
        const exams = await Exam.find().populate('questions').populate('assigned_students', 'name email');
        res.json(exams);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get single exam
exports.getExam = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id)
            .populate('questions')
            .populate('assigned_students', 'name email');
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        res.json(exam);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Update exam
exports.updateExam = async (req, res) => {
    try {
        const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        res.json(exam);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Delete exam
exports.deleteExam = async (req, res) => {
    try {
        await Exam.findByIdAndDelete(req.params.id);
        res.json({ message: 'Exam removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Assign exam to students
exports.assignExam = async (req, res) => {
    try {
        const { examId, studentIds } = req.body;
        const exam = await Exam.findById(examId);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        for (const sid of studentIds) {
            await Student.findByIdAndUpdate(sid, { $addToSet: { assigned_exams: examId } });
            exam.assigned_students.addToSet(sid);
        }
        await exam.save();
        res.json({ message: 'Exam assigned successfully', exam });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get exams assigned to a specific student
exports.getStudentExams = async (req, res) => {
    try {
        const student = await Student.findById(req.params.studentId).populate({
            path: 'assigned_exams',
            populate: { path: 'questions' },
        });
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json(student.assigned_exams);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
