const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET all appointments
router.get('/', async (req, res) => {
    try {
        const { 
            page = 1, 
            count = 10, 
            status, 
            provider_id, 
            patient_id,
            location_id,
            date_from,
            date_to
        } = req.query;
        const offset = (page - 1) * count;
        
        let query = `
            SELECT 
                a.*,
                pat.first_name || ' ' || pat.last_name as patient_name,
                pat.phone as patient_phone,
                pat.email as patient_email,
                prov.first_name || ' ' || prov.last_name as provider_name,
                prov.specialization,
                l.name as location_name,
                l.address as location_address
            FROM appointments a
            JOIN patients pat ON a.patient_id = pat.id
            JOIN providers prov ON a.provider_id = prov.id
            JOIN locations l ON prov.location_id = l.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;
        
        if (status) {
            query += ` AND a.status = $${paramIndex++}`;
            params.push(status);
        }
        
        if (provider_id) {
            query += ` AND a.provider_id = $${paramIndex++}`;
            params.push(provider_id);
        }
        
        if (patient_id) {
            query += ` AND a.patient_id = $${paramIndex++}`;
            params.push(patient_id);
        }
        
        if (location_id) {
            query += ` AND prov.location_id = $${paramIndex++}`;
            params.push(location_id);
        }
        
        if (date_from) {
            query += ` AND a.appointment_date >= $${paramIndex++}`;
            params.push(date_from);
        }
        
        if (date_to) {
            query += ` AND a.appointment_date <= $${paramIndex++}`;
            params.push(date_to);
        }
        
        query += ` ORDER BY a.appointment_date ASC, a.appointment_time ASC 
                   LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(count, offset);
        
        const result = await pool.query(query, params);
        
        // Get total count with same filters
        let countQuery = `
            SELECT COUNT(*) 
            FROM appointments a
            JOIN providers prov ON a.provider_id = prov.id
            WHERE 1=1
        `;
        const countParams = [];
        let countParamIndex = 1;
        
        if (status) {
            countQuery += ` AND a.status = $${countParamIndex++}`;
            countParams.push(status);
        }
        if (provider_id) {
            countQuery += ` AND a.provider_id = $${countParamIndex++}`;
            countParams.push(provider_id);
        }
        if (patient_id) {
            countQuery += ` AND a.patient_id = $${countParamIndex++}`;
            countParams.push(patient_id);
        }
        if (location_id) {
            countQuery += ` AND prov.location_id = $${countParamIndex++}`;
            countParams.push(location_id);
        }
        if (date_from) {
            countQuery += ` AND a.appointment_date >= $${countParamIndex++}`;
            countParams.push(date_from);
        }
        if (date_to) {
            countQuery += ` AND a.appointment_date <= $${countParamIndex++}`;
            countParams.push(date_to);
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
        console.error('Error fetching appointments:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error fetching appointments',
            error: error.message 
        });
    }
});

// GET single appointment by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(`
            SELECT 
                a.*,
                pat.first_name || ' ' || pat.last_name as patient_name,
                pat.phone as patient_phone,
                pat.email as patient_email,
                pat.date_of_birth as patient_dob,
                pat.insurance_provider,
                prov.first_name || ' ' || prov.last_name as provider_name,
                prov.specialization,
                prov.phone as provider_phone,
                l.name as location_name,
                l.address as location_address,
                l.phone as location_phone
            FROM appointments a
            JOIN patients pat ON a.patient_id = pat.id
            JOIN providers prov ON a.provider_id = prov.id
            JOIN locations l ON a.location_id = l.id
            WHERE a.id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                statusCode: 404, 
                message: 'Appointment not found' 
            });
        }
        
        res.json({
            statusCode: 200,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching appointment:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error fetching appointment',
            error: error.message 
        });
    }
});

// GET appointment history
router.get('/:id/history', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(`
            SELECT * FROM appointment_history
            WHERE appointment_id = $1
            ORDER BY changed_at DESC
        `, [id]);
        
        res.json({
            statusCode: 200,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching appointment history:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error fetching appointment history',
            error: error.message 
        });
    }
});

