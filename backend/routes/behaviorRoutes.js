const express = require('express');
const router = express.Router();
const BehaviorLog = require('../models/BehaviorLog'); // ← must be imported
const { logBehavior, getBehaviorLogs, getAllBehaviorLogs } = require('../controllers/behaviorController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/',                        logBehavior);
router.get('/all',        adminOnly,    getAllBehaviorLogs);

// ── Student-scoped logs (must come BEFORE /:studentId/:examId) ──
router.get('/student/:studentId', async (req, res) => {
    try {
        const logs = await BehaviorLog.find({ student_id: req.params.studentId })
            .populate('exam_id', 'title')
            .sort({ timestamp: -1 })
            .limit(200);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/:studentId/:examId',       getBehaviorLogs);

module.exports = router;