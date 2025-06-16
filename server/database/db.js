const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        const dbPath = path.join(__dirname, 'dstack.db');
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database');
                this.initializeTables();
            }
        });
    }

    initializeTables() {
        const initSqlPath = path.join(__dirname, 'init.sql');
        try {
            const initSql = fs.readFileSync(initSqlPath, 'utf8');
            this.db.exec(initSql, (err) => {
                if (err) {
                    console.error('Error initializing database tables:', err.message);
                } else {
                    console.log('Database tables initialized successfully');
                }
            });
        } catch (error) {
            console.error('Error reading init.sql file:', error.message);
        }
    }

    // Promisify database operations
    run(sql, params = []) {
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

    get(sql, params = []) {
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

    all(sql, params = []) {
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

    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    // Groups methods
    async createGroup(id, name, description = null) {
        const sql = `INSERT INTO groups (id, name, description) VALUES (?, ?, ?)`;
        return await this.run(sql, [id, name, description]);
    }

    async getGroups() {
        const sql = `SELECT * FROM groups ORDER BY name`;
        return await this.all(sql);
    }

    async getGroup(id) {
        const sql = `SELECT * FROM groups WHERE id = ?`;
        return await this.get(sql, [id]);
    }

    async updateGroup(id, name, description = null) {
        const sql = `UPDATE groups SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        return await this.run(sql, [name, description, id]);
    }

    async deleteGroup(id) {
        const sql = `DELETE FROM groups WHERE id = ? AND id != 'default'`;
        return await this.run(sql, [id]);
    }

    // Templates methods
    async getTemplates() {
        const sql = `SELECT * FROM templates ORDER BY name`;
        return await this.all(sql);
    }

    async getTemplate(id) {
        const sql = `SELECT * FROM templates WHERE id = ?`;
        return await this.get(sql, [id]);
    }

    // Configurations methods
    async createConfiguration(id, name, groupId, yamlContent, description = null, isTemplateCopy = false, sourceTemplateId = null) {
        const sql = `INSERT INTO configurations (id, name, group_id, yaml_content, description, is_template_copy, source_template_id) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        return await this.run(sql, [id, name, groupId, yamlContent, description, isTemplateCopy, sourceTemplateId]);
    }

    async getConfigurations(groupId = null) {
        let sql = `SELECT * FROM configurations`;
        let params = [];
        
        if (groupId) {
            sql += ` WHERE group_id = ?`;
            params.push(groupId);
        }
        
        sql += ` ORDER BY name`;
        return await this.all(sql, params);
    }

    async getConfiguration(id) {
        const sql = `SELECT * FROM configurations WHERE id = ?`;
        return await this.get(sql, [id]);
    }

    async updateConfiguration(id, name, yamlContent, description = null) {
        const sql = `UPDATE configurations SET name = ?, yaml_content = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        return await this.run(sql, [name, yamlContent, description, id]);
    }

    async deleteConfiguration(id) {
        const sql = `DELETE FROM configurations WHERE id = ?`;
        return await this.run(sql, [id]);
    }

    // Get configurations with group info
    async getConfigurationsWithGroups() {
        const sql = `
            SELECT c.*, g.name as group_name 
            FROM configurations c 
            LEFT JOIN groups g ON c.group_id = g.id 
            ORDER BY g.name, c.name
        `;
        return await this.all(sql);
    }
}

module.exports = Database;