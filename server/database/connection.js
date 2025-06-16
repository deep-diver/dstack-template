const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseConnection {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, 'dstack_templates.db');
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database at:', this.dbPath);
                    this.setupDatabase()
                        .then(() => resolve())
                        .catch(reject);
                }
            });
        });
    }

    async setupDatabase() {
        return new Promise((resolve, reject) => {
            const initSqlPath = path.join(__dirname, 'init.sql');
            const initSql = fs.readFileSync(initSqlPath, 'utf8');
            
            this.db.exec(initSql, (err) => {
                if (err) {
                    console.error('Error initializing database:', err);
                    reject(err);
                } else {
                    console.log('Database tables initialized successfully');
                    resolve();
                }
            });
        });
    }

    getDatabase() {
        if (!this.db) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return this.db;
    }

    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                        reject(err);
                    } else {
                        console.log('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    // Helper method to run queries with promises
    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // Helper method to get single row
    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Helper method to get all rows
    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Method to generate content hash
    generateContentHash(title, yamlContent) {
        const crypto = require('crypto');
        const normalizedContent = yamlContent.trim().replace(/\s+/g, ' ');
        const normalizedTitle = title.trim().toLowerCase();
        const combined = `${normalizedTitle}:${normalizedContent}`;
        return crypto.createHash('sha256').update(combined).digest('hex');
    }
}

// Export singleton instance
const dbConnection = new DatabaseConnection();
module.exports = dbConnection;