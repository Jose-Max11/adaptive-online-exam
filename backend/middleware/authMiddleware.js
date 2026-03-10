const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;

            if (decoded.role === 'admin') {
                req.admin = await Admin.findById(decoded.id).select('-password');
            } else if (decoded.role === 'student') {
                req.student = await Student.findById(decoded.id).select('-password');
            }
            return next();
        } catch (err) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) return res.status(401).json({ message: 'Not authorized, no token' });
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') return next();
    res.status(403).json({ message: 'Admin access only' });
};

const studentOnly = (req, res, next) => {
    if (req.user && req.user.role === 'student') return next();
    res.status(403).json({ message: 'Student access only' });
};

module.exports = { protect, adminOnly, studentOnly };
