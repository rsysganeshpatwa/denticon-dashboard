-- Denticon Database Schema
-- PostgreSQL Database Initialization

-- Drop existing tables if they exist
DROP TABLE IF EXISTS appointment_history CASCADE;
DROP TABLE IF EXISTS appointment_requests CASCADE;
DROP TABLE IF EXISTS provider_availability CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS providers CASCADE;
DROP TABLE IF EXISTS locations CASCADE;

-- ==========================================
-- 1. LOCATIONS TABLE
-- ==========================================
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Locations
INSERT INTO locations (name, address, city, state, zip_code, phone, email) VALUES
('Main Clinic', '123 Medical Center Drive', 'San Francisco', 'CA', '94105', '555-0100', 'main@denticon.com'),
('Downtown Branch', '456 Market Street', 'San Francisco', 'CA', '94102', '555-0200', 'downtown@denticon.com'),
('North Branch', '789 Bay Area Blvd', 'Oakland', 'CA', '94601', '555-0300', 'north@denticon.com');

-- ==========================================
-- 2. PROVIDERS TABLE
-- ==========================================
CREATE TABLE providers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    specialization VARCHAR(100),
    location_id INTEGER REFERENCES locations(id),
    experience_years INTEGER DEFAULT 0,
    education TEXT,
    rating DECIMAL(3,2) DEFAULT 5.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Providers
INSERT INTO providers (first_name, last_name, email, phone, specialization, location_id, experience_years, education, rating) VALUES
('John', 'Smith', 'john.smith@denticon.com', '555-0101', 'General Dentistry', 1, 15, 'DDS, University of California', 4.8),
('Sarah', 'Johnson', 'sarah.johnson@denticon.com', '555-0102', 'Orthodontics', 1, 12, 'DDS, Harvard Dental School', 4.9),
('Michael', 'Brown', 'michael.brown@denticon.com', '555-0103', 'Pediatric Dentistry', 2, 10, 'DDS, Stanford University', 5.0),
('Emily', 'Davis', 'emily.davis@denticon.com', '555-0104', 'Oral Surgery', 2, 8, 'DDS, UCLA School of Dentistry', 4.7),
('David', 'Wilson', 'david.wilson@denticon.com', '555-0105', 'Periodontics', 3, 14, 'DDS, UCSF School of Dentistry', 4.6);

-- ==========================================
-- 3. PATIENTS TABLE
-- ==========================================
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    insurance_provider VARCHAR(100),
    insurance_number VARCHAR(50),
    primary_provider_id INTEGER REFERENCES providers(id),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    medical_history TEXT,
    allergies TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Patients
INSERT INTO patients (first_name, last_name, email, phone, date_of_birth, gender, address, city, state, zip_code, insurance_provider, insurance_number, primary_provider_id, medical_history) VALUES
('Alice', 'Cooper', 'alice.cooper@email.com', '555-1001', '1985-03-15', 'female', '123 Main St', 'San Francisco', 'CA', '94105', 'Blue Cross', 'BC123456', 1, 'No significant medical history'),
('Bob', 'Martin', 'bob.martin@email.com', '555-1002', '1990-07-22', 'male', '456 Oak Ave', 'San Jose', 'CA', '95110', 'Aetna', 'AE789012', 1, 'Diabetes Type 2'),
('Carol', 'White', 'carol.white@email.com', '555-1003', '1978-11-30', 'female', '789 Pine Rd', 'Oakland', 'CA', '94601', 'Cigna', 'CI345678', 2, 'Hypertension'),
('David', 'Green', 'david.green@email.com', '555-1004', '1995-05-18', 'male', '321 Elm St', 'Berkeley', 'CA', '94704', 'United Healthcare', 'UH901234', 3, 'Asthma'),
('Emma', 'Brown', 'emma.brown@email.com', '555-1005', '1988-09-25', 'female', '654 Maple Dr', 'San Francisco', 'CA', '94110', 'Kaiser', 'KA567890', 2, 'No significant medical history'),
('Frank', 'Taylor', 'frank.taylor@email.com', '555-1006', '1982-02-14', 'male', '987 Cedar Ln', 'Daly City', 'CA', '94014', 'Blue Shield', 'BS234567', 4, 'Heart disease'),
('Grace', 'Lee', 'grace.lee@email.com', '555-1007', '1992-08-08', 'female', '147 Birch Ct', 'Redwood City', 'CA', '94061', 'Anthem', 'AN890123', 5, 'Allergies to penicillin'),
('Henry', 'Anderson', 'henry.anderson@email.com', '555-1008', '1975-12-03', 'male', '258 Spruce Way', 'Palo Alto', 'CA', '94301', 'Blue Cross', 'BC456789', 1, 'High cholesterol');

