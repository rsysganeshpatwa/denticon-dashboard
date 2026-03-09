const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken, adminOnly, adminOrProvider } = require('../middleware/auth');

// Get Appointments Report (Date Range, Status, Provider)
router.get('/appointments', verifyToken, adminOrProvider, async (req, res) => {
    try {
        const { start_date, end_date, status, provider_id, location_id } = req.query;
        
        let query = `
            SELECT 
                a.id,
                a.appointment_date,
                a.appointment_time,
                a.status,
                a.appointment_type,
                COALESCE(p.first_name || ' ' || p.last_name, 'Unknown') as patient_name,
                p.phone as patient_phone,
                p.email as patient_email,
                pr.first_name || ' ' || pr.last_name as provider_name,
                l.name as location_name,
                a.diagnosis,
                a.treatment,
                a.follow_up_required,
                a.next_visit_date,
                a.created_at
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            LEFT JOIN providers pr ON a.provider_id = pr.id
            LEFT JOIN locations l ON pr.location_id = l.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramCount = 1;
        
        if (start_date) {
            query += ` AND a.appointment_date >= $${paramCount}`;
            params.push(start_date);
            paramCount++;
        }
        
        if (end_date) {
            query += ` AND a.appointment_date <= $${paramCount}`;
            params.push(end_date);
            paramCount++;
        }
        
        if (status) {
            query += ` AND a.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }
        
        if (provider_id) {
            query += ` AND a.provider_id = $${paramCount}`;
            params.push(provider_id);
            paramCount++;
        }
        
        if (location_id) {
            query += ` AND pr.location_id = $${paramCount}`;
            params.push(location_id);
            paramCount++;
        }
        
        query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';
        
        const result = await pool.query(query, params);
        
        // Calculate statistics
        const total = result.rows.length;
        const completed = result.rows.filter(r => r.status === 'completed').length;
        const cancelled = result.rows.filter(r => r.status === 'cancelled').length;
        const noShow = result.rows.filter(r => r.status === 'no-show').length;
        const scheduled = result.rows.filter(r => r.status === 'scheduled').length;
        const followUpsRequired = result.rows.filter(r => r.follow_up_required).length;
        
        res.json({
            statusCode: 200,
            message: 'Appointments report generated successfully',
            data: {
                appointments: result.rows,
                statistics: {
                    total,
                    completed,
                    cancelled,
                    noShow,
                    scheduled,
                    followUpsRequired,
                    completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0,
                    noShowRate: total > 0 ? ((noShow / total) * 100).toFixed(2) : 0
                }
            }
        });
    } catch (error) {
        console.error('Error generating appointments report:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Failed to generate appointments report',
            error: error.message
        });
    }
});

// Get Patient Statistics Report
router.get('/patients', verifyToken, adminOnly, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        // Total patients
        const totalPatients = await pool.query('SELECT COUNT(*) FROM patients');
        
        // New patients in date range
        let newPatientsQuery = 'SELECT COUNT(*) FROM patients WHERE 1=1';
        const params = [];
        let paramCount = 1;
        
        if (start_date) {
            newPatientsQuery += ` AND created_at >= $${paramCount}`;
            params.push(start_date);
            paramCount++;
        }
        
        if (end_date) {
            newPatientsQuery += ` AND created_at <= $${paramCount}`;
            params.push(end_date);
            paramCount++;
        }
        
        const newPatients = await pool.query(newPatientsQuery, params);
        
        // Patients by appointment count
        const patientsByAppointments = await pool.query(`
            SELECT 
                p.id,
                COALESCE(p.first_name || ' ' || p.last_name, 'Unknown') as patient_name,
                p.phone as patient_phone,
                p.email as patient_email,
                COUNT(a.id) as appointment_count,
                MAX(a.appointment_date) as last_visit_date
            FROM patients p
            LEFT JOIN appointments a ON p.id = a.patient_id
            GROUP BY p.id, p.first_name, p.last_name, p.phone, p.email
            ORDER BY appointment_count DESC
            LIMIT 50
        `);
        
        // Patients with no appointments
        const patientsNoAppointments = await pool.query(`
            SELECT 
                p.id,
                COALESCE(p.first_name || ' ' || p.last_name, 'Unknown') as patient_name,
                p.phone as patient_phone,
                p.email as patient_email,
                p.created_at
            FROM patients p
            LEFT JOIN appointments a ON p.id = a.patient_id
            WHERE a.id IS NULL
            ORDER BY p.created_at DESC
        `);
        
        res.json({
            statusCode: 200,
            message: 'Patient statistics generated successfully',
            data: {
                totalPatients: parseInt(totalPatients.rows[0].count),
                newPatients: parseInt(newPatients.rows[0].count),
                topPatients: patientsByAppointments.rows,
                patientsWithoutAppointments: patientsNoAppointments.rows
            }
        });
    } catch (error) {
        console.error('Error generating patient report:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Failed to generate patient report',
            error: error.message
        });
    }
});

