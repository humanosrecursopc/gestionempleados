import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Env, Variables } from './types';
import { licenseMiddleware } from './middleware/license';

// Import Modules
import employees from './modules/employees';
import payroll from './modules/payroll';
import attendance from './modules/attendance';
import systems from './modules/systems';
import auth from './modules/auth';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Global Middlewares
app.use('*', logger());
app.use('*', cors());

// Error Handling
app.onError((err, c) => {
	console.error(`${err}`);
	return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

// Health Check & Master Info
app.get('/', (c) => {
	return c.json({
		name: 'Kamila HRM API',
		version: '1.0.0',
		platform: 'Cloudflare Workers + D1',
		region: 'DR 🇩🇴',
		status: 'Operational'
	});
});

/**
 * Public Webhooks (No license check or auth required)
 * Used by biometric terminals
 */
app.route('/attendance/webhook', attendance);

/**
 * Protected Routes
 * These require the License Middleware (Kill-Switch)
 */
app.use('/api/*', licenseMiddleware);

// API Routes
app.route('/api/auth', auth);
app.route('/api/employees', employees);
app.route('/api/payroll', payroll);
app.route('/api/attendance', attendance);
app.route('/api/systems', systems);

/**
 * Global Kill-Switch Screen (For Frontend consumption)
 */
app.get('/system/status', async (c) => {
	const companyId = c.req.header('X-Company-ID');
	if (!companyId) return c.json({ status: 'ok' });

	const company = await c.env.DB.prepare(
		'SELECT license_status FROM companies WHERE id = ?'
	).bind(companyId).first<{ license_status: string }>();

	if (company && company.license_status !== 'active') {
		return c.json({
			suspended: true,
			reason: 'El sistema ha sido suspendido. Contacte a soporte de Kamila HRM.'
		});
	}

	return c.json({ suspended: false });
});

export default app;