-- ==========================================
-- 4. APPOINTMENTS TABLE
-- ==========================================
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id INTEGER NOT NULL REFERENCES providers(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INTEGER DEFAULT 30, -- minutes
    room_number VARCHAR(20),
    appointment_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    notes TEXT,
    reason TEXT,
    diagnosis TEXT,
    treatment TEXT,
    created_by INTEGER REFERENCES providers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_status CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'))
);

-- Sample Appointments
INSERT INTO appointments (patient_id, provider_id, appointment_date, appointment_time, duration, room_number, appointment_type, status, notes, reason, created_by) VALUES
(1, 1, '2026-03-10', '09:00', 30, '101', 'checkup', 'scheduled', 'Regular checkup', 'Routine dental examination', 1),
(2, 1, '2026-03-10', '10:00', 60, '101', 'filling', 'confirmed', 'Cavity on upper left molar', 'Tooth pain', 1),
(3, 2, '2026-03-11', '14:00', 45, '102', 'consultation', 'scheduled', 'Orthodontic consultation for braces', 'Teeth alignment', 2),
(4, 3, '2026-03-12', '11:00', 30, '103', 'cleaning', 'confirmed', 'Regular cleaning', 'Dental cleaning', 3),
(5, 2, '2026-03-12', '15:30', 30, '102', 'checkup', 'completed', 'Completed routine checkup', 'Regular checkup', 2),
(6, 4, '2026-03-13', '09:30', 90, '104', 'extraction', 'scheduled', 'Wisdom tooth extraction', 'Impacted wisdom tooth', 4),
(1, 1, '2026-03-15', '10:30', 30, '101', 'checkup', 'scheduled', 'Follow-up after filling', 'Follow-up visit', 1),
(7, 5, '2026-03-16', '13:00', 45, '105', 'cleaning', 'scheduled', 'Deep cleaning required', 'Gum disease prevention', 5),
(8, 1, '2026-03-17', '09:00', 60, '101', 'root-canal', 'scheduled', 'Root canal treatment', 'Severe tooth pain', 1),
(3, 2, '2026-03-18', '11:00', 30, '102', 'checkup', 'scheduled', 'Braces adjustment', 'Orthodontic follow-up', 2),
(4, 3, '2026-03-19', '14:30', 30, '103', 'checkup', 'scheduled', 'Pediatric checkup', 'Routine child examination', 3),
(6, 4, '2026-03-20', '10:00', 60, '104', 'surgery', 'scheduled', 'Dental implant consultation', 'Missing tooth replacement', 4);