// Get Provider Performance Report
router.get('/providers', verifyToken, adminOnly, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        let query = `
            SELECT 
                pr.id,
                pr.first_name || ' ' || pr.last_name as provider_name,
                pr.specialization,
                l.name as location_name,
                COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
                COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled_appointments,
                COUNT(CASE WHEN a.status = 'no-show' THEN 1 END) as no_show_appointments,
                COUNT(CASE WHEN a.status = 'scheduled' THEN 1 END) as scheduled_appointments,
                COUNT(a.id) as total_appointments,
                COUNT(DISTINCT a.patient_id) as unique_patients,
                COUNT(CASE WHEN a.follow_up_required THEN 1 END) as follow_ups_required
            FROM providers pr
            LEFT JOIN appointments a ON pr.id = a.provider_id
            LEFT JOIN locations l ON pr.location_id = l.id
            WHERE pr.is_active = true
        `;
        
        const params = [];
        let paramCount = 1;
        
        if (start_date) {
            query += ` AND a.appointment_date >= $${paramCount}`;
            params.push(start_date);
            paramCount++;
        }
        
        if (end_date) {
            query += ` AND a.appointment_date <= $${paramCount}`;
            params.push(end_date);
            paramCount++;
        }
        
        query += `
            GROUP BY pr.id, pr.first_name, pr.last_name, pr.specialization, l.name
            ORDER BY completed_appointments DESC
        `;
        
        const result = await pool.query(query, params);
        
        // Calculate performance metrics for each provider
        const providersWithMetrics = result.rows.map(provider => ({
            ...provider,
            completionRate: provider.total_appointments > 0 
                ? ((provider.completed_appointments / provider.total_appointments) * 100).toFixed(2)
                : 0,
            noShowRate: provider.total_appointments > 0
                ? ((provider.no_show_appointments / provider.total_appointments) * 100).toFixed(2)
                : 0,
            averagePatientsPerDay: provider.total_appointments > 0
                ? (provider.total_appointments / 30).toFixed(2)
                : 0
        }));
        
        res.json({
            statusCode: 200,
            message: 'Provider performance report generated successfully',
            data: {
                providers: providersWithMetrics
            }
        });
    } catch (error) {
        console.error('Error generating provider report:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Failed to generate provider report',
            error: error.message
        });
    }
});

