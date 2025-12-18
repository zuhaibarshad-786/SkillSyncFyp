// server/src/controllers/sessionController.js (FULLY FIXED - Compatible with Mock Data)
const Session = require('../models/Session');
const User = require('../models/User');
const { getIo } = require('../websocket'); 

// Import the mock chats Map from chatController
const { mockChats } = require('./chatController');

// Helper to determine Teacher/Learner roles from MOCK chat
const determineRoles = async (chatId, userId) => {
    // Get chat from mock data instead of MongoDB
    const chat = mockChats.get(chatId);
    
    if (!chat || chat.status !== 'active') {
        throw new Error('Chat is not active or does not exist.');
    }
    
    // The requester is the one who initiated the connection
    const requester = chat.requester;
    
    // Find the partner who is not the requester
    const partner = chat.participants.find(p => p !== requester);

    if (!partner) {
        throw new Error('Partner not found in chat participants.');
    }
    
    // Determine roles based on who is scheduling
    // The person scheduling is the learner (requesting the session)
    const learnerId = userId;
    // The other person is the teacher
    const teacherId = chat.participants.find(p => p !== userId);
    
    return { learnerId, teacherId, chat, partner };
};

// Helper function to handle reputation and credits
const updateReputationAndCredits = async (session) => {
    const { teacher, learner, isBarter } = session;

    // Update User Counters (Teaching/Learning Ratio)
    await User.findByIdAndUpdate(teacher, { $inc: { teachingCount: 1 } }); 
    await User.findByIdAndUpdate(learner, { $inc: { learningCount: 1 } }); 

    // Credit Assignment
    // Teacher always gets 1 Credit for teaching
    await User.findByIdAndUpdate(teacher, { $inc: { creditBalance: 1 } }); 

    // Learner gets partial credit if it was a FREE Barter
    if (isBarter) { 
        await User.findByIdAndUpdate(learner, { $inc: { creditBalance: 0.5 } }); 
    }
    
    // Update Teacher's Average Rating (only if feedback exists)
    if (session.feedback && session.feedback.rating) {
        const teacherUser = await User.findById(teacher);
        const newRatingCount = teacherUser.ratingCount + 1;
        const currentTotalRating = teacherUser.averageRating * teacherUser.ratingCount;
        const newAverageRating = (currentTotalRating + session.feedback.rating) / newRatingCount;

        await User.findByIdAndUpdate(teacher, {
            averageRating: newAverageRating,
            ratingCount: newRatingCount
        });
    }
};


// 1. POST /chat/schedule
exports.scheduleSession = async (req, res) => {
    const { chatId, scheduledAt, isBarter } = req.body;
    const userId = req.user.id; 
    const io = getIo();

    try {
        const { learnerId, teacherId, chat } = await determineRoles(chatId, userId);
        
        // CREDIT CHECK & CONSUMPTION (For One-Sided Learning)
        if (!isBarter) {
            const learnerUser = await User.findById(learnerId).select('creditBalance');
            if (learnerUser.creditBalance < 1) {
                return res.status(403).json({ message: 'Insufficient skill credits for one-sided learning.' });
            }
            // Consume credit upon scheduling
            await User.findByIdAndUpdate(learnerId, { $inc: { creditBalance: -1 } }); 
            console.log(`1 credit consumed from learner ${learnerId} for scheduling.`);
        }

        // Check if a session already exists for this chat
        const existingSession = await Session.findOne({ 
            chatId: chatId, // Store composite chatId directly
            status: { $in: ['scheduled', 'in_progress', 'completed'] }
        });
        
        if (existingSession) {
            return res.status(400).json({ message: 'Session already scheduled or completed for this chat.' });
        }

        // Create the new session with composite chatId
        const newSession = await Session.create({
            chatId: chatId, // Store the composite chatId (e.g., "user1_user2")
            learner: learnerId,
            teacher: teacherId,
            skill: "General Skill Exchange", // Replace with actual skill from Match/Listing
            scheduledAt: new Date(scheduledAt),
            isBarter: isBarter,
            status: 'scheduled'
        });

        // Populate teacher info for notification
        const teacherUser = await User.findById(teacherId).select('name');
        const learnerUser = await User.findById(learnerId).select('name');

        // NOTIFICATION: Notify the Teacher via Socket.IO
        io.to(teacherId).emit('newSessionRequest', {
            sessionId: newSession._id,
            chatId: chatId,
            partnerId: learnerId,
            message: `New session proposed by ${learnerUser.name} for ${new Date(scheduledAt).toLocaleString()}.`
        });

        res.status(201).json(newSession);
    } catch (error) {
        console.error('Error in scheduleSession:', error);
        res.status(500).json({ message: error.message });
    }
};

// 2. GET /sessions/active/:chatId 
exports.getActiveSessionForChat = async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user.id;

    try {
        console.log(`Fetching active session for chatId: ${chatId}, userId: ${userId}`);
        
        // Check if chat exists in mock data
        const chat = mockChats.get(chatId);
        
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found.' });
        }
        
        // Authorization check - ensure user is a participant
        if (!chat.participants.includes(userId.toString())) {
            return res.status(403).json({ message: 'Not authorized to view this session.' });
        }

        // Find active session using the composite chatId
        const session = await Session.findOne({ 
            chatId: chatId, // Direct lookup with composite chatId
            status: { $in: ['scheduled', 'in_progress'] } 
        })
        .populate('teacher', 'name')
        .populate('learner', 'name');

        if (!session) {
            return res.status(404).json({ message: 'No active session found for this chat.' });
        }
        
        res.status(200).json(session);
    } catch (error) {
        console.error("Error in getActiveSessionForChat:", error.message, error.stack); 
        res.status(500).json({ message: 'Server error retrieving active session data.' });
    }
};