-- ==========================================
-- 5. APPOINTMENT HISTORY TABLE
-- ==========================================
CREATE TABLE appointment_history (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    changed_by INTEGER REFERENCES providers(id),
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 6. APPOINTMENT REQUESTS TABLE (Public Form)
-- ==========================================
CREATE TABLE appointment_requests (
    id SERIAL PRIMARY KEY,
    
    -- Patient Information
    patient_name VARCHAR(200) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    age INTEGER NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    
    -- Medical Information
    diagnosis_history TEXT,
    reason_for_visit TEXT NOT NULL,
    
    -- Appointment Details
    location_id INTEGER REFERENCES locations(id),
    provider_id INTEGER REFERENCES providers(id), -- NULL if auto-assign
    preferred_date DATE NOT NULL,
    preferred_time TIME NOT NULL,
    
    -- Request Status
    status VARCHAR(20) DEFAULT 'pending',
    
    -- Assignment
    assigned_provider_id INTEGER REFERENCES providers(id),
    assigned_by INTEGER REFERENCES providers(id),
    
    -- Timestamps
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    
    -- Notes
    admin_notes TEXT,
    rejection_reason TEXT,
    
    CONSTRAINT chk_request_status CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'))
);

-- Sample Appointment Requests
INSERT INTO appointment_requests (patient_name, gender, age, phone, email, diagnosis_history, reason_for_visit, location_id, provider_id, preferred_date, preferred_time, status) VALUES
('John Doe', 'male', 35, '555-2001', 'john.doe@email.com', 'No major issues', 'Toothache on lower right side', 1, NULL, '2026-03-15', '10:00', 'pending'),
('Jane Smith', 'female', 28, '555-2002', 'jane.smith@email.com', 'Previous root canal', 'Regular cleaning', 2, 3, '2026-03-16', '14:00', 'pending'),
('Mike Johnson', 'male', 42, '555-2003', 'mike.j@email.com', 'Diabetes', 'Dental checkup', 1, 1, '2026-03-17', '11:00', 'approved');

-- ==========================================
-- 7. PROVIDER AVAILABILITY TABLE
-- ==========================================
CREATE TABLE provider_availability (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES providers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INTEGER DEFAULT 30, -- minutes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_day CHECK (day_of_week BETWEEN 0 AND 6)
);

-- Sample Provider Availability (Monday-Friday, 9 AM - 5 PM)
INSERT INTO provider_availability (provider_id, day_of_week, start_time, end_time, slot_duration) VALUES
-- Dr. John Smith (Provider 1) - Mon-Fri
(1, 1, '09:00', '17:00', 30),
(1, 2, '09:00', '17:00', 30),
(1, 3, '09:00', '17:00', 30),
(1, 4, '09:00', '17:00', 30),
(1, 5, '09:00', '17:00', 30),
-- Dr. Sarah Johnson (Provider 2) - Mon-Fri
(2, 1, '10:00', '18:00', 30),
(2, 2, '10:00', '18:00', 30),
(2, 3, '10:00', '18:00', 30),
(2, 4, '10:00', '18:00', 30),
(2, 5, '10:00', '18:00', 30),
-- Dr. Michael Brown (Provider 3) - Mon-Fri
(3, 1, '08:00', '16:00', 30),
(3, 2, '08:00', '16:00', 30),
(3, 3, '08:00', '16:00', 30),
(3, 4, '08:00', '16:00', 30),
(3, 5, '08:00', '16:00', 30),
-- Dr. Emily Davis (Provider 4) - Tue-Sat
(4, 2, '09:00', '17:00', 30),
(4, 3, '09:00', '17:00', 30),
(4, 4, '09:00', '17:00', 30),
(4, 5, '09:00', '17:00', 30),
(4, 6, '09:00', '13:00', 30),
-- Dr. David Wilson (Provider 5) - Mon-Fri
(5, 1, '09:00', '17:00', 30),
(5, 2, '09:00', '17:00', 30),
(5, 3, '09:00', '17:00', 30),
(5, 4, '09:00', '17:00', 30),
(5, 5, '09:00', '17:00', 30);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_provider ON appointments(provider_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_requests_status ON appointment_requests(status);
CREATE INDEX idx_requests_location ON appointment_requests(location_id);
CREATE INDEX idx_requests_provider ON appointment_requests(assigned_provider_id);
CREATE INDEX idx_requests_date ON appointment_requests(preferred_date);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_providers_location ON providers(location_id);
CREATE INDEX idx_availability_provider ON provider_availability(provider_id);

-- ==========================================
-- VIEWS FOR EASY QUERYING
-- ==========================================

-- View: Appointments with Patient and Provider Details
CREATE VIEW vw_appointments_detail AS
SELECT 
    a.id,
    a.appointment_date,
    a.appointment_time,
    a.duration,
    a.room_number,
    a.appointment_type,
    a.status,
    a.notes,
    a.reason,
    p.id as patient_id,
    p.first_name || ' ' || p.last_name as patient_name,
    p.phone as patient_phone,
    p.email as patient_email,
    pr.id as provider_id,
    pr.first_name || ' ' || pr.last_name as provider_name,
    pr.specialization,
    l.name as location_name
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN providers pr ON a.provider_id = pr.id
LEFT JOIN locations l ON pr.location_id = l.id;

-- View: Appointment Requests with Details
CREATE VIEW vw_appointment_requests_detail AS
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
LEFT JOIN providers ab ON ar.assigned_by = ab.id;

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Function to get available time slots for a provider on a specific date
CREATE OR REPLACE FUNCTION get_available_slots(
    p_provider_id INTEGER,
    p_date DATE
) RETURNS TABLE(time_slot TIME) AS $$
DECLARE
    v_day_of_week INTEGER;
    v_start_time TIME;
    v_end_time TIME;
    v_slot_duration INTEGER;
    v_current_time TIME;
BEGIN
    -- Get day of week (0=Sunday, 1=Monday, etc.)
    v_day_of_week := EXTRACT(DOW FROM p_date);
    
    -- Get provider availability for this day
    SELECT start_time, end_time, slot_duration 
    INTO v_start_time, v_end_time, v_slot_duration
    FROM provider_availability
    WHERE provider_id = p_provider_id 
    AND day_of_week = v_day_of_week 
    AND is_active = true
    LIMIT 1;
    
    -- If provider not available this day, return empty
    IF v_start_time IS NULL THEN
        RETURN;
    END IF;
    
    -- Generate all possible slots
    v_current_time := v_start_time;
    WHILE v_current_time < v_end_time LOOP
        -- Check if slot is not already booked
        IF NOT EXISTS (
            SELECT 1 FROM appointments
            WHERE provider_id = p_provider_id
            AND appointment_date = p_date
            AND appointment_time = v_current_time
            AND status NOT IN ('cancelled', 'no-show')
        ) THEN
            time_slot := v_current_time;
            RETURN NEXT;
        END IF;
        
        -- Move to next slot
        v_current_time := v_current_time + (v_slot_duration || ' minutes')::INTERVAL;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- GRANT PERMISSIONS (adjust as needed)
-- ==========================================
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO denticon_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO denticon_user;

-- ==========================================
-- DATABASE INITIALIZATION COMPLETE
-- ==========================================
