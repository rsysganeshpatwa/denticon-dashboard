const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken, providerOnly } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(verifyToken);
router.use(providerOnly);

// Get provider's own appointments
router.get('/appointments', async (req, res) => {
    try {
        const { date, status, page = 1, count = 50 } = req.query;
        const offset = (page - 1) * count;
        const providerId = req.user.providerId;

        if (!providerId) {
            return res.status(400).json({
                statusCode: 400,
                message: 'Provider information not found'
            });
        }

        let query = `
            SELECT 
                a.id,
                a.appointment_date,
                a.appointment_time,
                a.status,
                a.appointment_type,
                a.notes,
                a.created_at,
                p.first_name || ' ' || p.last_name as patient_name,
                p.phone as patient_phone,
                p.email as patient_email,
                p.date_of_birth as patient_dob,
                l.name as location_name
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN providers prov ON a.provider_id = prov.id
            JOIN locations l ON prov.location_id = l.id
            WHERE a.provider_id = $1
        `;
        const params = [providerId];
        let paramIndex = 2;

        if (date) {
            query += ` AND a.appointment_date = $${paramIndex++}`;
            params.push(date);
        }

        if (status && status !== 'all') {
            query += ` AND a.status = $${paramIndex++}`;
            params.push(status);
        }

        query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(count, offset);

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM appointments WHERE provider_id = $1';
        const countParams = [providerId];
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
        console.error('Error fetching provider appointments:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Error fetching appointments',
            error: error.message
        });
    }
});

// Get today's appointments for provider
router.get('/appointments/today', async (req, res) => {
    try {
        const providerId = req.user.providerId;

        if (!providerId) {
            return res.status(400).json({
                statusCode: 400,
                message: 'Provider information not found'
            });
        }

        const query = `
            SELECT 
                a.id,
                a.appointment_date,
                a.appointment_time,
                a.status,
                a.appointment_type,
                a.notes,
                p.first_name || ' ' || p.last_name as patient_name,
                p.phone as patient_phone,
                p.email as patient_email
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            WHERE a.provider_id = $1
            AND a.appointment_date = CURRENT_DATE
            ORDER BY a.appointment_time ASC
        `;

        const result = await pool.query(query, [providerId]);

        res.json({
            statusCode: 200,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching today appointments:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Error fetching today appointments',
            error: error.message
        });
    }
});

// Get single appointment details
router.get('/appointments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const providerId = req.user.providerId;

        const query = `
            SELECT 
                a.*,
                p.first_name || ' ' || p.last_name as patient_name,
                p.phone as patient_phone,
                p.email as patient_email,
                p.date_of_birth as patient_dob,
                p.address as patient_address,
                l.name as location_name,
                l.address as location_address
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN providers prov ON a.provider_id = prov.id
            JOIN locations l ON prov.location_id = l.id
            WHERE a.id = $1 AND a.provider_id = $2
        `;

        const result = await pool.query(query, [id, providerId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                statusCode: 404,
                message: 'Appointment not found or access denied'
            });
        }

        res.json({
            statusCode: 200,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching appointment details:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Error fetching appointment',
            error: error.message
        });
    }
});

// Update appointment status (provider can only update their own appointments)
router.patch('/appointments/:id/status', async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const providerId = req.user.providerId;

        // Valid statuses (removed 'confirmed' - using Option B flow)
        const validStatuses = ['completed', 'no-show'];
        
        if (!status || !validStatuses.includes(status.toLowerCase())) {
            return res.status(400).json({ 
                statusCode: 400, 
                message: `Invalid status. Provider can only set: ${validStatuses.join(', ')}` 
            });
        }

        await client.query('BEGIN');

        // Verify appointment belongs to this provider
        const checkResult = await client.query(
            'SELECT * FROM appointments WHERE id = $1 AND provider_id = $2',
            [id, providerId]
        );

        if (checkResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                statusCode: 404,
                message: 'Appointment not found or access denied'
            });
        }

        const oldData = checkResult.rows[0];

        // Update status
        const result = await client.query(`
            UPDATE appointments 
            SET status = $1, 
                notes = COALESCE($2, notes),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `, [status, notes, id]);

        // Log to history
        await client.query(`
            INSERT INTO appointment_history (
                appointment_id, changed_by, old_status, new_status, change_reason
            ) VALUES ($1, $2, $3, $4, $5)
        `, [
            id,
            providerId,
            oldData.status,
            status,
            notes || `Status updated by provider from ${oldData.status} to ${status}`
        ]);

        await client.query('COMMIT');

        res.json({
            statusCode: 200,
            message: 'Appointment status updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating appointment status:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Error updating appointment status',
            error: error.message
        });
    } finally {
        client.release();
    }
});

