-- Initial Seed for Kamila HRM
-- Use this to initialize the system with 1 Company and 1 Admin User

-- 1. Create System Master License
INSERT INTO system_license (id, organization_name, master_key, is_active)
VALUES 
('sys-001', 'Kamila HRM Cloud', 'master-key-prod-001', TRUE);

-- 2. Create Initial Company
INSERT INTO companies (id, name, rnc, license_key, license_status)
VALUES 
('comp-001', 'Industrias Kamila SRL', '101-00000-1', 'LIC-KAMILA-2026', 'active');

-- 3. Create Admin User (Password: admin123)
-- Hash generated via bcryptjs (salt rounds 10)
INSERT INTO users (id, company_id, email, password_hash, role, is_active)
VALUES 
('user-admin-01', 'comp-001', 'admin@kamila.local', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin', TRUE);

-- 4. Create Initial Departments
INSERT INTO departments (id, company_id, name) VALUES 
('dept-hr', 'comp-001', 'Recursos Humanos'),
('dept-it', 'comp-001', 'Tecnología'),
('dept-ops', 'comp-001', 'Operaciones');

-- 5. Create Initial Positions
INSERT INTO positions (id, company_id, name, base_salary) VALUES 
('pos-mgr', 'comp-001', 'Gerente General', 150000.00),
('pos-dev', 'comp-001', 'Desarrollador Senior', 95000.00),
('pos-hr', 'comp-001', 'Analista RRHH', 45000.00);
