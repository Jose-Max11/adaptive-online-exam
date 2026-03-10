/**
 * seedData.js
 * Run with: node database/seedData.js
 * Seeds: default admin, sample students, sample exam, and a rich question bank
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const Admin = require('../backend/models/Admin');
const Student = require('../backend/models/Student');
const Exam = require('../backend/models/Exam');
const Question = require('../backend/models/Question');

const QUESTIONS = [
    // ── Algebra / MCQ ───────────────────────────────────────────────────────
    { question_text: 'What is the value of x in 2x + 4 = 10?', options: ['1', '2', '3', '4'], correct_answer: '3', topic: 'Mathematics', concept: 'Algebra', difficulty: 'easy', structure_type: 'mcq', marks: 1 },
    { question_text: 'If y = 3x − 2 and x = 4, what is y?', options: ['8', '10', '12', '14'], correct_answer: '10', topic: 'Mathematics', concept: 'Algebra', difficulty: 'easy', structure_type: 'true_false', marks: 1 },
    { question_text: 'Solve for x: x² − 5x + 6 = 0', options: ['x=2,3', 'x=1,6', 'x=−2,3', 'x=3,4'], correct_answer: 'x=2,3', topic: 'Mathematics', concept: 'Algebra', difficulty: 'medium', structure_type: 'mcq', marks: 2 },
    { question_text: 'Identify the type of equation: 3x + 7 = 0', options: ['Linear', 'Quadratic', 'Cubic', 'Exponential'], correct_answer: 'Linear', topic: 'Mathematics', concept: 'Algebra', difficulty: 'easy', structure_type: 'scenario', marks: 1 },

    // ── Calculus / MCQ ──────────────────────────────────────────────────────
    { question_text: 'What is the derivative of f(x) = x³?', options: ['3x²', 'x²', '3x', '2x²'], correct_answer: '3x²', topic: 'Mathematics', concept: 'Calculus', difficulty: 'medium', structure_type: 'mcq', marks: 2 },
    { question_text: 'Find the integral of 2x dx.', options: ['x²+C', '2x²+C', 'x+C', '2+C'], correct_answer: 'x²+C', topic: 'Mathematics', concept: 'Calculus', difficulty: 'medium', structure_type: 'scenario', marks: 2 },
    { question_text: 'What does the second derivative represent graphically?', options: ['Concavity', 'Slope', 'Area', 'Speed'], correct_answer: 'Concavity', topic: 'Mathematics', concept: 'Calculus', difficulty: 'hard', structure_type: 'mcq', marks: 3 },

    // ── OOP / MCQ ────────────────────────────────────────────────────────────
    { question_text: 'Which OOP concept allows a class to inherit properties from another?', options: ['Encapsulation', 'Polymorphism', 'Inheritance', 'Abstraction'], correct_answer: 'Inheritance', topic: 'Computer Science', concept: 'OOP', difficulty: 'easy', structure_type: 'mcq', marks: 1 },
    { question_text: 'True or False: In Python, a class method must always accept self as the first parameter.', options: ['True', 'False'], correct_answer: 'True', topic: 'Computer Science', concept: 'OOP', difficulty: 'easy', structure_type: 'true_false', marks: 1 },
    { question_text: 'A company payroll system needs to calculate salary differently for full-time and part-time employees sharing a common base class. Which OOP principle best applies?', options: ['Encapsulation', 'Polymorphism', 'Composition', 'Abstraction'], correct_answer: 'Polymorphism', topic: 'Computer Science', concept: 'OOP', difficulty: 'medium', structure_type: 'scenario', marks: 2 },

    // ── Data Structures / MCQ ────────────────────────────────────────────────
    { question_text: 'Which data structure uses LIFO order?', options: ['Queue', 'Stack', 'Tree', 'Graph'], correct_answer: 'Stack', topic: 'Computer Science', concept: 'Data Structures', difficulty: 'easy', structure_type: 'mcq', marks: 1 },
    { question_text: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correct_answer: 'O(log n)', topic: 'Computer Science', concept: 'Data Structures', difficulty: 'medium', structure_type: 'mcq', marks: 2 },
    { question_text: 'An e-commerce site must process orders in the order they arrive. Which data structure is most suitable?', options: ['Stack', 'Queue', 'Heap', 'Linked List'], correct_answer: 'Queue', topic: 'Computer Science', concept: 'Data Structures', difficulty: 'medium', structure_type: 'scenario', marks: 2 },

    // ── Networking ───────────────────────────────────────────────────────────
    { question_text: 'Which protocol is used to send emails?', options: ['HTTP', 'FTP', 'SMTP', 'DNS'], correct_answer: 'SMTP', topic: 'Networking', concept: 'Protocols', difficulty: 'easy', structure_type: 'mcq', marks: 1 },
    { question_text: 'True or False: UDP provides guaranteed delivery of packets.', options: ['True', 'False'], correct_answer: 'False', topic: 'Networking', concept: 'Protocols', difficulty: 'easy', structure_type: 'true_false', marks: 1 },
    { question_text: 'A hospital requires that patient records be transmitted with zero data loss. Which transport protocol should they choose?', options: ['UDP', 'TCP', 'ICMP', 'ARP'], correct_answer: 'TCP', topic: 'Networking', concept: 'Protocols', difficulty: 'medium', structure_type: 'scenario', marks: 2 },
];

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    // Admin
    const adminExists = await Admin.findOne({ username: 'admin' });
    if (!adminExists) {
        await Admin.create({ username: 'admin', password: 'admin123' });
        console.log('✔ Admin created: admin / admin123');
    } else {
        console.log('ℹ Admin already exists.');
    }

    // Students
    const studentsData = [
        { name: 'Alice Johnson', email: 'alice@exam.com', password: 'student123' },
        { name: 'Bob Smith', email: 'bob@exam.com', password: 'student123' },
        { name: 'Carol Davis', email: 'carol@exam.com', password: 'student123' },
    ];
    const createdStudents = [];
    for (const s of studentsData) {
        const exists = await Student.findOne({ email: s.email });
        if (!exists) {
            const student = await Student.create(s);
            createdStudents.push(student);
            console.log(`✔ Student: ${s.name} (${s.email} / student123)`);
        } else {
            createdStudents.push(exists);
        }
    }

    // Questions
    await Question.deleteMany({});
    const insertedQs = await Question.insertMany(QUESTIONS);
    console.log(`✔ ${insertedQs.length} questions uploaded.`);

    // Exam
    const examExists = await Exam.findOne({ title: 'Sample Adaptive Exam' });
    if (!examExists) {
        const exam = await Exam.create({
            title: 'Sample Adaptive Exam',
            duration: 30,
            total_questions: 10,
            difficulty_distribution: { easy: 5, medium: 4, hard: 1 },
            questions: insertedQs.map(q => q._id),
            assigned_students: createdStudents.map(s => s._id),
        });
        for (const student of createdStudents) {
            await Student.findByIdAndUpdate(student._id, { $addToSet: { assigned_exams: exam._id } });
        }
        console.log(`✔ Exam created and assigned to all sample students.`);
    } else {
        console.log('ℹ Sample exam already exists.');
    }

    console.log('\n🎉 Seeding complete!');
    process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