// Update appointment (diagnosis, treatment, notes) and mark as completed
router.put('/appointments/:id', async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { id } = req.params;
        const { 
            diagnosis, 
            treatment, 
            notes, 
            status,
            follow_up_required,
            next_visit_date,
            follow_up_notes
        } = req.body;
        const providerId = req.user.providerId;

        await client.query('BEGIN');

        // Verify appointment belongs to this provider
        const checkResult = await client.query(
            'SELECT * FROM appointments WHERE id = $1 AND provider_id = $2',
            [id, providerId]
        );
        
        if (checkResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                statusCode: 404,
                message: 'Appointment not found or not assigned to this provider'
            });
        }

        const oldData = checkResult.rows[0];

        // Update appointment with clinical information and follow-up data
        const result = await client.query(`
            UPDATE appointments 
            SET diagnosis = $1,
                treatment = $2,
                notes = $3,
                status = $4,
                follow_up_required = $5,
                next_visit_date = $6,
                follow_up_notes = $7,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
            RETURNING *
        `, [
            diagnosis, 
            treatment, 
            notes, 
            status || 'completed', 
            follow_up_required || false,
            next_visit_date || null,
            follow_up_notes || null,
            id
        ]);

        // Log status change to history if status changed
        if (status && status !== oldData.status) {
            await client.query(`
                INSERT INTO appointment_history (
                    appointment_id, changed_by, old_status, new_status, change_reason
                ) VALUES ($1, $2, $3, $4, $5)
            `, [
                id,
                providerId,
                oldData.status,
                status,
                'Appointment completed with diagnosis and treatment'
            ]);
        }

        await client.query('COMMIT');

        res.json({
            statusCode: 200,
            message: 'Appointment updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating appointment:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Error updating appointment',
            error: error.message
        });
    } finally {
        client.release();
    }
});

// Get provider's patients (patients who have appointments with this provider)
router.get('/patients', async (req, res) => {
    try {
        const providerId = req.user.providerId;

        const query = `
            SELECT DISTINCT
                p.id,
                p.first_name,
                p.last_name,
                p.email,
                p.phone,
                p.date_of_birth,
                COUNT(a.id) as total_appointments,
                MAX(a.appointment_date) as last_visit
            FROM patients p
            JOIN appointments a ON p.id = a.patient_id
            WHERE a.provider_id = $1
            GROUP BY p.id, p.first_name, p.last_name, p.email, p.phone, p.date_of_birth
            ORDER BY MAX(a.appointment_date) DESC
        `;

        const result = await pool.query(query, [providerId]);

        res.json({
            statusCode: 200,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching provider patients:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Error fetching patients',
            error: error.message
        });
    }
});

// Get single patient details with history
router.get('/patients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const providerId = req.user.providerId;

        // Get patient info
        const patientQuery = `
            SELECT p.* FROM patients p
            JOIN appointments a ON p.id = a.patient_id
            WHERE p.id = $1 AND a.provider_id = $2
            LIMIT 1
        `;

        const patientResult = await pool.query(patientQuery, [id, providerId]);

        if (patientResult.rows.length === 0) {
            return res.status(404).json({
                statusCode: 404,
                message: 'Patient not found or access denied'
            });
        }

        // Get appointment history
        const historyQuery = `
            SELECT 
                a.id,
                a.appointment_date,
                a.appointment_time,
                a.status,
                a.appointment_type,
                a.notes
            FROM appointments a
            WHERE a.patient_id = $1 AND a.provider_id = $2
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
        `;

        const historyResult = await pool.query(historyQuery, [id, providerId]);

        res.json({
            statusCode: 200,
            data: {
                patient: patientResult.rows[0],
                appointments: historyResult.rows
            }
        });
    } catch (error) {
        console.error('Error fetching patient details:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Error fetching patient details',
            error: error.message
        });
    }
});

