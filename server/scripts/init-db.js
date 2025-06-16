const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, '..', 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'dstack.db');

// Remove existing database file
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Removed existing database');
}

// Create new database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error creating database:', err.message);
        return;
    }
    console.log('Connected to SQLite database');
});

// Read and execute schema
const schemaPath = path.join(dbDir, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Split schema into individual statements and execute
const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);

db.serialize(() => {
    statements.forEach((statement, index) => {
        db.run(statement, (err) => {
            if (err) {
                console.error(`Error executing statement ${index + 1}:`, err.message);
                console.error('Statement:', statement);
            } else {
                console.log(`Executed statement ${index + 1} successfully`);
            }
        });
    });
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
    } else {
        console.log('Database initialized successfully!');
        console.log('Database location:', dbPath);
    }
});