const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET all appointment requests (with filters)
router.get('/', async (req, res) => {
    try {
        const { status, provider_id, location_id, page = 1, count = 50 } = req.query;
        const offset = (page - 1) * count;
        
        // Query from base table with joins to get location_id
        let query = `
            SELECT 
                ar.id,
                ar.patient_name,
                ar.gender,
                ar.age,
                ar.phone,
                ar.email,
                ar.diagnosis_history,
                ar.reason_for_visit,
                ar.preferred_date,
                ar.preferred_time,
                ar.status,
                ar.submitted_at,
                ar.reviewed_at,
                ar.admin_notes,
                ar.rejection_reason,
                ar.location_id,
                ar.provider_id,
                ar.assigned_provider_id,
                l.name as location_name,
                l.city as location_city,
                p.first_name || ' ' || p.last_name as provider_name,
                p.specialization as provider_specialization,
                ap.first_name || ' ' || ap.last_name as assigned_provider_name,
                ab.first_name || ' ' || ab.last_name as assigned_by_name
            FROM appointment_requests ar
            LEFT JOIN locations l ON ar.location_id = l.id
            LEFT JOIN providers p ON ar.provider_id = p.id
            LEFT JOIN providers ap ON ar.assigned_provider_id = ap.id
            LEFT JOIN providers ab ON ar.assigned_by = ab.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (status && status !== 'all') {
            query += ` AND ar.status = $${paramIndex++}`;
            params.push(status);
        }
        if (provider_id) {
            query += ` AND (ar.provider_id = $${paramIndex} OR ar.assigned_provider_id = $${paramIndex})`;
            params.push(provider_id);
            paramIndex++;
        }
        if (location_id) {
            query += ` AND ar.location_id = $${paramIndex++}`;
            params.push(location_id);
        }

        query += ` ORDER BY ar.submitted_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(count, offset);

        const result = await pool.query(query, params);
        
        // Get total count with same filters
        let countQuery = 'SELECT COUNT(*) FROM appointment_requests WHERE 1=1';
        const countParams = [];
        let countIndex = 1;
        if (status && status !== 'all') {
            countQuery += ` AND status = $${countIndex++}`;
            countParams.push(status);
        }
        if (provider_id) {
            countQuery += ` AND (provider_id = $${countIndex} OR assigned_provider_id = $${countIndex})`;
            countParams.push(provider_id);
            countIndex++;
        }
        if (location_id) {
            countQuery += ` AND location_id = $${countIndex++}`;
            countParams.push(location_id);
        }
        const countResult = await pool.query(countQuery, countParams);
        
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
        console.error('Error fetching appointment requests:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error fetching appointment requests',
            error: error.message 
        });
    }
});

// GET single appointment request by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM vw_appointment_requests_detail WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                statusCode: 404, 
                message: 'Appointment request not found' 
            });
        }
        
        res.json({
            statusCode: 200,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching appointment request:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error fetching appointment request',
            error: error.message 
        });
    }
});

// POST create new appointment request (PUBLIC - no auth required)
router.post('/', async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            patient_name,
            gender,
            age,
            phone,
            email,
            diagnosis_history,
            reason_for_visit,
            location_id,
            provider_id,
            preferred_date,
            preferred_time
        } = req.body;

        // Validate required fields
        if (!patient_name || !gender || !age || !phone || !reason_for_visit || !location_id || !preferred_date || !preferred_time) {
            return res.status(400).json({ 
                statusCode: 400, 
                message: 'Missing required fields: patient_name, gender, age, phone, reason_for_visit, location_id, preferred_date, preferred_time' 
            });
        }

        await client.query('BEGIN');

        // Auto-assign provider if not selected
        let assigned_provider_id = provider_id;
        if (!provider_id) {
            const providerResult = await client.query(`
                SELECT id FROM providers 
                WHERE location_id = $1 AND is_active = true 
                ORDER BY RANDOM() 
                LIMIT 1
            `, [location_id]);
            
            if (providerResult.rows.length > 0) {
                assigned_provider_id = providerResult.rows[0].id;
            } else {
                // If no provider at this location, pick any available
                const anyProvider = await client.query(`
                    SELECT id FROM providers WHERE is_active = true ORDER BY RANDOM() LIMIT 1
                `);
                if (anyProvider.rows.length > 0) {
                    assigned_provider_id = anyProvider.rows[0].id;
                }
            }
        }

        // Insert appointment request
        const result = await client.query(`
            INSERT INTO appointment_requests (
                patient_name, gender, age, phone, email,
                diagnosis_history, reason_for_visit,
                location_id, provider_id, assigned_provider_id,
                preferred_date, preferred_time, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending')
            RETURNING *
        `, [
            patient_name, gender, age, phone, email,
            diagnosis_history, reason_for_visit,
            location_id, provider_id, assigned_provider_id,
            preferred_date, preferred_time
        ]);

        await client.query('COMMIT');

        res.status(201).json({ 
            statusCode: 201, 
            message: 'Appointment request submitted successfully. We will contact you soon!',
            data: result.rows[0] 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating appointment request:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error creating appointment request',
            error: error.message 
        });
    } finally {
        client.release();
    }
});

