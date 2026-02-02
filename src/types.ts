export interface Env {
    DB: D1Database;
    JWT_SECRET: string;
    MASTER_KEY: string;
}

export type Variables = {
    companyId: string;
    userId: string;
    userRole: string;
};
