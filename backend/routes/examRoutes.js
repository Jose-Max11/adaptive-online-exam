const express = require('express');
const router = express.Router();
const {
    createExam, getExams, getExam, updateExam, deleteExam, assignExam, getStudentExams,
} = require('../controllers/examController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getExams)
    .post(adminOnly, createExam);

router.put('/assign', adminOnly, assignExam);
router.get('/student/:studentId', getStudentExams);

router.route('/:id')
    .get(getExam)
    .put(adminOnly, updateExam)
    .delete(adminOnly, deleteExam);

module.exports = router;
