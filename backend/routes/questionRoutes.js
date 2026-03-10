const express = require('express');
const router = express.Router();
const {
    addQuestion, bulkUploadQuestions, getQuestions, getQuestion, updateQuestion, deleteQuestion,
} = require('../controllers/questionController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getQuestions)
    .post(adminOnly, addQuestion);

router.post('/bulk', adminOnly, bulkUploadQuestions);

router.route('/:id')
    .get(getQuestion)
    .put(adminOnly, updateQuestion)
    .delete(adminOnly, deleteQuestion);

module.exports = router;