// Get Revenue Report (if you have billing)
router.get('/revenue', verifyToken, adminOnly, async (req, res) => {
    try {
        const { start_date, end_date, location_id } = req.query;
        
        // This is a placeholder - you'll need a billing/payments table
        // For now, we'll return appointment counts as a proxy
        
        let query = `
            SELECT 
                DATE(a.appointment_date) as date,
                COUNT(a.id) as appointment_count,
                COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_count,
                l.name as location_name
            FROM appointments a
            JOIN providers pr ON a.provider_id = pr.id
            LEFT JOIN locations l ON pr.location_id = l.id
            WHERE a.status = 'completed'
        `;
        
        const params = [];
        let paramCount = 1;
        
        if (start_date) {
            query += ` AND a.appointment_date >= $${paramCount}`;
            params.push(start_date);
            paramCount++;
        }
        
        if (end_date) {
            query += ` AND a.appointment_date <= $${paramCount}`;
            params.push(end_date);
            paramCount++;
        }
        
        if (location_id) {
            query += ` AND pr.location_id = $${paramCount}`;
            params.push(location_id);
            paramCount++;
        }
        
        query += `
            GROUP BY DATE(a.appointment_date), l.name
            ORDER BY date DESC
        `;
        
        const result = await pool.query(query, params);
        
        res.json({
            statusCode: 200,
            message: 'Revenue report generated successfully',
            data: {
                daily_summary: result.rows,
                note: 'This is based on completed appointments. Integrate with billing system for actual revenue.'
            }
        });
    } catch (error) {
        console.error('Error generating revenue report:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Failed to generate revenue report',
            error: error.message
        });
    }
});

// Get Follow-up Report
router.get('/follow-ups', verifyToken, adminOrProvider, async (req, res) => {
    try {
        const { provider_id, overdue_only } = req.query;
        
        let query = `
            SELECT 
                a.id,
                a.next_visit_date,
                a.follow_up_notes,
                a.appointment_date as last_visit_date,
                COALESCE(p.first_name || ' ' || p.last_name, 'Unknown') as patient_name,
                p.phone as patient_phone,
                p.email as patient_email,
                pr.first_name || ' ' || pr.last_name as provider_name,
                l.name as location_name,
                CASE 
                    WHEN a.next_visit_date < CURRENT_DATE THEN 'Overdue'
                    WHEN a.next_visit_date = CURRENT_DATE THEN 'Due Today'
                    WHEN a.next_visit_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'Due This Week'
                    ELSE 'Upcoming'
                END as urgency
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            LEFT JOIN providers pr ON a.provider_id = pr.id
            LEFT JOIN locations l ON pr.location_id = l.id
            WHERE a.follow_up_required = true
            AND a.status = 'completed'
        `;
        
        const params = [];
        let paramCount = 1;
        
        if (provider_id) {
            query += ` AND a.provider_id = $${paramCount}`;
            params.push(provider_id);
            paramCount++;
        }
        
        if (overdue_only === 'true') {
            query += ` AND a.next_visit_date < CURRENT_DATE`;
        }
        
        query += ' ORDER BY a.next_visit_date ASC';
        
        const result = await pool.query(query, params);
        
        // Calculate statistics
        const overdue = result.rows.filter(r => r.urgency === 'Overdue').length;
        const dueToday = result.rows.filter(r => r.urgency === 'Due Today').length;
        const dueThisWeek = result.rows.filter(r => r.urgency === 'Due This Week').length;
        
        res.json({
            statusCode: 200,
            message: 'Follow-up report generated successfully',
            data: {
                followUps: result.rows,
                statistics: {
                    total: result.rows.length,
                    overdue,
                    dueToday,
                    dueThisWeek,
                    upcoming: result.rows.length - overdue - dueToday - dueThisWeek
                }
            }
        });
    } catch (error) {
        console.error('Error generating follow-up report:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Failed to generate follow-up report',
            error: error.message
        });
    }
});

