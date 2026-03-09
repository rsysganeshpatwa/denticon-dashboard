const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'denticon_jwt_secret_key_2024';
const JWT_EXPIRES_IN = '24h';

// Login endpoint - for all user types
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                statusCode: 400,
                message: 'Username and password are required'
            });
        }

        // Find user by username or email
        const result = await pool.query(
            'SELECT * FROM users WHERE (username = $1 OR email = $1) AND is_active = true',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                statusCode: 401,
                message: 'Invalid credentials'
            });
        }

        const user = result.rows[0];

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                statusCode: 401,
                message: 'Invalid credentials'
            });
        }

        // Get provider info if user is a provider
        let providerInfo = null;
        if (user.role === 'provider') {
            const providerResult = await pool.query(
                'SELECT id, first_name, last_name, specialization, location_id FROM providers WHERE user_id = $1',
                [user.id]
            );
            if (providerResult.rows.length > 0) {
                providerInfo = providerResult.rows[0];
            }
        }

        // Update last login
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                providerId: providerInfo?.id || null
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Return user info and token
        res.json({
            statusCode: 200,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    provider: providerInfo
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Login failed',
            error: error.message
        });
    }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                statusCode: 401,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        // Get fresh user data
        const result = await pool.query(
            'SELECT id, username, email, role, is_active FROM users WHERE id = $1',
            [decoded.id]
        );

        if (result.rows.length === 0 || !result.rows[0].is_active) {
            return res.status(401).json({
                statusCode: 401,
                message: 'User not found or inactive'
            });
        }

        const user = result.rows[0];

        // Get provider info if needed
        let providerInfo = null;
        if (user.role === 'provider') {
            const providerResult = await pool.query(
                'SELECT id, first_name, last_name, specialization, location_id FROM providers WHERE user_id = $1',
                [user.id]
            );
            if (providerResult.rows.length > 0) {
                providerInfo = providerResult.rows[0];
            }
        }

        res.json({
            statusCode: 200,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    provider: providerInfo
                }
            }
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({
            statusCode: 401,
            message: 'Invalid or expired token'
        });
    }
});

// Logout endpoint (client-side should remove token)
router.post('/logout', (req, res) => {
    res.json({
        statusCode: 200,
        message: 'Logout successful'
    });
});

// Change password endpoint
router.post('/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                statusCode: 401,
                message: 'Authentication required'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                statusCode: 400,
                message: 'Current password and new password are required'
            });
        }

        // Get user
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                statusCode: 404,
                message: 'User not found'
            });
        }

        const user = result.rows[0];

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                statusCode: 401,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await pool.query(
            'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hashedPassword, decoded.id]
        );

        res.json({
            statusCode: 200,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Failed to change password',
            error: error.message
        });
    }
});

module.exports = router;
