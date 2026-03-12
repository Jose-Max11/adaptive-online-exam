import axios from 'axios';

const BASE = '/api';

const getToken = () => localStorage.getItem('token');

const authHeaders = () => ({
    headers: { Authorization: `Bearer ${getToken()}` },
});

// ── AUTH ──────────────────────────────────────────────────────────────────
export const adminLogin   = (data) => axios.post(`${BASE}/auth/admin/login`,   data);
export const studentLogin = (data) => axios.post(`${BASE}/auth/student/login`, data);

// ── STUDENTS ──────────────────────────────────────────────────────────────
export const getStudents        = ()         => axios.get   (`${BASE}/students`,              authHeaders());
export const getStudentProfile  = (id)       => axios.get   (`${BASE}/students/${id}`,        authHeaders());
export const createStudent      = (data)     => axios.post  (`${BASE}/students`,       data,  authHeaders());
export const updateStudent      = (id, data) => axios.put   (`${BASE}/students/${id}`, data,  authHeaders());
export const deleteStudent      = (id)       => axios.delete(`${BASE}/students/${id}`,        authHeaders());
export const bulkUploadStudents = (formData) => axios.post  (`${BASE}/students/bulk-upload`, formData, {
    headers: { ...authHeaders().headers },
});

// ── EXAMS ─────────────────────────────────────────────────────────────────
export const getExams        = ()         => axios.get   (`${BASE}/exams`,                    authHeaders());
export const getExam         = (id)       => axios.get   (`${BASE}/exams/${id}`,              authHeaders());
export const createExam      = (data)     => axios.post  (`${BASE}/exams`,             data,  authHeaders());
export const updateExam      = (id, data) => axios.put   (`${BASE}/exams/${id}`,       data,  authHeaders());
export const deleteExam      = (id)       => axios.delete(`${BASE}/exams/${id}`,              authHeaders());
export const assignExam      = (data)     => axios.put   (`${BASE}/exams/assign`,      data,  authHeaders());
export const getStudentExams = (studentId)=> axios.get   (`${BASE}/exams/student/${studentId}`, authHeaders());

// ── QUESTIONS ─────────────────────────────────────────────────────────────
export const getQuestions    = (params) => axios.get   (`${BASE}/questions`,        { ...authHeaders(), params });
export const createQuestion  = (data)   => axios.post  (`${BASE}/questions`,  data,  authHeaders());
export const bulkUploadQ     = (data)   => axios.post  (`${BASE}/questions/bulk`, data, authHeaders());
export const updateQuestion  = (id, d)  => axios.put   (`${BASE}/questions/${id}`, d,  authHeaders());
export const deleteQuestion  = (id)     => axios.delete(`${BASE}/questions/${id}`,     authHeaders());

// ── BEHAVIOR ──────────────────────────────────────────────────────────────
export const logBehavior           = (data)                => axios.post(`${BASE}/behavior`,                        data, authHeaders());
export const getBehaviorLogs       = (studentId, examId)   => axios.get (`${BASE}/behavior/${studentId}/${examId}`,       authHeaders());
export const getAllBehaviorLogs     = ()                    => axios.get (`${BASE}/behavior/all`,                          authHeaders());
export const getStudentBehaviorLogs= (studentId)           => axios.get (`${BASE}/behavior/student/${studentId}`,         authHeaders());

// ── RESULTS ───────────────────────────────────────────────────────────────
export const submitResult    = (data)      => axios.post(`${BASE}/results`,                      data, authHeaders());
export const getResult       = (sid, eid)  => axios.get (`${BASE}/results/${sid}/${eid}`,               authHeaders());
export const getAllResults    = ()          => axios.get (`${BASE}/results/all`,                         authHeaders());
export const getStudentResults=(studentId) => axios.get (`${BASE}/results/student/${studentId}`,        authHeaders());



/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 REQUIRED CHANGES IN ../services/api.js
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add this function:

  export const updateExamQuestions = (examId, data) =>
      api.put(`/exams/${examId}/questions`, data);

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 REQUIRED NEW BACKEND ROUTE (Express example)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// PUT /api/exams/:id/questions
router.put('/:id/questions', protect, adminOnly, async (req, res) => {
    const { questionIds } = req.body;        // array of question _ids
    const exam = await Exam.findByIdAndUpdate(
        req.params.id,
        { questions: questionIds },
        { new: true }
    ).populate('questions');
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    res.json(exam);
});

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 INSTALL SheetJS if not already installed:
    npm install xlsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/