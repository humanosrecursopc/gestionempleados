import { Context, Next } from 'hono';
import { jwtVerify } from 'jose';
import { Env, Variables } from '../types';

export async function authMiddleware(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        const secret = new TextEncoder().encode(c.env.JWT_SECRET || 'kamila-hrm-default-secret');
        const { payload } = await jwtVerify(token, secret);

        c.set('userId', payload.sub as string);
        c.set('companyId', payload.companyId as string);
        c.set('userRole', payload.role as string);

        await next();
    } catch (error) {
        return c.json({ error: 'Invalid or expired token' }, 401);
    }
}

export function rbacMiddleware(allowedRoles: string[]) {
    return async (c: Context<{ Variables: Variables }>, next: Next) => {
        const userRole = c.get('userRole');

        if (!allowedRoles.includes(userRole)) {
            return c.json({ error: 'Forbidden: Insufficient permissions' }, 403);
        }

        await next();
    };
}
