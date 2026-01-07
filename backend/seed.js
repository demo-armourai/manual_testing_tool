const fs = require('fs');
const path = require('path');
const db = require('./db');

const seedFile = path.join(__dirname, '..', 'database', 'seed_data.sql');

async function seedDatabase() {
    try {
        console.log('Reading seed file...');
        const seedSql = fs.readFileSync(seedFile, 'utf8');

        console.log('Connecting to database...');
        // Simple query to verify connection
        await db.query('SELECT NOW()');
        console.log('Connected!');

        console.log('Running seed SQL...');
        await db.query(seedSql);

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
}

seedDatabase();
