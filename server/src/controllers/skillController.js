// server/src/controllers/skillController.js
const Skill = require('../models/Skill');
const asyncHandler = require('express-async-handler');

// @desc    Get all skills
// @route   GET /api/skills
// @access  Public
exports.getSkills = asyncHandler(async (req, res) => {
    const skills = await Skill.find({});
    res.json(skills);
});

// @desc    Create a new skill (Admin function)
// @route   POST /api/skills
// @access  Private (Admin only)
exports.createSkill = asyncHandler(async (req, res) => {
    const { name, category } = req.body;

    const skillExists = await Skill.findOne({ name });
    if (skillExists) {
        res.status(400);
        throw new Error('Skill already exists');
    }

    const skill = await Skill.create({ name, category });
    res.status(201).json(skill);
});

// @desc    Search skills by name
// @route   GET /api/skills/search?q=query
// @access  Public
exports.searchSkills = asyncHandler(async (req, res) => {
    const keyword = req.query.q ? {
        name: {
            $regex: req.query.q,
            $options: 'i', // Case-insensitive
        },
    } : {};

    const skills = await Skill.find(keyword).limit(10);
    res.json(skills);
});