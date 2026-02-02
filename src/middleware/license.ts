import { Context, Next } from 'hono';
import { Env } from '../types';

export async function licenseMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
    const companyId = c.req.header('X-Company-ID');

    if (!companyId) {
        return c.json({ error: 'Company ID is required' }, 400);
    }

    const company = await c.env.DB.prepare(
        'SELECT license_status FROM companies WHERE id = ?'
    ).bind(companyId).first<{ license_status: string }>();

    if (!company || company.license_status !== 'active') {
        return c.json({
            error: 'System Suspended',
            message: 'Global suspension: Payment pending or administrator revoked access.',
            code: 'KILL_SWITCH_ACTIVE'
        }, 403);
    }

    // Master License Check (Simulated for this implementation)
    const masterLicense = await c.env.DB.prepare(
        'SELECT is_active FROM system_license LIMIT 1'
    ).first<{ is_active: boolean }>();

    if (masterLicense && !masterLicense.is_active) {
        return c.json({
            error: 'Platform Unavailable',
            message: 'The Kamila HRM platform is globally disabled.'
        }, 503);
    }

    await next();
}
