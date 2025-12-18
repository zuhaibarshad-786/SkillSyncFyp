// server/src/services/aiActivityTracker.js (NEW)
const User = require('../models/User');
// const emailService = require('./emailService'); // Assuming this handles email sending

/**
 * Monitors users who only learn without contributing (freeloading behavior)[cite: 30].
 * Sends automated reminders to encourage teaching or contributing.
 */
exports.monitorContributionRatio = async () => {
    const minLearningSessions = 3; // Example: After 3 learning sessions without teaching/contribution
    
    const usersToFlag = await User.find({
        // Find users who have learned significantly more than they taught
        $expr: { $gt: ["$learningCount", { $add: ["$teachingCount", minLearningSessions] }] }
    });

    for (const user of usersToFlag) {
        // Calculate the ratio
        const ratio = user.teachingCount / user.learningCount || 0;
        
        if (ratio < 0.5) { 
            console.log(`[AI Tracker] Flagged user: ${user.email}. Ratio: ${ratio.toFixed(2)}`);
            
            // System Message Example [cite: 26, 27, 28, 29]
            const message = `You've learned ${user.learningCount} new skills. Please help others by teaching or contributing to keep your learning balance healthy.`;
            
            // 📢 TODO: Implement logic to issue automated reminders or temporary restrictions [cite: 60]
            // await emailService.sendReminder(user.email, 'Contribution Reminder', message);
        }
    }
    return { flaggedCount: usersToFlag.length };
};