// POST create new appointment
router.post('/', async (req, res) => {
    const client = await pool.connect();
    
    try {
        const {
            patient_id, provider_id,
            appointment_date, appointment_time,
            appointment_type, notes, status
        } = req.body;
        
        if (!patient_id || !provider_id || !appointment_date || !appointment_time) {
            return res.status(400).json({ 
                statusCode: 400, 
                message: 'Patient, provider, date, and time are required' 
            });
        }
        
        await client.query('BEGIN');
        
        // Check for conflicts
        const conflictCheck = await client.query(`
            SELECT id FROM appointments
            WHERE provider_id = $1 
            AND appointment_date = $2 
            AND appointment_time = $3
            AND status = 'scheduled'
        `, [provider_id, appointment_date, appointment_time]);
        
        if (conflictCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ 
                statusCode: 409, 
                message: 'This time slot is already booked' 
            });
        }
        
        // Create appointment (location_id removed - determined via provider)
        const result = await client.query(`
            INSERT INTO appointments (
                patient_id, provider_id,
                appointment_date, appointment_time,
                appointment_type, notes, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [
            patient_id, provider_id,
            appointment_date, appointment_time,
            appointment_type || 'checkup', // Default to 'checkup' if not provided
            notes, status || 'scheduled'
        ]);
        
        await client.query('COMMIT');
        
        res.status(201).json({
            statusCode: 201,
            message: 'Appointment created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating appointment:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error creating appointment',
            error: error.message 
        });
    } finally {
        client.release();
    }
});

// PUT update appointment
router.put('/:id', async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { id } = req.params;
        const fields = req.body;
        
        if (Object.keys(fields).length === 0) {
            return res.status(400).json({ 
                statusCode: 400, 
                message: 'No fields to update' 
            });
        }
        
        await client.query('BEGIN');
        
        // Get old appointment data for history
        const oldData = await client.query('SELECT * FROM appointments WHERE id = $1', [id]);
        
        if (oldData.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ 
                statusCode: 404, 
                message: 'Appointment not found' 
            });
        }
        
        // If updating time/date, check for conflicts
        if (fields.appointment_date || fields.appointment_time) {
            const checkDate = fields.appointment_date || oldData.rows[0].appointment_date;
            const checkTime = fields.appointment_time || oldData.rows[0].appointment_time;
            const checkProvider = fields.provider_id || oldData.rows[0].provider_id;
            
            const conflictCheck = await client.query(`
                SELECT id FROM appointments
                WHERE provider_id = $1 
                AND appointment_date = $2 
                AND appointment_time = $3
                AND status = 'scheduled'
                AND id != $4
            `, [checkProvider, checkDate, checkTime, id]);
            
            if (conflictCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(409).json({ 
                    statusCode: 409, 
                    message: 'This time slot is already booked' 
                });
            }
        }
        
        // Update appointment
        const setClauses = [];
        const values = [];
        let paramIndex = 1;

        Object.keys(fields).forEach(key => {
            setClauses.push(`${key} = $${paramIndex++}`);
            values.push(fields[key]);
        });

        values.push(id);

        const result = await client.query(`
            UPDATE appointments 
            SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramIndex}
            RETURNING *
        `, values);
        
        // Log to history
        await client.query(`
            INSERT INTO appointment_history (
                appointment_id, changed_by, old_status, new_status, change_reason
            ) VALUES ($1, $2, $3, $4, $5)
        `, [
            id,
            null, // changed_by should be provider ID
            oldData.rows[0].status,
            fields.status || oldData.rows[0].status,
            fields.change_reason || 'Updated via API'
        ]);
        
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

// DELETE appointment (cancel)
router.delete('/:id', async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        await client.query('BEGIN');
        
        // Get current appointment
        const oldData = await client.query('SELECT * FROM appointments WHERE id = $1', [id]);
        
        if (oldData.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ 
                statusCode: 404, 
                message: 'Appointment not found' 
            });
        }
        
        // Update status to cancelled
        const result = await client.query(`
            UPDATE appointments 
            SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [id]);
        
        // Log to history
        await client.query(`
            INSERT INTO appointment_history (
                appointment_id, changed_by, old_status, new_status, change_reason
            ) VALUES ($1, $2, $3, $4, $5)
        `, [
            id,
            null, // changed_by should be provider ID
            oldData.rows[0].status,
            'cancelled',
            reason || 'Cancelled via API'
        ]);
        
        await client.query('COMMIT');
        
        res.json({
            statusCode: 200,
            message: 'Appointment cancelled successfully',
            data: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error cancelling appointment:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error cancelling appointment',
            error: error.message 
        });
    } finally {
        client.release();
    }
});

// Update appointment status (for providers)
router.patch('/:id/status', async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { id } = req.params;
        const { status, notes, changed_by } = req.body;
        
        // Valid statuses (removed 'confirmed' - using Option B flow)
        const validStatuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
        
        if (!status || !validStatuses.includes(status.toLowerCase())) {
            return res.status(400).json({ 
                statusCode: 400, 
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
            });
        }
        
        await client.query('BEGIN');
        
        // Get current appointment
        const oldData = await client.query('SELECT * FROM appointments WHERE id = $1', [id]);
        
        if (oldData.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ 
                statusCode: 404, 
                message: 'Appointment not found' 
            });
        }
        
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
            null, // changed_by should be provider ID, using null for now
            oldData.rows[0].status,
            status,
            notes || `Status updated from ${oldData.rows[0].status} to ${status}`
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

// Quick status update shortcuts (removed /confirm endpoint - using Option B flow)
router.patch('/:id/complete', async (req, res) => {
    req.body.status = 'completed';
    return router.handle(req, res);
});

router.patch('/:id/no-show', async (req, res) => {
    req.body.status = 'no-show';
    return router.handle(req, res);
});

module.exports = router;
