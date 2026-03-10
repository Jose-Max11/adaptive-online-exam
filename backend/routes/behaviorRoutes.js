const express = require('express');
const router = express.Router();
const { logBehavior, getBehaviorLogs, getAllBehaviorLogs } = require('../controllers/behaviorController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', logBehavior);
router.get('/all', adminOnly, getAllBehaviorLogs);
router.get('/:studentId/:examId', getBehaviorLogs);

module.exports = router;
