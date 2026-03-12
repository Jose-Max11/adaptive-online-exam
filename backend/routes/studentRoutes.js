const express = require('express');
const router = express.Router();
const Student = require('../models/Student'); // ← must be imported
const {
    getStudents, createStudent, updateStudent,
    deleteStudent, bulkUploadStudents,
} = require('../controllers/studentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

// Admin routes
router.get('/',                     adminOnly, getStudents);
router.post('/',                    adminOnly, createStudent);
router.post('/bulk-upload',         adminOnly, upload.single('file'), bulkUploadStudents);
router.put('/:id',                  adminOnly, updateStudent);
router.delete('/:id',               adminOnly, deleteStudent);

// Student profile — accessible by the student themselves (protect only, no adminOnly)
router.get('/:studentId', async (req, res) => {
    try {
        const student = await Student.findById(req.params.studentId).select('-password');
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json(student);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;