// Get provider dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
    try {
        const providerId = req.user.providerId;

        const statsQuery = `
            SELECT 
                COUNT(CASE WHEN appointment_date = CURRENT_DATE THEN 1 END) as today_appointments,
                COUNT(CASE WHEN appointment_date = CURRENT_DATE AND status = 'scheduled' THEN 1 END) as today_scheduled,
                COUNT(CASE WHEN appointment_date = CURRENT_DATE AND status = 'completed' THEN 1 END) as today_completed,
                COUNT(CASE WHEN appointment_date > CURRENT_DATE THEN 1 END) as upcoming_appointments,
                COUNT(CASE WHEN status = 'no-show' AND appointment_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_noshows
            FROM appointments
            WHERE provider_id = $1
        `;

        const result = await pool.query(statsQuery, [providerId]);

        res.json({
            statusCode: 200,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
});

// ===== SCHEDULE MANAGEMENT ENDPOINTS =====

// GET provider's schedule
router.get('/schedule', async (req, res) => {
    try {
        const providerId = req.user.providerId;

        const result = await pool.query(
            `SELECT * FROM provider_availability 
             WHERE provider_id = $1 
             ORDER BY day_of_week`,
            [providerId]
        );

        res.json({
            statusCode: 200,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Error fetching schedule',
            error: error.message
        });
    }
});

// POST create new schedule entry
router.post('/schedule', async (req, res) => {
    try {
        const providerId = req.user.providerId;
        const { day_of_week, start_time, end_time, slot_duration, is_active } = req.body;

        if (day_of_week === undefined || !start_time || !end_time) {
            return res.status(400).json({
                statusCode: 400,
                message: 'day_of_week, start_time, and end_time are required'
            });
        }

        const result = await pool.query(
            `INSERT INTO provider_availability 
             (provider_id, day_of_week, start_time, end_time, slot_duration, is_active)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [providerId, day_of_week, start_time, end_time, slot_duration || 30, is_active !== false]
        );

        res.json({
            statusCode: 201,
            message: 'Schedule created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating schedule:', error);
        
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({
                statusCode: 409,
                message: 'Schedule already exists for this day and time'
            });
        }

        res.status(500).json({
            statusCode: 500,
            message: 'Error creating schedule',
            error: error.message
        });
    }
});

// PUT update schedule entry
router.put('/schedule/:id', async (req, res) => {
    try {
        const providerId = req.user.providerId;
        const { id } = req.params;
        const { start_time, end_time, slot_duration, is_active } = req.body;

        // Verify ownership
        const checkResult = await pool.query(
            'SELECT * FROM provider_availability WHERE id = $1 AND provider_id = $2',
            [id, providerId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                statusCode: 404,
                message: 'Schedule not found'
            });
        }

        const result = await pool.query(
            `UPDATE provider_availability 
             SET start_time = $1, end_time = $2, slot_duration = $3, is_active = $4
             WHERE id = $5 AND provider_id = $6
             RETURNING *`,
            [start_time, end_time, slot_duration, is_active, id, providerId]
        );

        res.json({
            statusCode: 200,
            message: 'Schedule updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating schedule:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Error updating schedule',
            error: error.message
        });
    }
});

// DELETE schedule entry
router.delete('/schedule/:id', async (req, res) => {
    try {
        const providerId = req.user.providerId;
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM provider_availability WHERE id = $1 AND provider_id = $2 RETURNING *',
            [id, providerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                statusCode: 404,
                message: 'Schedule not found'
            });
        }

        res.json({
            statusCode: 200,
            message: 'Schedule deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Error deleting schedule',
            error: error.message
        });
    }
});

module.exports = router;
