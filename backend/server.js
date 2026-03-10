const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const Admin = require('./models/Admin');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));
app.use('/api/behavior', require('./routes/behaviorRoutes'));
app.use('/api/results', require('./routes/resultRoutes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

// Seed default admin
const seedAdmin = async () => {
    const count = await Admin.countDocuments();
    if (count === 0) {
        await Admin.create({
            username: process.env.ADMIN_USERNAME || 'admin',
            password: process.env.ADMIN_PASSWORD || 'admin123',
        });
        console.log('Default admin created');
    }
};

const startServer = async () => {
    try {
        await connectDB();      // Wait for MongoDB connection
        await seedAdmin();      // Then seed admin

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () =>
            console.log(`Backend server running on port ${PORT}`)
        );

    } catch (error) {
        console.error(error);
    }
};

startServer();