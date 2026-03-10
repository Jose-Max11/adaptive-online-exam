const Question = require('../models/Question');

/**
 * Given a question ID, fetch an alternative question:
 *  - Same concept
 *  - Different structure_type
 *  - Same or lower difficulty
 */
const getAlternativeQuestion = async (currentQuestionId) => {
    try {
        const current = await Question.findById(currentQuestionId);
        if (!current) return null;

        const alternative = await Question.findOne({
            concept: current.concept,
            structure_type: { $ne: current.structure_type },
            difficulty: current.difficulty,
            _id: { $ne: currentQuestionId },
        });

        // If same difficulty not found, try any difficulty
        if (!alternative) {
            return await Question.findOne({
                concept: current.concept,
                structure_type: { $ne: current.structure_type },
                _id: { $ne: currentQuestionId },
            });
        }

        return alternative;
    } catch (error) {
        console.error('Adaptive engine error:', error.message);
        return null;
    }
};

module.exports = { getAlternativeQuestion };
