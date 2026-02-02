import { Hono } from 'hono';
import { Env, Variables } from '../../types';
import { authMiddleware, rbacMiddleware } from '../../middleware/auth';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const employees = new Hono<{ Bindings: Env; Variables: Variables }>();

const createEmployeeSchema = z.object({
    first_name: z.string(),
    last_name: z.string(),
    cedula: z.string(),
    hiring_date: z.string(),
    department_id: z.string(),
    position_id: z.string(),
    location: z.enum(['Central', 'Norte', 'Remoto']),
    bank_name: z.string().optional(),
    account_type: z.string().optional(),
    encrypted_account_number: z.string().optional(),
});

// GET /employees - List with filters
employees.get('/', authMiddleware, async (c) => {
    const companyId = c.get('companyId');
    const { department, position, location } = c.req.query();

    let query = 'SELECT * FROM employees WHERE company_id = ?';
    const params: any[] = [companyId];

    if (department) {
        query += ' AND department_id = ?';
        params.push(department);
    }
    if (position) {
        query += ' AND position_id = ?';
        params.push(position);
    }
    if (location) {
        query += ' AND location = ?';
        params.push(location);
    }

    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    return c.json(results);
});

// POST /employees - Create
employees.post('/',
    authMiddleware,
    rbacMiddleware(['Admin', 'RRHH']),
    zValidator('json', createEmployeeSchema),
    async (c) => {
        const data = c.req.valid('json');
        const companyId = c.get('companyId');
        const employeeId = crypto.randomUUID();

        await c.env.DB.prepare(`
      INSERT INTO employees (id, company_id, first_name, last_name, cedula, hiring_date, department_id, position_id, location, bank_name, account_type, encrypted_account_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
            employeeId,
            companyId,
            data.first_name,
            data.last_name,
            data.cedula,
            data.hiring_date,
            data.department_id,
            data.position_id,
            data.location,
            data.bank_name || null,
            data.account_type || null,
            data.encrypted_account_number || null
        ).run();

        return c.json({ id: employeeId, message: 'Employee created successfully' }, 201);
    });

// GET /employees/stats - KPIs
employees.get('/stats', authMiddleware, async (c) => {
    const companyId = c.get('companyId');

    const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) FILTER (WHERE status = 'active') as active_count,
      COUNT(*) FILTER (WHERE hiring_date >= date('now', 'start of month')) as new_hires_month,
      COUNT(*) FILTER (WHERE termination_date >= date('now', 'start of month')) as departures_month
    FROM employees
    WHERE company_id = ?
  `).bind(companyId).first();

    return c.json(stats);
});

export default employees;
