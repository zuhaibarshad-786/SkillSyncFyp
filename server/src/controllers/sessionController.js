// server/src/controllers/sessionController.js
const Session = require('../models/Session');
const User    = require('../models/User');
const Chat    = require('../models/Chat');
const { getIo } = require('../websocket');

// ─── Auto-expire past sessions ────────────────────────────────────────────────
// Grace period: 1 hour after scheduledAt before marking expired.
const autoExpireSessions = async () => {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);
    const result = await Session.updateMany(
        { status: 'scheduled', scheduledAt: { $lt: cutoff } },
        { $set: { status: 'expired' } }
    );
    if (result.modifiedCount > 0)
        console.log(`⏰ Auto-expired ${result.modifiedCount} session(s).`);
};

// ─── Role resolver ────────────────────────────────────────────────────────────
const determineRoles = async (chatId, userId) => {
    // chatId is the composite string "uid1_uid2"; Chat stored participants[] in DB.
    const [id1, id2] = chatId.split('_');
    const chat = await Chat.findOne({
        participants: { $all: [id1, id2] },
        status: 'active',
    });
    if (!chat) throw new Error('Chat is not active or does not exist.');

    const learnerId = userId.toString();
    const teacherId = chat.participants
        .find(p => p.toString() !== learnerId)
        ?.toString();

    if (!teacherId) throw new Error('Partner not found in chat participants.');
    return { learnerId, teacherId, chat };
};

