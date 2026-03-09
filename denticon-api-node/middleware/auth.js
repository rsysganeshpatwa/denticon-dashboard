const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'denticon_jwt_secret_key_2024';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log('=== Token Verification ===');
    console.log('Auth Header:', authHeader);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
        console.log('❌ No token provided');
        return res.status(401).json({
            statusCode: 401,
            message: 'Access denied. No token provided.'
        });
    }

    console.log('Token (first 30 chars):', token.substring(0, 30) + '...');

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Token verified for user:', decoded.username, 'role:', decoded.role);
        req.user = decoded;
        next();
    } catch (error) {
        console.log('❌ Token verification failed:', error.message);
        return res.status(401).json({
            statusCode: 401,
            message: 'Invalid or expired token'
        });
    }
};

// Middleware to check user role
const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                statusCode: 401,
                message: 'Authentication required'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                statusCode: 403,
                message: 'Access denied. Insufficient permissions.'
            });
        }

        next();
    };
};

// Middleware for admin only
const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            statusCode: 403,
            message: 'Access denied. Admin access required.'
        });
    }
    next();
};

// Middleware for provider only
const providerOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'provider') {
        return res.status(403).json({
            statusCode: 403,
            message: 'Access denied. Provider access required.'
        });
    }
    next();
};

// Middleware for admin or provider
const adminOrProvider = (req, res, next) => {
    if (!req.user || !['admin', 'provider'].includes(req.user.role)) {
        return res.status(403).json({
            statusCode: 403,
            message: 'Access denied. Admin or Provider access required.'
        });
    }
    next();
};

// Middleware for admin or front desk
const adminOrFrontDesk = (req, res, next) => {
    if (!req.user || !['admin', 'front_desk'].includes(req.user.role)) {
        return res.status(403).json({
            statusCode: 403,
            message: 'Access denied. Admin or Front Desk access required.'
        });
    }
    next();
};

module.exports = {
    verifyToken,
    checkRole,
    adminOnly,
    providerOnly,
    adminOrProvider,
    adminOrFrontDesk
};
