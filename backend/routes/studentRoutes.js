const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    createStudent, getStudents, getStudent, updateStudent, deleteStudent, bulkUploadStudents,
} = require('../controllers/studentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept any Excel file - be more permissive
        const ext = file.originalname.toLowerCase().split('.').pop();
        if (ext === 'xlsx' || ext === 'xls') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
        }
    }
});

router.use(protect);

router.route('/')
    .get(adminOnly, getStudents)
    .post(adminOnly, createStudent);

// Bulk upload route - with multer error handling
router.route('/bulk-upload')
    .post(adminOnly, (req, res, next) => {
        upload.single('file')(req, res, function(err) {
            if (err) {
                console.error('Multer error:', err);
                return res.status(400).json({ message: err.message || 'File upload error' });
            }
            next();
        });
    }, bulkUploadStudents);

router.route('/:id')
    .get(getStudent)
    .put(adminOnly, updateStudent)
    .delete(adminOnly, deleteStudent);

module.exports = router;