// ─── Credit & reputation updater ──────────────────────────────────────────────
const updateReputationAndCredits = async (session) => {
    const { teacher, learner, isBarter } = session;
    await User.findByIdAndUpdate(teacher, { $inc: { teachingCount: 1, creditBalance: 1 } });
    await User.findByIdAndUpdate(learner, { $inc: { learningCount: 1 } });
    if (isBarter) await User.findByIdAndUpdate(learner, { $inc: { creditBalance: 0.5 } });

    if (session.feedback?.rating) {
        const t = await User.findById(teacher);
        if (t) {
            const newCount = (t.ratingCount || 0) + 1;
            const newAvg   = ((t.averageRating || 0) * (t.ratingCount || 0) + session.feedback.rating) / newCount;
            await User.findByIdAndUpdate(teacher, { averageRating: newAvg, ratingCount: newCount });
        }
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// 1. POST /chat/schedule
// ─────────────────────────────────────────────────────────────────────────────
exports.scheduleSession = async (req, res) => {
    const { chatId, scheduledAt, isBarter } = req.body;
    const userId = req.user.id;
    const io = getIo();

    try {
        // Must be a future date
        const scheduleDate = new Date(scheduledAt);
        if (scheduleDate <= new Date()) {
            return res.status(400).json({ message: 'Scheduled time must be in the future.' });
        }

        const { learnerId, teacherId } = await determineRoles(chatId, userId);

        if (!isBarter) {
            const learnerUser = await User.findById(learnerId).select('creditBalance');
            if (!learnerUser || learnerUser.creditBalance < 1) {
                return res.status(403).json({ message: 'Insufficient skill credits.' });
            }
            await User.findByIdAndUpdate(learnerId, { $inc: { creditBalance: -1 } });
        }

        const newSession = await Session.create({
            chatId,
            learner:     learnerId,
            teacher:     teacherId,
            skill:       'General Skill Exchange',
            scheduledAt: scheduleDate,
            isBarter:    isBarter || false,
            status:      'scheduled',
        });

        const learnerUser = await User.findById(learnerId).select('name');

        io.to(teacherId).emit('newSessionRequest', {
            sessionId: newSession._id,
            chatId,
            partnerId: learnerId,
            message: `New session proposed by ${learnerUser.name} for ${scheduleDate.toLocaleString()}.`,
        });

        res.status(201).json(newSession);
    } catch (error) {
        console.error('scheduleSession error:', error);
        res.status(500).json({ message: error.message });
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /sessions/active/:chatId
// ─────────────────────────────────────────────────────────────────────────────
exports.getActiveSessionForChat = async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user.id;

    try {
        await autoExpireSessions();

        // Find chat by composite ID
        const [id1, id2] = chatId.split('_');
        const chat = await Chat.findOne({ participants: { $all: [id1, id2] } });
        if (!chat) return res.status(404).json({ message: 'Chat not found.' });

        const isParticipant = chat.participants.some(p => p.toString() === userId.toString());
        if (!isParticipant) return res.status(403).json({ message: 'Not authorized.' });

        const session = await Session.findOne({
            chatId,
            status: { $in: ['scheduled', 'in_progress'] },
        })
        .populate('teacher', 'name')
        .populate('learner', 'name')
        .sort({ scheduledAt: -1 });

        if (!session) return res.status(404).json({ message: 'No active session found.' });

        res.status(200).json(session);
    } catch (error) {
        console.error('getActiveSessionForChat error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// 3. GET /sessions/verify/:sessionId
// Used by VideoCallPage to verify the user belongs to this session before joining.
// ─────────────────────────────────────────────────────────────────────────────
exports.verifySession = async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Guard: reject obviously invalid IDs before hitting Mongoose
    if (!sessionId || sessionId === 'undefined' || sessionId.length !== 24) {
        return res.status(400).json({ message: 'Invalid session ID.' });
    }

    try {
        await autoExpireSessions();

        const session = await Session.findById(sessionId)
            .populate('teacher', 'name')
            .populate('learner', 'name');

        if (!session) return res.status(404).json({ message: 'Session not found.' });

        const teacherId = session.teacher._id.toString();
        const learnerId = session.learner._id.toString();
        const uid       = userId.toString();

        if (uid !== teacherId && uid !== learnerId) {
            return res.status(403).json({ message: 'You are not a participant of this session.' });
        }

        if (!['scheduled', 'in_progress'].includes(session.status)) {
            return res.status(400).json({
                message: `Session cannot be called — status is "${session.status}".`,
            });
        }

        const myRole    = uid === teacherId ? 'Teacher' : 'Learner';
        const partnerName = uid === teacherId ? session.learner.name : session.teacher.name;
        const partnerId = uid === teacherId ? learnerId : teacherId;

        res.status(200).json({
            session,
            myRole,
            partnerName,
            partnerId,
        });
    } catch (error) {
        console.error('verifySession error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// 4. POST /sessions/complete/:sessionId
// ─────────────────────────────────────────────────────────────────────────────
exports.markAsCompleted = async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const io = getIo();

    try {
        let session = await Session.findById(sessionId);
        if (!session) return res.status(404).json({ message: 'Session not found.' });

        const isParticipant = [session.learner.toString(), session.teacher.toString()]
            .includes(userId.toString());
        if (!isParticipant) return res.status(403).json({ message: 'Not authorized.' });

        if (!['scheduled', 'in_progress'].includes(session.status)) {
            return res.status(400).json({ message: `Cannot complete session with status: ${session.status}` });
        }

        const alreadyMarked = session.markedCompletedBy.map(id => id.toString());
        if (!alreadyMarked.includes(userId.toString())) {
            session.markedCompletedBy.push(userId);
            await session.save();
        }

        if (session.markedCompletedBy.length >= 2) {
            session.status = 'completed';
            await session.save();

            [session.teacher.toString(), session.learner.toString()].forEach(id => {
                io.to(id).emit('sessionFinalized', {
                    sessionId: session._id,
                    message: 'Session finalized! Please submit your feedback to earn rewards.',
                });
            });

            return res.status(200).json({ message: 'Session finalized! Please submit feedback.' });
        }

        res.status(200).json({ message: 'Marked complete. Waiting for partner confirmation.' });
    } catch (error) {
        console.error('markAsCompleted error:', error);
        res.status(500).json({ message: error.message });
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// 5. POST /sessions/feedback/:sessionId
// ─────────────────────────────────────────────────────────────────────────────
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
        session.status   = 'rated';
        await session.save();

        await updateReputationAndCredits(session);

        [session.teacher.toString(), session.learner.toString()].forEach(id => {
            io.to(id).emit('reputationUpdated', {
                message: 'Your session rewards (credits/reputation) have been applied!',
            });
        });

        res.status(200).json({ message: 'Feedback submitted. Reputation and credits updated.' });
    } catch (error) {
        console.error('submitFeedback error:', error);
        res.status(500).json({ message: error.message });
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// 6. GET /sessions/history
// ─────────────────────────────────────────────────────────────────────────────
exports.getSessionHistory = async (req, res) => {
    const userId = req.user.id;
    try {
        await autoExpireSessions();
        const sessions = await Session.find({
            $or: [{ teacher: userId }, { learner: userId }],
            status: { $in: ['completed', 'rated', 'canceled', 'expired'] },
        })
        .populate('teacher', 'name')
        .populate('learner', 'name')
        .sort({ scheduledAt: -1 });

        res.status(200).json(sessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// 7. GET /sessions/upcoming
// ─────────────────────────────────────────────────────────────────────────────
exports.getUpcomingSessions = async (req, res) => {
    const userId = req.user.id;
    try {
        await autoExpireSessions();
        const sessions = await Session.find({
            $or: [{ teacher: userId }, { learner: userId }],
            status: 'scheduled',
            scheduledAt: { $gt: new Date() },
        })
        .populate('teacher', 'name')
        .populate('learner', 'name')
        .sort({ scheduledAt: 1 });

        const formatted = sessions.map(session => {
            const isTeacher = session.teacher._id.toString() === userId.toString();
            const partner   = isTeacher ? session.learner : session.teacher;
            return {
                _id:         session._id,
                skill:       session.skill,
                scheduledAt: session.scheduledAt,
                chatId:      session.chatId,
                status:      session.status,
                isBarter:    session.isBarter,
                myRole:      isTeacher ? 'Teacher' : 'Learner',
                partner:     { _id: partner._id, name: partner.name },
            };
        });

        res.status(200).json(formatted);
    } catch (error) {
        console.error('getUpcomingSessions error:', error);
        res.status(500).json({ message: error.message });
    }
};


// ─────────────────────────────────────────────────────────────────────────────
// 8. POST /sessions/cancel/:sessionId
// ─────────────────────────────────────────────────────────────────────────────
exports.cancelSession = async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const io = getIo();

    try {
        const session = await Session.findById(sessionId).populate('teacher learner');
        if (!session) return res.status(404).json({ message: 'Session not found.' });

        const isParticipant = [session.learner._id.toString(), session.teacher._id.toString()]
            .includes(userId.toString());
        if (!isParticipant) return res.status(403).json({ message: 'Not authorized.' });

        if (session.status !== 'scheduled') {
            return res.status(400).json({ message: 'Only scheduled sessions can be cancelled.' });
        }

        if (!session.isBarter) {
            await User.findByIdAndUpdate(session.learner._id, { $inc: { creditBalance: 1 } });
        }

        session.status = 'canceled';
        await session.save();

        const partnerId = session.teacher._id.toString() === userId.toString()
            ? session.learner._id.toString()
            : session.teacher._id.toString();

        io.to(partnerId).emit('sessionCanceled', {
            sessionId: session._id,
            message:   `Session for "${session.skill}" was cancelled by your partner.`,
        });

        res.status(200).json({ message: 'Session successfully cancelled.' });
    } catch (error) {
        console.error('cancelSession error:', error);
        res.status(500).json({ message: error.message });
    }
};