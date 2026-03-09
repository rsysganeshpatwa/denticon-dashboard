const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET all locations
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                l.*,
                COUNT(DISTINCT a.patient_id) as total_patients,
                COUNT(DISTINCT p.id) as total_providers
            FROM locations l
            LEFT JOIN providers p ON l.id = p.location_id AND p.is_active = true
            LEFT JOIN appointments a ON p.id = a.provider_id
            WHERE l.is_active = true
            GROUP BY l.id
            ORDER BY l.name
        `);
        
        res.json({
            statusCode: 200,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error fetching locations',
            error: error.message 
        });
    }
});

// GET single location by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM locations WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                statusCode: 404, 
                message: 'Location not found' 
            });
        }
        
        res.json({
            statusCode: 200,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching location:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error fetching location',
            error: error.message 
        });
    }
});

// POST create new location
router.post('/', async (req, res) => {
    try {
        const { name, address, city, state, zip_code, phone, email } = req.body;
        
        if (!name || !city || !state) {
            return res.status(400).json({ 
                statusCode: 400, 
                message: 'Name, city, and state are required' 
            });
        }
        
        const result = await pool.query(`
            INSERT INTO locations (name, address, city, state, zip_code, phone, email)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [name, address, city, state, zip_code, phone, email]);
        
        res.status(201).json({
            statusCode: 201,
            message: 'Location created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating location:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error creating location',
            error: error.message 
        });
    }
});

// PUT update location
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, city, state, zip_code, phone, email, is_active } = req.body;
        
        const result = await pool.query(`
            UPDATE locations 
            SET name = COALESCE($1, name),
                address = COALESCE($2, address),
                city = COALESCE($3, city),
                state = COALESCE($4, state),
                zip_code = COALESCE($5, zip_code),
                phone = COALESCE($6, phone),
                email = COALESCE($7, email),
                is_active = COALESCE($8, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $9
            RETURNING *
        `, [name, address, city, state, zip_code, phone, email, is_active, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                statusCode: 404, 
                message: 'Location not found' 
            });
        }
        
        res.json({
            statusCode: 200,
            message: 'Location updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error updating location',
            error: error.message 
        });
    }
});

// DELETE location (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(`
            UPDATE locations 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                statusCode: 404, 
                message: 'Location not found' 
            });
        }
        
        res.json({
            statusCode: 200,
            message: 'Location deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting location:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error deleting location',
            error: error.message 
        });
    }
});

module.exports = router;
