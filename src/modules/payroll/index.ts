import { Hono } from 'hono';
import { Env, Variables } from '../../types';
import { authMiddleware, rbacMiddleware } from '../../middleware/auth';
import { calculatePayroll } from '../../shared/payroll-engine';

const payroll = new Hono<{ Bindings: Env; Variables: Variables }>();

// POST /payroll/calculate/:employeeId
payroll.post('/calculate/:employeeId',
    authMiddleware,
    rbacMiddleware(['Admin', 'RRHH']),
    async (c) => {
        const companyId = c.get('companyId');
        const employeeId = c.req.param('employeeId');
        const { period_start, period_end } = await c.req.json();

        // 1. Get Employee and Position Data
        const employee = await c.env.DB.prepare(`
      SELECT e.*, p.base_salary 
      FROM employees e
      JOIN positions p ON e.position_id = p.id
      WHERE e.id = ? AND e.company_id = ?
    `).bind(employeeId, companyId).first<{ base_salary: number }>();

        if (!employee) return c.json({ error: 'Employee not found' }, 404);

        // 2. Run DR Payroll Engine
        const results = calculatePayroll(employee.base_salary);
        const netSalary = employee.base_salary - (results.sfs + results.afp + results.isr);

        // 3. Store result
        const payrollId = crypto.randomUUID();
        await c.env.DB.prepare(`
      INSERT INTO payroll_results (
        id, company_id, employee_id, period_start, period_end, 
        gross_salary, sfs_deduction, afp_deduction, isr_deduction, net_salary,
        employer_sfs, employer_afp, employer_srl, infotep, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
            payrollId, companyId, employeeId, period_start, period_end,
            employee.base_salary, results.sfs, results.afp, results.isr, netSalary,
            results.employer_sfs, results.employer_afp, results.employer_srl, results.infotep
        ).run();

        return c.json({
            id: payrollId,
            calculation: {
                gross: employee.base_salary,
                deductions: { sfs: results.sfs, afp: results.afp, isr: results.isr },
                net: netSalary,
                employer_contributions: {
                    sfs: results.employer_sfs,
                    afp: results.employer_afp,
                    srl: results.employer_srl,
                    infotep: results.infotep
                }
            }
        });
    });

// POST /payroll/approve/:payrollId - Requires OTP
payroll.post('/approve/:payrollId', authMiddleware, async (c) => {
    const { otp } = await c.req.json();

    // REAL WORLD: Verify OTP here via Twilio or internal TOTP
    if (otp !== '123456') { // Mock validation for demo
        return c.json({ error: 'Invalid OTP' }, 403);
    }

    const payrollId = c.req.param('payrollId');
    await c.env.DB.prepare(
        'UPDATE payroll_results SET status = "approved", otp_verified = TRUE, approved_by = ? WHERE id = ?'
    ).bind(c.get('userId'), payrollId).run();

    return c.json({ message: 'Payroll approved and ready for dispersal' });
});

export default payroll;
