import { Hono } from 'hono';
import { Env, Variables } from '../../types';
import { authMiddleware, rbacMiddleware } from '../../middleware/auth';

const systems = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /systems/software - Inventory
systems.get('/software', authMiddleware, async (c) => {
    const companyId = c.get('companyId');
    const licenses = await c.env.DB.prepare(
        'SELECT * FROM software_licenses WHERE company_id = ?'
    ).bind(companyId).all();

    return c.json(licenses.results);
});

// GET /systems/software/budget - KPIs
systems.get('/software/budget', authMiddleware, async (c) => {
    const companyId = c.get('companyId');
    const stats = await c.env.DB.prepare(`
    SELECT 
      SUM(monthly_cost) as monthly_spend,
      SUM(monthly_cost * 12) as annual_spend,
      COUNT(*) as total_apps
    FROM software_licenses
    WHERE company_id = ?
  `).bind(companyId).first();

    return c.json(stats);
});

// Admin Only: License Revocation (Kill-Switch)
systems.post('/admin/lock-company',
    authMiddleware,
    rbacMiddleware(['Admin']),
    async (c) => {
        const { targetCompanyId, status } = await c.req.json();

        await c.env.DB.prepare(
            'UPDATE companies SET license_status = ? WHERE id = ?'
        ).bind(status, targetCompanyId).run();

        return c.json({ message: `Company license status updated to ${status}` });
    });

export default systems;
