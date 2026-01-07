const fs = require('fs');
const path = require('path');
const db = require('./db');

const clearScript = path.join(__dirname, '..', 'database', 'clear-data.sql');

async function clearDatabase() {
    try {
        console.log('Reading clear-data script...');
        const clearSql = fs.readFileSync(clearScript, 'utf8');

        console.log('Connecting to database...');
        await db.query('SELECT NOW()');
        console.log('Connected!');

        console.log('Clearing user data (Audits, Findings, Pages)...');
        await db.query(clearSql);

        console.log('Database cleared successfully! (WCAG Checklist preserved)');
        process.exit(0);
    } catch (err) {
        console.error('Error clearing database:', err);
        process.exit(1);
    }
}

clearDatabase();
