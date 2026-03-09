const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET all patients
router.get('/', async (req, res) => {
    try {
        const { page = 1, count = 10, search, include_inactive = false } = req.query;
        const offset = (page - 1) * count;
        
        let query = `
            SELECT 
                p.*,
                pr.first_name || ' ' || pr.last_name as primary_provider_name,
                pr.specialization as provider_specialization,
                COUNT(DISTINCT a.id) as total_appointments,
                MAX(a.appointment_date) as last_visit_date
            FROM patients p
            LEFT JOIN providers pr ON p.primary_provider_id = pr.id
            LEFT JOIN appointments a ON p.id = a.patient_id AND a.status = 'completed'
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;
        
        if (!include_inactive || include_inactive === 'false') {
            query += ` AND p.is_active = true`;
        }
        
        if (search) {
            query += ` AND (
                p.first_name ILIKE $${paramIndex} OR 
                p.last_name ILIKE $${paramIndex} OR 
                p.phone ILIKE $${paramIndex} OR 
                p.email ILIKE $${paramIndex}
            )`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        
        query += ` GROUP BY p.id, pr.first_name, pr.last_name, pr.specialization 
                   ORDER BY p.created_at DESC 
                   LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(count, offset);
        
        const result = await pool.query(query, params);
        
        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM patients WHERE 1=1';
        if (!include_inactive || include_inactive === 'false') {
            countQuery += ' AND is_active = true';
        }
        const countResult = await pool.query(countQuery);
        
        res.json({
            statusCode: 200,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                count: parseInt(count),
                total: parseInt(countResult.rows[0].count),
                totalPages: Math.ceil(countResult.rows[0].count / count)
            }
        });
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error fetching patients',
            error: error.message 
        });
    }
});

// GET single patient by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(`
            SELECT 
                p.*,
                pr.first_name || ' ' || pr.last_name as primary_provider_name,
                pr.specialization as provider_specialization,
                pr.phone as provider_phone,
                COUNT(DISTINCT a.id) as total_appointments,
                COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_appointments,
                COUNT(DISTINCT CASE WHEN a.status = 'cancelled' THEN a.id END) as cancelled_appointments,
                MAX(CASE WHEN a.status = 'completed' THEN a.appointment_date END) as last_visit_date,
                MIN(CASE WHEN a.status = 'scheduled' AND a.appointment_date >= CURRENT_DATE 
                    THEN a.appointment_date END) as next_appointment_date
            FROM patients p
            LEFT JOIN providers pr ON p.primary_provider_id = pr.id
            LEFT JOIN appointments a ON p.id = a.patient_id
            WHERE p.id = $1
            GROUP BY p.id, pr.first_name, pr.last_name, pr.specialization, pr.phone
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                statusCode: 404, 
                message: 'Patient not found' 
            });
        }
        
        res.json({
            statusCode: 200,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching patient:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error fetching patient',
            error: error.message 
        });
    }
});

// GET patient appointments
router.get('/:id/appointments', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, limit = 50 } = req.query;
        
        let query = `
            SELECT 
                a.*,
                p.first_name || ' ' || p.last_name as provider_name,
                p.specialization
            FROM appointments a
            JOIN providers p ON a.provider_id = p.id
            WHERE a.patient_id = $1
        `;
        const params = [id];
        let paramIndex = 2;
        
        if (status) {
            query += ` AND a.status = $${paramIndex++}`;
            params.push(status);
        }
        
        query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT $${paramIndex}`;
        params.push(limit);
        
        const result = await pool.query(query, params);
        
        res.json({
            statusCode: 200,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching patient appointments:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error fetching patient appointments',
            error: error.message 
        });
    }
});

// POST create new patient
router.post('/', async (req, res) => {
    try {
        const {
            first_name, last_name, email, phone, date_of_birth, gender,
            address, city, state, zip_code, insurance_provider, insurance_number,
            primary_provider_id, emergency_contact_name, emergency_contact_phone,
            medical_history, allergies
        } = req.body;
        
        if (!first_name || !last_name || !phone) {
            return res.status(400).json({ 
                statusCode: 400, 
                message: 'First name, last name, and phone are required' 
            });
        }
        
        const result = await pool.query(`
            INSERT INTO patients (
                first_name, last_name, email, phone, date_of_birth, gender,
                address, city, state, zip_code, insurance_provider, insurance_number,
                primary_provider_id, emergency_contact_name, emergency_contact_phone,
                medical_history, allergies
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING *
        `, [
            first_name, last_name, email, phone, date_of_birth, gender,
            address, city, state, zip_code, insurance_provider, insurance_number,
            primary_provider_id, emergency_contact_name, emergency_contact_phone,
            medical_history, allergies
        ]);
        
        res.status(201).json({
            statusCode: 201,
            message: 'Patient created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating patient:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error creating patient',
            error: error.message 
        });
    }
});

// PUT update patient
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const fields = req.body;
        
        if (Object.keys(fields).length === 0) {
            return res.status(400).json({ 
                statusCode: 400, 
                message: 'No fields to update' 
            });
        }
        
        const setClauses = [];
        const values = [];
        let paramIndex = 1;

        Object.keys(fields).forEach(key => {
            setClauses.push(`${key} = $${paramIndex++}`);
            values.push(fields[key]);
        });

        values.push(id);

        const result = await pool.query(`
            UPDATE patients 
            SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramIndex}
            RETURNING *
        `, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                statusCode: 404, 
                message: 'Patient not found' 
            });
        }
        
        res.json({
            statusCode: 200,
            message: 'Patient updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error updating patient',
            error: error.message 
        });
    }
});

// DELETE patient (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(`
            UPDATE patients 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                statusCode: 404, 
                message: 'Patient not found' 
            });
        }
        
        res.json({
            statusCode: 200,
            message: 'Patient deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting patient:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error deleting patient',
            error: error.message 
        });
    }
});

module.exports = router;
