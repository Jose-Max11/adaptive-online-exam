const express = require('express');
const router = express.Router();
const { submitResult, getResult, getAllResults } = require('../controllers/resultController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', submitResult);
router.get('/all', adminOnly, getAllResults);
router.get('/:studentId/:examId', getResult);

module.exports = router;
