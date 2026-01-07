const fs = require('fs');
const path = require('path');
const db = require('./db');

(async () => {
    const client = await db.pool.connect();
    try {
        console.log('🔄 Initializing database...');
        const sqlPath = path.join(__dirname, '../database/init-db.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query(sql);
        console.log('✅ Database initialized successfully');
    } catch (err) {
        console.error('❌ Error initializing database:', err);
        process.exit(1);
    } finally {
        client.release();
        // Since the pool is global in db.js, we might need to explicitly end it to exit the script clean if it wasn't exported. 
        // But checking db.js, it exports { query }. It doesn't export the pool.
        // Wait, I need to check if db.js exports the pool or just a query function.
        // If it just exports query, I can't restart the pool easily, but I can just rely on the script ending.
        // Actually, let's re-read db.js to be sure about the export.

        process.exit(0);
    }
})();
