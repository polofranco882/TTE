-- Migration for Role-Based Reporting Module v2
-- Adds Attendance and Academic Record tracking

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES modules(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'present', -- 'present', 'absent', 'late', 'justified'
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Academic Records Table (Grades/Tasks/Participation)
CREATE TABLE IF NOT EXISTS academic_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES modules(id) ON DELETE SET NULL,
    record_type VARCHAR(50) NOT NULL, -- 'task', 'exam', 'participation', 'project'
    title VARCHAR(255),
    score NUMERIC(5, 2),
    max_score NUMERIC(5, 2) DEFAULT 10.00,
    feedback TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_academic_user ON academic_records(user_id);
CREATE INDEX IF NOT EXISTS idx_academic_module ON academic_records(module_id);