// 3. POST /sessions/complete/:sessionId
exports.markAsCompleted = async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const io = getIo();

    try {
        let session = await Session.findById(sessionId);
        if (!session) return res.status(404).json({ message: 'Session not found.' });

        const isParticipant = [session.learner.toString(), session.teacher.toString()].includes(userId.toString());
        if (!isParticipant) return res.status(403).json({ message: 'Not authorized.' });

        // Add user to markedCompletedBy array if not already present
        if (!session.markedCompletedBy.includes(userId)) {
            session.markedCompletedBy.push(userId);
            await session.save();
        }

        // Check if both participants have marked it completed
        if (session.markedCompletedBy.length === 2) {
            session.status = 'completed';
            await session.save();
            
            // NOTIFICATION: Notify both users to submit feedback
            const teacherId = session.teacher.toString();
            const learnerId = session.learner.toString();

            [teacherId, learnerId].forEach(id => {
                io.to(id).emit('sessionFinalized', {
                    sessionId: session._id,
                    message: 'Session finalized! Please submit your feedback to earn rewards and finalize reputation.'
                });
            });
            
            return res.status(200).json({ message: 'Session finalized! Both users confirmed completion. Please submit feedback to finalize rewards.' });
        }

        res.status(200).json({ message: 'Session marked as complete. Waiting for partner confirmation.' });

    } catch (error) {
        console.error('Error in markAsCompleted:', error);
        res.status(500).json({ message: error.message });
    }
};

// 4. POST /sessions/feedback/:sessionId
exports.submitFeedback = async (req, res) => {
    const { sessionId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id; 
    const io = getIo();

    try {
        let session = await Session.findById(sessionId);
        if (!session) return res.status(404).json({ message: 'Session not found.' });
        
        // Only learners can rate teachers
        if (session.learner.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Only learners can provide feedback on teachers.' });
        }
        
        if (session.status !== 'completed') {
            return res.status(400).json({ message: 'Session must be marked as completed before submitting feedback.' });
        }
        
        session.feedback = { rating, comment };
        session.status = 'rated';
        await session.save();

        // CRITICAL: REPUTATION AND CREDIT UPDATE
        await updateReputationAndCredits(session);
        
        // NOTIFICATION: Notify both users
        const teacherId = session.teacher.toString();
        const learnerId = session.learner.toString();

        [teacherId, learnerId].forEach(id => {
            io.to(id).emit('reputationUpdated', {
                message: 'Your session rewards (credits/reputation) have been applied!'
            });
        });

        res.status(200).json({ message: 'Feedback submitted successfully. Reputation and credits updated.' });
    } catch (error) {
        console.error('Error in submitFeedback:', error);
        res.status(500).json({ message: error.message });
    }
};

// 5. GET /sessions/history
exports.getSessionHistory = async (req, res) => {
    const userId = req.user.id;
    try {
        const sessions = await Session.find({
            $or: [{ teacher: userId }, { learner: userId }],
            status: { $in: ['completed', 'rated', 'canceled'] }
        })
        .populate('teacher', 'name')
        .populate('learner', 'name')
        .sort({ scheduledAt: -1 });

        res.status(200).json(sessions);
    } catch (error) {
        console.error('Error in getSessionHistory:', error);
        res.status(500).json({ message: error.message });
    }
};

// 6. GET /sessions/upcoming
exports.getUpcomingSessions = async (req, res) => {
    const userId = req.user.id;
    try {
        const sessions = await Session.find({
            $or: [{ teacher: userId }, { learner: userId }],
            status: 'scheduled',
            scheduledAt: { $gt: new Date() }
        })
        .populate('teacher', 'name')
        .populate('learner', 'name')
        .sort({ scheduledAt: 1 });

        res.status(200).json(sessions);
    } catch (error) {
        console.error('Error in getUpcomingSessions:', error);
        res.status(500).json({ message: error.message });
    }
};

// 7. POST /sessions/cancel/:sessionId
exports.cancelSession = async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const io = getIo();

    try {
        const session = await Session.findById(sessionId).populate('teacher learner');
        if (!session) return res.status(404).json({ message: 'Session not found.' });

        const isParticipant = [session.learner._id.toString(), session.teacher._id.toString()].includes(userId.toString());
        if (!isParticipant) return res.status(403).json({ message: 'Not authorized.' });

        if (session.status !== 'scheduled') {
            return res.status(400).json({ message: 'Only scheduled sessions can be cancelled.' });
        }
        
        // If credit was consumed and session is canceled, refund it
        if (!session.isBarter) {
            await User.findByIdAndUpdate(session.learner._id, { $inc: { creditBalance: 1 } });
            console.log(`1 credit refunded to learner ${session.learner._id} due to cancellation.`);
        }
        
        // Mark session as cancelled
        session.status = 'canceled';
        await session.save();
        
        // NOTIFICATION: Notify the partner
        const partnerId = (session.teacher._id.toString() === userId) ? session.learner._id.toString() : session.teacher._id.toString();

        io.to(partnerId).emit('sessionCanceled', {
            sessionId: session._id,
            message: `Session for ${session.skill} has been cancelled by your partner.`
        });

        res.status(200).json({ message: 'Session successfully cancelled.' });
    } catch (error) {
        console.error('Error in cancelSession:', error);
        res.status(500).json({ message: error.message });
    }
};