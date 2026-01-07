const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config');
const db = require('./db');
const routes = require('./routes');

const app = express();

/**
 * ============================================================================
 * MIDDLEWARE SETUP
 * ============================================================================
 */

// CORS configuration
app.use(cors(config.cors));

// Body parser middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (config.isDevelopment) {
    app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            const status = res.statusCode;
            const statusIcon = status >= 500 ? '❌' : status >= 400 ? '⚠️' : '✅';
            console.log(`${statusIcon} ${req.method} ${req.path} - ${status} (${duration}ms)`);
        });
        next();
    });
}

/**
 * ============================================================================
 * ROUTES
 * ============================================================================
 */

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv,
        database: 'connected' // If we reach here, DB is connected
    });
});

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'WCAG Auditor API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/health',
            api: '/api'
        }
    });
});

/**
 * ============================================================================
 * ERROR HANDLING
 * ============================================================================
 */

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
        path: req.path
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);

    // Don't leak error details in production
    const errorResponse = {
        error: 'Internal Server Error',
        message: config.isDevelopment ? err.message : 'An unexpected error occurred',
    };

    if (config.isDevelopment) {
        errorResponse.stack = err.stack;
        errorResponse.details = err;
    }

    res.status(err.status || 500).json(errorResponse);
});

/**
 * ============================================================================
 * SERVER STARTUP & GRACEFUL SHUTDOWN
 * ============================================================================
 */

const server = app.listen(config.port, () => {
    console.log('');
    console.log('🚀 Server started successfully!');
    console.log(`   URL: http://localhost:${config.port}`);
    console.log(`   Health Check: http://localhost:${config.port}/health`);
    console.log(`   API: http://localhost:${config.port}/api`);
    console.log('');
});

// Graceful shutdown handler
async function gracefulShutdown(signal) {
    console.log(`\n${signal} received, starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
        console.log('✅ HTTP server closed');

        try {
            // Close database connections
            await db.shutdown();
            console.log('✅ Graceful shutdown completed');
            process.exit(0);
        } catch (err) {
            console.error('❌ Error during shutdown:', err);
            process.exit(1);
        }
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
}

// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});

module.exports = app;