// PUT approve appointment request
router.put('/:id/approve', async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { assigned_by, admin_notes } = req.body;

        await client.query('BEGIN');

        // Get request details
        const request = await client.query(
            'SELECT * FROM appointment_requests WHERE id = $1',
            [id]
        );

        if (request.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ 
                statusCode: 404, 
                message: 'Appointment request not found' 
            });
        }

        const req_data = request.rows[0];

        if (req_data.status !== 'pending') {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                statusCode: 400, 
                message: 'Only pending requests can be approved' 
            });
        }

        // Check if patient already exists
        let patient_id;
        const existingPatient = await client.query(
            'SELECT id FROM patients WHERE phone = $1 LIMIT 1',
            [req_data.phone]
        );

        if (existingPatient.rows.length > 0) {
            patient_id = existingPatient.rows[0].id;
        } else {
            // Create new patient
            const [firstName, ...lastNameParts] = req_data.patient_name.split(' ');
            const lastName = lastNameParts.join(' ') || firstName;
            
            const newPatient = await client.query(`
                INSERT INTO patients (
                    first_name, last_name, phone, email, 
                    gender, date_of_birth, medical_history,
                    primary_provider_id, is_active
                ) VALUES ($1, $2, $3, $4, $5, 
                    CURRENT_DATE - INTERVAL '1 year' * $6, 
                    $7, $8, true)
                RETURNING id
            `, [
                firstName, 
                lastName, 
                req_data.phone, 
                req_data.email,
                req_data.gender,
                req_data.age,
                req_data.diagnosis_history,
                req_data.assigned_provider_id
            ]);
            
            patient_id = newPatient.rows[0].id;
        }

        // Create actual appointment (using 'scheduled' status - Option B flow)
        const appointment = await client.query(`
            INSERT INTO appointments (
                patient_id, provider_id, appointment_date, appointment_time,
                duration, appointment_type, status, notes, reason, created_by
            ) VALUES ($1, $2, $3, $4, 30, 'consultation', 'scheduled', $5, $6, $7)
            RETURNING *
        `, [
            patient_id,
            req_data.assigned_provider_id,
            req_data.preferred_date,
            req_data.preferred_time,
            admin_notes || req_data.diagnosis_history,
            req_data.reason_for_visit,
            assigned_by
        ]);

        // Update request status
        await client.query(`
            UPDATE appointment_requests 
            SET status = 'approved', 
                reviewed_at = CURRENT_TIMESTAMP,
                assigned_by = $1,
                admin_notes = $2
            WHERE id = $3
        `, [assigned_by, admin_notes, id]);

        await client.query('COMMIT');

        res.json({ 
            statusCode: 200, 
            message: 'Appointment request approved and appointment created successfully',
            data: {
                appointment: appointment.rows[0],
                patient_id: patient_id
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error approving appointment request:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error approving appointment request',
            error: error.message 
        });
    } finally {
        client.release();
    }
});

// PUT reject appointment request
router.put('/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { rejection_reason, assigned_by } = req.body;

        if (!rejection_reason) {
            return res.status(400).json({ 
                statusCode: 400, 
                message: 'Rejection reason is required' 
            });
        }

        const result = await pool.query(`
            UPDATE appointment_requests 
            SET status = 'rejected',
                reviewed_at = CURRENT_TIMESTAMP,
                assigned_by = $1,
                rejection_reason = $2
            WHERE id = $3 AND status = 'pending'
            RETURNING *
        `, [assigned_by, rejection_reason, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                statusCode: 404, 
                message: 'Appointment request not found or already processed' 
            });
        }

        res.json({ 
            statusCode: 200, 
            message: 'Appointment request rejected',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error rejecting appointment request:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error rejecting appointment request',
            error: error.message 
        });
    }
});

// DELETE cancel appointment request
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(`
            UPDATE appointment_requests 
            SET status = 'cancelled', reviewed_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                statusCode: 404, 
                message: 'Appointment request not found' 
            });
        }
        
        res.json({
            statusCode: 200,
            message: 'Appointment request cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling appointment request:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error cancelling appointment request',
            error: error.message 
        });
    }
});

module.exports = router;
