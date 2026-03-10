const axios = require('axios');

/**
 * Sends behavior features to the Python ML microservice
 * and returns the calculated risk score.
 */
const getRiskScore = async ({ eyeDeviation, headMovement, mouseIdleTime, responseTime }) => {
    try {
        const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
        const response = await axios.post(`${ML_SERVICE_URL}/analyze`, {
            eye_deviation: eyeDeviation,
            head_movement: headMovement,
            mouse_idle_time: mouseIdleTime,
            response_time: responseTime,
        });
        return response.data.risk_score;
    } catch (error) {
        console.error('ML service error:', error.message);
        // Fallback: compute simple heuristic risk score
        const risk = (
            (eyeDeviation > 30 ? 0.3 : 0) +
            (headMovement > 25 ? 0.2 : 0) +
            (mouseIdleTime > 60 ? 0.2 : 0) +
            (responseTime < 5 ? 0.3 : 0)
        );
        return Math.min(risk, 1.0);
    }
};

module.exports = { getRiskScore };
