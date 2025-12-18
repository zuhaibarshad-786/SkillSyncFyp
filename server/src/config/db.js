// server/src/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        // Mongoose 6+ automatically handles these options, so they can be removed:
        // {
        //     useNewUrlParser: true,
        //     useUnifiedTopology: true,
        // }

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        // Log the URI used for debugging (optional, remove in production)
        console.error(`Attempted URI: ${process.env.MONGO_URI}`);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;