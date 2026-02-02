-- Kamila HRM - Initial Schema
-- Designed by Senior Software Architect for Cloudflare Workers + D1

-- 1. Tenants / Companies
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    rnc TEXT UNIQUE NOT NULL, -- Registro Nacional de Contribuyente (DR)
    license_key TEXT UNIQUE NOT NULL,
    license_status TEXT DEFAULT 'active', -- active, suspended, expired
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Infrastructure
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS positions (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    name TEXT NOT NULL,
    base_salary DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- 3. Human Capital (Expediente Digital)
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    cedula TEXT UNIQUE NOT NULL, -- National ID
    email TEXT,
    phone TEXT,
    address TEXT,
    department_id TEXT,
    position_id TEXT,
    location TEXT CHECK(location IN ('Central', 'Norte', 'Remoto')),
    status TEXT DEFAULT 'active',
    hiring_date DATE NOT NULL,
    termination_date DATE,
    bank_name TEXT,
    account_type TEXT, -- Ahorros / Corriente
    encrypted_account_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (position_id) REFERENCES positions(id)
);

-- 4. Document Management
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'ID', 'MEDICAL', 'CERTIFICATE', 'CONTRACT'
    file_path TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    metadata TEXT, -- JSON with details
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- 5. Attendance & Biometrics
CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    clock_in DATETIME NOT NULL,
    clock_out DATETIME,
    latitude REAL,
    longitude REAL,
    device_id TEXT, -- For Hikvision or Mobile ID
    status TEXT DEFAULT 'on_time', 
    is_valid BOOLEAN DEFAULT TRUE, -- Anti-fraud check
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- 6. Payroll (Nómina Dominicana)
CREATE TABLE IF NOT EXISTS payroll_results (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    gross_salary DECIMAL(12, 2) NOT NULL,
    sfs_deduction DECIMAL(12, 2) NOT NULL, -- 3.04% employee
    afp_deduction DECIMAL(12, 2) NOT NULL, -- 2.87% employee
    isr_deduction DECIMAL(12, 2) NOT NULL, -- Progressive DGII
    net_salary DECIMAL(12, 2) NOT NULL,
    employer_sfs DECIMAL(12, 2) NOT NULL, -- 7.09% employer
    employer_afp DECIMAL(12, 2) NOT NULL, -- 7.10% employer
    employer_srl DECIMAL(12, 2) NOT NULL, -- ~1.10% employer
    infotep DECIMAL(12, 2) NOT NULL,      -- 1% employer
    status TEXT DEFAULT 'pending', -- pending, approved, paid
    approved_by TEXT,
    otp_verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- 7. Software License Management (Systems Module)
CREATE TABLE IF NOT EXISTS software_licenses (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    app_name TEXT NOT NULL,
    total_seats INTEGER NOT NULL,
    used_seats INTEGER DEFAULT 0,
    monthly_cost DECIMAL(12, 2),
    expiry_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- 8. RBAC & Security
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    employee_id TEXT, -- Optional, for employee portal
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('Admin', 'RRHH', 'Operador')) NOT NULL,
    otp_secret TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- 9. System License (Master Kill-Switch)
CREATE TABLE IF NOT EXISTS system_license (
    id TEXT PRIMARY KEY,
    organization_name TEXT NOT NULL,
    master_key TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_check DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id TEXT NOT NULL,
    user_id TEXT,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Indexes
CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_attendance_employee ON attendance(employee_id);
CREATE INDEX idx_payroll_period ON payroll_results(period_start, period_end);
CREATE INDEX idx_audit_company ON audit_logs(company_id);
