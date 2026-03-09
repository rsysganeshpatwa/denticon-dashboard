const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET all providers
router.get('/', async (req, res) => {
    try {
        const { location_id, specialization, is_active } = req.query;
        
        let query = `
            SELECT 
                p.*,
                l.name as location_name,
                l.city as location_city,
                COUNT(DISTINCT pat.id) as patients_count,
                COUNT(DISTINCT a.id) as appointments_count
            FROM providers p
            LEFT JOIN locations l ON p.location_id = l.id
            LEFT JOIN patients pat ON p.id = pat.primary_provider_id
            LEFT JOIN appointments a ON p.id = a.provider_id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (is_active !== undefined && is_active !== '') {
            query += ` AND p.is_active = $${paramIndex++}`;
            params.push(is_active);
        }

        if (location_id) {
            query += ` AND p.location_id = $${paramIndex++}`;
            params.push(location_id);
        }
        if (specialization) {
            query += ` AND p.specialization ILIKE $${paramIndex++}`;
            params.push(`%${specialization}%`);
        }

        query += ` GROUP BY p.id, l.name, l.city ORDER BY p.last_name, p.first_name`;

        const result = await pool.query(query, params);
        
        res.json({
            statusCode: 200,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching providers:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error fetching providers',
            error: error.message 
        });
    }
});

// GET single provider by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(`
            SELECT 
                p.*,
                l.name as location_name,
                l.address as location_address,
                l.city as location_city,
                l.state as location_state,
                l.phone as location_phone,
                COUNT(DISTINCT pat.id) as patients_count,
                COUNT(DISTINCT a.id) as appointments_count,
                COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_appointments
            FROM providers p
            LEFT JOIN locations l ON p.location_id = l.id
            LEFT JOIN patients pat ON p.id = pat.primary_provider_id
            LEFT JOIN appointments a ON p.id = a.provider_id
            WHERE p.id = $1
            GROUP BY p.id, l.name, l.address, l.city, l.state, l.phone
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                statusCode: 404, 
                message: 'Provider not found' 
            });
        }
        
        res.json({
            statusCode: 200,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching provider:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error fetching provider',
            error: error.message 
        });
    }
});

// GET provider's availability schedule
router.get('/:id/schedule', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT * FROM provider_availability 
             WHERE provider_id = $1 
             ORDER BY day_of_week`,
            [id]
        );

        res.json({
            statusCode: 200,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching provider schedule:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Error fetching provider schedule',
            error: error.message
        });
    }
});

// GET provider availability for a specific date
router.get('/:id/availability', async (req, res) => {
    try {
        const { id } = req.params;
        const { date, currentTime } = req.query;
        
        if (!date) {
            return res.status(400).json({ 
                statusCode: 400, 
                message: 'Date parameter is required' 
            });
        }
        
        // Get the day of week for the requested date
        const dayOfWeek = new Date(date).getDay();
        
        // Get provider's schedule for this day
        const scheduleResult = await pool.query(
            `SELECT start_time, end_time, slot_duration 
             FROM provider_availability 
             WHERE provider_id = $1 AND day_of_week = $2 AND is_active = true 
             LIMIT 1`,
            [id, dayOfWeek]
        );
        
        if (scheduleResult.rows.length === 0) {
            return res.json({
                statusCode: 200,
                data: []
            });
        }
        
        const { start_time, end_time, slot_duration } = scheduleResult.rows[0];
        
        // Generate all possible time slots
        const allSlots = [];
        let slotTime = start_time;
        const endTimeValue = end_time;
        
        while (slotTime < endTimeValue) {
            allSlots.push(slotTime);
            // Add slot_duration minutes to current time
            const [hours, minutes] = slotTime.split(':');
            const totalMinutes = parseInt(hours) * 60 + parseInt(minutes) + slot_duration;
            const newHours = Math.floor(totalMinutes / 60);
            const newMinutes = totalMinutes % 60;
            slotTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}:00`;
        }
        
        // Check which slots are booked
        const bookedSlotsResult = await pool.query(
            `SELECT DISTINCT preferred_time::text as time_slot
             FROM appointment_requests
             WHERE (provider_id = $1 OR assigned_provider_id = $1)
             AND preferred_date = $2
             AND status IN ('pending', 'approved')
             UNION
             SELECT DISTINCT appointment_time::text as time_slot
             FROM appointments
             WHERE provider_id = $1
             AND appointment_date = $2
             AND status NOT IN ('cancelled', 'no-show')`,
            [id, date]
        );
        
        const bookedTimes = new Set(bookedSlotsResult.rows.map(row => row.time_slot));
        
        // Check if the requested date is today
        const todayDateStr = new Date().toISOString().split('T')[0];
        const isToday = date === todayDateStr;
        
        // Use client's current time if provided (to handle timezone differences), 
        // otherwise use server time
        let currentTimeString = null;
        if (isToday) {
            if (currentTime && /^\d{2}:\d{2}:\d{2}$/.test(currentTime)) {
                // Client provided time in HH:MM:SS format
                currentTimeString = currentTime;
                console.log(`Using client time: ${currentTimeString} for date: ${date}`);
            } else {
                // Fallback to server time
                const now = new Date();
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');
                currentTimeString = `${hours}:${minutes}:${seconds}`;
                console.log(`Using server time: ${currentTimeString} for date: ${date}`);
            }
        }
        
        // Return all slots with availability status
        const slotsWithStatus = allSlots.map(slot => {
            const isBooked = bookedTimes.has(slot);
            // String comparison works for HH:MM:SS format (e.g., "09:00:00" < "16:48:00")
            const isPast = isToday && currentTimeString && slot < currentTimeString;
            
            return {
                time: slot,
                available: !isBooked && !isPast,
                isPast: isPast
            };
        });
        
        res.json({
            statusCode: 200,
            data: slotsWithStatus
        });
    } catch (error) {
        console.error('Error fetching provider availability:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error fetching provider availability',
            error: error.message 
        });
    }
});

