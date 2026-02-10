// server/seedSkills.js
const mongoose = require('mongoose');
const Skill = require('./src/models/Skill'); // Adjust path based on your folder structure
require('dotenv').config(); 

const skills = [
    { name: 'JavaScript', category: 'Technology' },
    { name: 'Python', category: 'Technology' },
    { name: 'React', category: 'Technology' },
    { name: 'Node.js', category: 'Technology' },
    { name: 'MongoDB', category: 'Technology' },
    { name: 'English', category: 'Language' },
    { name: 'French', category: 'Language' },
    { name: 'Spanish', category: 'Language' },
    { name: 'German', category: 'Language' },
    { name: 'Graphic Design', category: 'Arts' },
    { name: 'UI/UX Design', category: 'Arts' },
    { name: 'Photography', category: 'Arts' },
    { name: 'Public Speaking', category: 'Other' },
    { name: 'Project Management', category: 'Finance' },
    { name: 'Data Analysis', category: 'Science' },
    // ... Add more to reach your 50-60 goal
];

const seedDB = async () => {
    try {
        // Connect to your MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for seeding...");

        // Clear existing skills to avoid unique constraint errors during testing
        await Skill.deleteMany({}); 

        // Insert the new list
        await Skill.insertMany(skills);
        console.log(`${skills.length} Skills seeded successfully!`);

        process.exit();
    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
};

seedDB();