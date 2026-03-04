// server/src/controllers/sessionController.js
const Session = require('../models/Session');
const User = require('../models/User');
const Chat = require('../models/Chat');
const { getIo } = require('../websocket');

// Helper: Determine Teacher/Learner roles from DB chat
const determineRoles = async (chatId, userId) => {
    const chat = await Chat.findOne({ chatId, status: 'active' });

    if (!chat) {
        throw new Error('Chat is not active or does not exist.');
    }

    const requester = chat.requester.toString();
    const learnerId = userId.toString();
    const teacherId = chat.participants.find(p => p.toString() !== learnerId)?.toString();

    if (!teacherId) {
        throw new Error('Partner not found in chat participants.');
    }

    return { learnerId, teacherId, chat };
};

// Helper: Update reputation and credits after session
const updateReputationAndCredits = async (session) => {
    const { teacher, learner, isBarter } = session;

    await User.findByIdAndUpdate(teacher, { $inc: { teachingCount: 1, creditBalance: 1 } });
    await User.findByIdAndUpdate(learner, { $inc: { learningCount: 1 } });

    if (isBarter) {
        await User.findByIdAndUpdate(learner, { $inc: { creditBalance: 0.5 } });
    }

    if (session.feedback && session.feedback.rating) {
        const teacherUser = await User.findById(teacher);
        const newRatingCount = teacherUser.ratingCount + 1;
        const currentTotal = teacherUser.averageRating * teacherUser.ratingCount;
        const newAverage = (currentTotal + session.feedback.rating) / newRatingCount;

        await User.findByIdAndUpdate(teacher, {
            averageRating: newAverage,
            ratingCount: newRatingCount,
        });
    }
};


// 1. POST /chat/schedule
exports.scheduleSession = async (req, res) => {
    const { chatId, scheduledAt, isBarter } = req.body;
    const userId = req.user.id;
    const io = getIo();

    try {
        const { learnerId, teacherId } = await determineRoles(chatId, userId);

        // Credit check for one-sided learning
        if (!isBarter) {
            const learnerUser = await User.findById(learnerId).select('creditBalance');
            if (!learnerUser || learnerUser.creditBalance < 1) {
                return res.status(403).json({ message: 'Insufficient skill credits for one-sided learning.' });
            }
            await User.findByIdAndUpdate(learnerId, { $inc: { creditBalance: -1 } });
        }

        const newSession = await Session.create({
            chatId,
            learner: learnerId,
            teacher: teacherId,
            skill: 'General Skill Exchange',
            scheduledAt: new Date(scheduledAt),
            isBarter,
            status: 'scheduled',
        });

        const learnerUser = await User.findById(learnerId).select('name');

        io.to(teacherId).emit('newSessionRequest', {
            sessionId: newSession._id,
            chatId,
            partnerId: learnerId,
            message: `New session proposed by ${learnerUser.name} for ${new Date(scheduledAt).toLocaleString()}.`,
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
        // Verify chat exists and user is participant
        const chat = await Chat.findOne({ chatId });
        if (!chat) return res.status(404).json({ message: 'Chat not found.' });

        const isParticipant = chat.participants.some(p => p.toString() === userId.toString());
        if (!isParticipant) return res.status(403).json({ message: 'Not authorized.' });

        const session = await Session.findOne({
            chatId,
            status: { $in: ['scheduled', 'in_progress'] },
        })
        .populate('teacher', 'name')
        .populate('learner', 'name');

        if (!session) return res.status(404).json({ message: 'No active session found for this chat.' });

        res.status(200).json(session);
    } catch (error) {
        console.error('Error in getActiveSessionForChat:', error);
        res.status(500).json({ message: 'Server error.' });
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

        if (!session.markedCompletedBy.includes(userId)) {
            session.markedCompletedBy.push(userId);
            await session.save();
        }

        if (session.markedCompletedBy.length === 2) {
            session.status = 'completed';
            await session.save();

            [session.teacher.toString(), session.learner.toString()].forEach(id => {
                io.to(id).emit('sessionFinalized', {
                    sessionId: session._id,
                    message: 'Session finalized! Please submit feedback to earn rewards.',
                });
            });

            return res.status(200).json({ message: 'Session finalized! Please submit feedback.' });
        }

        res.status(200).json({ message: 'Marked complete. Waiting for partner confirmation.' });
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

        if (session.learner.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Only learners can provide feedback.' });
        }

        if (session.status !== 'completed') {
            return res.status(400).json({ message: 'Session must be completed before submitting feedback.' });
        }

        session.feedback = { rating, comment };
        session.status = 'rated';
        await session.save();

        await updateReputationAndCredits(session);

        [session.teacher.toString(), session.learner.toString()].forEach(id => {
            io.to(id).emit('reputationUpdated', {
                message: 'Your session rewards have been applied!',
            });
        });

        res.status(200).json({ message: 'Feedback submitted. Reputation and credits updated.' });
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
            status: { $in: ['completed', 'rated', 'canceled'] },
        })
        .populate('teacher', 'name')
        .populate('learner', 'name')
        .sort({ scheduledAt: -1 });

        res.status(200).json(sessions);
    } catch (error) {
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
            scheduledAt: { $gt: new Date() },
        })
            .populate('teacher', 'name')
            .populate('learner', 'name')
            .sort({ scheduledAt: 1 });

        // ✅ Convert into user-friendly response
        const formattedSessions = sessions.map(session => {

            const isTeacher =
                session.teacher._id.toString() === userId.toString();

            const partnerUser = isTeacher
                ? session.learner
                : session.teacher;

            return {
                _id: session._id,
                skill: session.skill,
                scheduledAt: session.scheduledAt,
                chatId: session.chatId,

                // ✅ IMPORTANT — frontend will use these only
                myRole: isTeacher ? 'Teacher' : 'Learner',

                partner: {
                    _id: partnerUser._id,
                    name: partnerUser.name
                }
            };
        });

        res.status(200).json(formattedSessions);

    } catch (error) {
        console.error('Error fetching upcoming sessions:', error);
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

        // Refund credit if one-sided
        if (!session.isBarter) {
            await User.findByIdAndUpdate(session.learner._id, { $inc: { creditBalance: 1 } });
        }

        session.status = 'canceled';
        await session.save();

        const partnerId = session.teacher._id.toString() === userId
            ? session.learner._id.toString()
            : session.teacher._id.toString();

        io.to(partnerId).emit('sessionCanceled', {
            sessionId: session._id,
            message: `Session for ${session.skill} has been cancelled by your partner.`,
        });

        res.status(200).json({ message: 'Session successfully cancelled.' });
    } catch (error) {
        console.error('Error in cancelSession:', error);
        res.status(500).json({ message: error.message });
    }
};