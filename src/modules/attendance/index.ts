import { Hono } from 'hono';
import { Env, Variables } from '../../types';
import { authMiddleware } from '../../middleware/auth';

const attendance = new Hono<{ Bindings: Env; Variables: Variables }>();

// POST /attendance/punch - Mobile App or Web Kiosk
attendance.post('/punch', authMiddleware, async (c) => {
    const { employeeId, type, latitude, longitude, deviceId } = await c.req.json();
    const companyId = c.get('companyId');

    // Anti-fraud: Verify geolocation if provided (Simplified)
    if (latitude && longitude) {
        // Check if within allowed radius of "Central" or "Norte" etc.
    }

    const punchId = crypto.randomUUID();
    const now = new Date().toISOString();

    if (type === 'IN') {
        await c.env.DB.prepare(`
      INSERT INTO attendance (id, employee_id, clock_in, latitude, longitude, device_id, status)
      VALUES (?, ?, ?, ?, ?, ?, 'on_time')
    `).bind(punchId, employeeId, now, latitude || null, longitude || null, deviceId || 'Web').run();
    } else {
        // Find last open entry
        await c.env.DB.prepare(`
      UPDATE attendance 
      SET clock_out = ?, latitude = ?, longitude = ?
      WHERE employee_id = ? AND clock_out IS NULL
    `).bind(now, latitude || null, longitude || null, employeeId).run();
    }

    return c.json({ message: `Punch ${type} registered` });
});

// POST /attendance/webhook/hikvision - External Terminal
attendance.post('/webhook/hikvision', async (c) => {
    const data = await c.req.json();
    // Hikvision facial terminal payload structure
    const { employee_code, event_time, device_id } = data;

    // 1. Map employee_code to employee_id
    const employee = await c.env.DB.prepare('SELECT id FROM employees WHERE cedula = ?').bind(employee_code).first<{ id: string }>();

    if (employee) {
        await c.env.DB.prepare(`
      INSERT INTO attendance (id, employee_id, clock_in, device_id, status)
      VALUES (?, ?, ?, ?, 'biometric')
    `).bind(crypto.randomUUID(), employee.id, event_time, device_id).run();
    }

    return c.json({ status: 'OK' });
});

export default attendance;