// Export data as CSV
router.get('/export/:reportType', verifyToken, adminOnly, async (req, res) => {
    try {
        const { reportType } = req.params;
        const { start_date, end_date } = req.query;
        
        let query = '';
        const params = [];
        
        switch (reportType) {
            case 'appointments':
                query = `
                    SELECT 
                        a.id as "Appointment ID",
                        a.appointment_date as "Date",
                        a.appointment_time as "Time",
                        a.status as "Status",
                        a.appointment_type as "Type",
                        COALESCE(p.first_name || ' ' || p.last_name, 'Unknown') as "Patient Name",
                        p.phone as "Patient Phone",
                        pr.first_name || ' ' || pr.last_name as "Provider",
                        l.name as "Location",
                        a.diagnosis as "Diagnosis",
                        a.treatment as "Treatment"
                    FROM appointments a
                    LEFT JOIN patients p ON a.patient_id = p.id
                    LEFT JOIN providers pr ON a.provider_id = pr.id
                    LEFT JOIN locations l ON pr.location_id = l.id
                    WHERE 1=1
                `;
                break;
            case 'patients':
                query = `
                    SELECT 
                        p.id as "Patient ID",
                        COALESCE(p.first_name || ' ' || p.last_name, 'Unknown') as "Name",
                        p.phone as "Phone",
                        p.email as "Email",
                        p.date_of_birth as "Date of Birth",
                        p.gender as "Gender",
                        p.address as "Address",
                        COUNT(a.id) as "Total Appointments"
                    FROM patients p
                    LEFT JOIN appointments a ON p.id = a.patient_id
                    GROUP BY p.id
                `;
                break;
            case 'providers':
                query = `
                    SELECT 
                        pr.id as "Provider ID",
                        pr.first_name || ' ' || pr.last_name as "Provider Name",
                        pr.specialization as "Specialization",
                        pr.email as "Email",
                        pr.phone as "Phone",
                        l.name as "Location",
                        COUNT(DISTINCT a.id) as "Total Appointments",
                        COUNT(DISTINCT a.patient_id) as "Unique Patients",
                        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as "Completed",
                        COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as "Cancelled"
                    FROM providers pr
                    LEFT JOIN locations l ON pr.location_id = l.id
                    LEFT JOIN appointments a ON pr.id = a.provider_id
                    WHERE pr.is_active = true
                    GROUP BY pr.id, pr.first_name, pr.last_name, pr.specialization, pr.email, pr.phone, l.name
                    ORDER BY "Total Appointments" DESC
                `;
                break;
            case 'follow-ups':
                query = `
                    SELECT 
                        a.id as "Appointment ID",
                        a.next_visit_date as "Follow-up Date",
                        COALESCE(p.first_name || ' ' || p.last_name, 'Unknown') as "Patient Name",
                        p.phone as "Patient Phone",
                        p.email as "Patient Email",
                        pr.first_name || ' ' || pr.last_name as "Provider",
                        l.name as "Location",
                        a.follow_up_notes as "Notes",
                        CASE 
                            WHEN a.next_visit_date < CURRENT_DATE THEN 'Overdue'
                            WHEN a.next_visit_date = CURRENT_DATE THEN 'Due Today'
                            WHEN a.next_visit_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'Due This Week'
                            ELSE 'Upcoming'
                        END as "Urgency"
                    FROM appointments a
                    LEFT JOIN patients p ON a.patient_id = p.id
                    LEFT JOIN providers pr ON a.provider_id = pr.id
                    LEFT JOIN locations l ON pr.location_id = l.id
                    WHERE a.follow_up_required = true
                    AND a.status = 'completed'
                    ORDER BY a.next_visit_date ASC
                `;
                break;
            default:
                return res.status(400).json({
                    statusCode: 400,
                    message: 'Invalid report type. Supported types: appointments, patients, providers, follow-ups'
                });
        }
        
        if (start_date && reportType === 'appointments') {
            query += ` AND a.appointment_date >= '${start_date}'`;
        }
        
        if (end_date && reportType === 'appointments') {
            query += ` AND a.appointment_date <= '${end_date}'`;
        }
        
        const result = await pool.query(query);
        
        // Convert to CSV
        if (result.rows.length === 0) {
            return res.status(404).json({
                statusCode: 404,
                message: 'No data found for export'
            });
        }
        
        const headers = Object.keys(result.rows[0]);
        const csv = [
            headers.join(','),
            ...result.rows.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // Escape commas and quotes in CSV
                    if (value === null) return '';
                    const stringValue = String(value);
                    if (stringValue.includes(',') || stringValue.includes('"')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                }).join(',')
            )
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting report:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Failed to export report',
            error: error.message
        });
    }
});

module.exports = router;
