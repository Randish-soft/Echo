const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    if (err.code === 11000) {
        return res.status(400).json({
            error: 'Duplicate entry',
            message: 'Resource already exists'
        });
    }
    
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            error: 'Validation Error',
            messages: errors
        });
    }
    
    if (err.name === 'CastError') {
        return res.status(400).json({
            error: 'Invalid ID',
            message: 'The provided ID is not valid'
        });
    }
    
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token'
        });
    }
    
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            error: err.message || 'An error occurred',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }
    
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'Something went wrong on the server',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;