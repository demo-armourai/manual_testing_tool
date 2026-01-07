const { Pool } = require('pg');
const config = require('./config');

/**
 * PostgreSQL connection pool using centralized configuration
 */
const pool = new Pool(config.db);

/**
 * Test database connection on initialization
 */
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Database connection failed:', err.stack);
        console.error('   Please ensure PostgreSQL is running and credentials are correct');
        if (config.isDevelopment) {
            console.error('   Connection details:', {
                host: config.db.host,
                port: config.db.port,
                database: config.db.database,
                user: config.db.user
            });
        }
    } else {
        console.log('✅ Database connected successfully');
        if (config.isDevelopment) {
            console.log(`   Connected to: ${config.db.database}@${config.db.host}:${config.db.port}`);
        }
        release(); // release client back to pool
    }
});

/**
 * Handle pool errors
 */
pool.on('error', (err, client) => {
    console.error('❌ Unexpected database error on idle client', err);
    process.exit(-1);
});

/**
 * Graceful shutdown - close all database connections
 */
async function shutdown() {
    try {
        console.log('🔄 Closing database connections...');
        await pool.end();
        console.log('✅ Database connections closed');
    } catch (err) {
        console.error('❌ Error closing database connections:', err);
        throw err;
    }
}

/**
 * Execute a query with automatic error logging
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
async function query(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        if (config.isDevelopment) {
            const duration = Date.now() - start;
            if (duration > 1000) {
                console.warn(`⚠️  Slow query (${duration}ms):`, text.substring(0, 100));
            }
        }
        return res;
    } catch (err) {
        console.error('❌ Database query error:', err.message);
        if (config.isDevelopment) {
            console.error('   Query:', text);
            console.error('   Params:', params);
        }
        throw err;
    }
}

module.exports = {
    query,
    pool,
    shutdown,
};
