import crypto from 'crypto';

function getEnv(key: string, fallback?: string): string {
    const value = process.env[key];
    if (!value && !fallback) {
        console.error(`FATAL: Variável de ambiente ${key} não configurada.`);
        process.exit(1);
    }
    return value || fallback!;
}

// Generate a random JWT secret if not provided (logs warning)
const generatedSecret = crypto.randomBytes(64).toString('hex');
if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET não definido. Usando chave gerada aleatoriamente. Tokens serão invalidados ao reiniciar.');
}

export const config = {
    // Database
    databaseUrl: getEnv('DATABASE_URL', 'postgres://localhost:5432/sgm'),

    // JWT
    jwtSecret: process.env.JWT_SECRET || generatedSecret,
    jwtAccessExpiry: '15m',
    jwtRefreshExpiry: '7d',

    // Security
    bcryptRounds: 12,
    maxLoginAttempts: 5,
    lockoutMinutes: 30,

    // Server
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    port: parseInt(process.env.PORT || '3000', 10),

    // Google OAuth
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
};
