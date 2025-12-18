// server/src/middleware/errorHandler.js
exports.errorHandler = (err, req, res, next) => {
    // Check if the error has a specific status code, otherwise default to 500
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode; 
    res.status(statusCode);
    res.json({
        message: err.message,
        // Only provide stack trace if in development mode
        stack: process.env.NODE_ENV === 'development' ? err.stack : null,
    });
};