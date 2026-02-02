import { Hono } from 'hono';
import { SignJWT } from 'jose';
import { compare } from 'bcryptjs';
import { Env } from '../../types';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const auth = new Hono<{ Bindings: Env }>();

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

auth.post('/login', zValidator('json', loginSchema), async (c) => {
    const { email, password } = c.req.valid('json');

    // 1. Find User
    const user = await c.env.DB.prepare(`
    SELECT u.*, c.license_status 
    FROM users u
    JOIN companies c ON u.company_id = c.id
    WHERE u.email = ?
  `).bind(email).first<any>();

    if (!user) {
        return c.json({ error: 'Invalid credentials' }, 401);
    }

    // 2. Check Company Status (Kill-Switch Level 1)
    if (user.license_status !== 'active') {
        return c.json({
            error: 'Access Denied',
            message: 'Your company license is suspended.'
        }, 403);
    }

    // 3. Verify Password
    const validPassword = await compare(password, user.password_hash);
    if (!validPassword) {
        return c.json({ error: 'Invalid credentials' }, 401);
    }

    // 4. Generate JWT
    const secret = new TextEncoder().encode(c.env.JWT_SECRET || 'kamila-hrm-default-secret');
    const token = await new SignJWT({
        sub: user.id,
        companyId: user.company_id,
        role: user.role
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('8h')
        .sign(secret);

    // 5. Audit Login (Async)
    c.executionCtx.waitUntil(
        c.env.DB.prepare(
            'INSERT INTO audit_logs (company_id, user_id, action, resource, details) VALUES (?, ?, ?, ?, ?)'
        ).bind(user.company_id, user.id, 'LOGIN', 'auth', 'Successful login').run()
    );

    return c.json({
        token,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            companyId: user.company_id
        }
    });
});

export default auth;
