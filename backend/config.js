require('dotenv').config();

/**
 * Centralized configuration for the backend application
 * All environment variables are accessed and validated here
 */

const config = {
    // Server Configuration
    port: parseInt(process.env.PORT) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Database Configuration
    db: {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'auditor_db',
        password: String(process.env.DB_PASSWORD || ''),
        port: parseInt(process.env.DB_PORT) || 5432,
        // Connection pool settings
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection can't be established
    },

    // CORS Configuration
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    },

    // Application Settings
    isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
    isProduction: process.env.NODE_ENV === 'production',
};

/**
 * Validate required configuration
 */
function validateConfig() {
    const required = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PORT'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    if (config.isDevelopment) {
        console.log('⚙️  Configuration loaded successfully');
        console.log(`   Environment: ${config.nodeEnv}`);
        console.log(`   Port: ${config.port}`);
        console.log(`   Database: ${config.db.database}@${config.db.host}:${config.db.port}`);
        console.log(`   CORS Origin: ${config.cors.origin}`);
    }
}

// Validate configuration on module load
validateConfig();

module.exports = config;