// GET available dates for provider (optimized bulk endpoint)
router.get('/:id/available-dates', async (req, res) => {
    try {
        const { id } = req.params;
        const { days = 60 } = req.query;
        
        // Get provider's working days
        const scheduleResult = await pool.query(
            `SELECT day_of_week FROM provider_availability 
             WHERE provider_id = $1 AND is_active = true`,
            [id]
        );
        
        if (scheduleResult.rows.length === 0) {
            return res.json({
                statusCode: 200,
                data: []
            });
        }
        
        const workingDays = new Set(scheduleResult.rows.map(row => row.day_of_week));
        
        // Get all booked dates
        const bookedDatesResult = await pool.query(
            `SELECT DISTINCT preferred_date::text as date, 
                    COUNT(*) as booked_slots,
                    (SELECT COUNT(*) FROM provider_availability WHERE provider_id = $1 AND day_of_week = EXTRACT(DOW FROM preferred_date) AND is_active = true) as total_possible
             FROM appointment_requests
             WHERE (provider_id = $1 OR assigned_provider_id = $1)
             AND preferred_date >= CURRENT_DATE
             AND preferred_date <= CURRENT_DATE + CAST($2 AS INTEGER)
             AND status IN ('pending', 'approved')
             GROUP BY preferred_date
             UNION
             SELECT DISTINCT appointment_date::text as date,
                    COUNT(*) as booked_slots,
                    (SELECT COUNT(*) FROM provider_availability WHERE provider_id = $1 AND day_of_week = EXTRACT(DOW FROM appointment_date) AND is_active = true) as total_possible
             FROM appointments
             WHERE provider_id = $1
             AND appointment_date >= CURRENT_DATE
             AND appointment_date <= CURRENT_DATE + CAST($2 AS INTEGER)
             AND status NOT IN ('cancelled', 'no-show')
             GROUP BY appointment_date`,
            [id, parseInt(days)]
        );
        
        // Generate list of dates with working days only
        const availableDates = [];
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + parseInt(days));
        
        const bookedDatesMap = new Map();
        bookedDatesResult.rows.forEach(row => {
            bookedDatesMap.set(row.date, parseInt(row.booked_slots));
        });
        
        for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            if (workingDays.has(dayOfWeek)) {
                const dateStr = d.toISOString().split('T')[0];
                const bookedCount = bookedDatesMap.get(dateStr) || 0;
                
                // Get total slots for this day (rough calculation)
                // This could be optimized further by calculating exact slot count
                availableDates.push(dateStr);
            }
        }
        
        res.json({
            statusCode: 200,
            data: availableDates
        });
    } catch (error) {
        console.error('Error fetching available dates:', error);
        res.status(500).json({ 
            statusCode: 500, 
            message: 'Error fetching available dates',
            error: error.message 
        });
    }
});

// POST create new provider
router.post('/', async (req, res) => {
    try {
        const {
            first_name, last_name, email, phone, specialization,
            location_id, experience_years, education
        } = req.body;
        
        if (!first_name || !last_name || !email) {
            return res.status(400).json({ 
                statusCode: 400, 
                message: 'First name, last name, and email are required' 
            });
        }
        
        const result = await pool.query(`
            INSERT INTO providers (
                first_name, last_name, email, phone, specialization,
                location_id, experience_years, education
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [first_name, last_name, email, phone, specialization, location_id, experience_years, education]);
        
        res.status(201).json({
            statusCode: 201,
            message: 'Provider created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating provider:', error);
        if (error.code === '23505') {
            return res.status(409).json({ statusCode: 409, message: 'Email already exists' });
        }
        res.status(500).json({ statusCode: 500, message: 'Error creating provider', error: error.message });
    }
});

// PUT update provider
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const fields = req.body;
        
        const setClauses = [];
        const values = [];
        let paramIndex = 1;

        Object.keys(fields).forEach(key => {
            setClauses.push(`${key} = $${paramIndex++}`);
            values.push(fields[key]);
        });

        values.push(id);

        const result = await pool.query(`
            UPDATE providers 
            SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramIndex}
            RETURNING *
        `, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ statusCode: 404, message: 'Provider not found' });
        }
        
        res.json({ statusCode: 200, message: 'Provider updated successfully', data: result.rows[0] });
    } catch (error) {
        console.error('Error updating provider:', error);
        res.status(500).json({ statusCode: 500, message: 'Error updating provider', error: error.message });
    }
});

// DELETE provider (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(`
            UPDATE providers 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ statusCode: 404, message: 'Provider not found' });
        }
        
        res.json({ statusCode: 200, message: 'Provider deleted successfully' });
    } catch (error) {
        console.error('Error deleting provider:', error);
        res.status(500).json({ statusCode: 500, message: 'Error deleting provider', error: error.message });
    }
});

module.exports = router;
