#!/usr/bin/env node

const dbConnection = require('../database/connection');

async function showStats() {
    await dbConnection.initialize();
    
    console.log('\n📊 Database Statistics:');
    console.log('='.repeat(50));
    
    // Show table counts
    const tables = [
        'community_templates',
        'template_likes', 
        'user_configs',
        'config_analytics'
    ];
    
    for (const table of tables) {
        try {
            const result = await dbConnection.get(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(`${table.padEnd(20)}: ${result.count} records`);
        } catch (error) {
            console.log(`${table.padEnd(20)}: Error - ${error.message}`);
        }
    }
    
    // Show recent templates
    try {
        const recentTemplates = await dbConnection.all(`
            SELECT title, author_name, category, like_count, view_count, created_at 
            FROM community_templates 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        
        if (recentTemplates.length > 0) {
            console.log('\n📋 Recent Templates:');
            console.log('-'.repeat(50));
            recentTemplates.forEach((template, i) => {
                console.log(`${i + 1}. "${template.title}" by ${template.author_name || 'Unknown'}`);
                console.log(`   Category: ${template.category || 'None'}, Likes: ${template.like_count}, Views: ${template.view_count}`);
                console.log(`   Created: ${new Date(template.created_at).toLocaleString()}\n`);
            });
        } else {
            console.log('\n📋 No templates found in database');
        }
    } catch (error) {
        console.log('\n❌ Error fetching recent templates:', error.message);
    }
    
    await dbConnection.close();
}

async function clearDatabase() {
    await dbConnection.initialize();
    
    console.log('\n🗑️  Clearing database...');
    
    try {
        await dbConnection.run('DELETE FROM config_analytics');
        await dbConnection.run('DELETE FROM template_likes');
        await dbConnection.run('DELETE FROM community_templates');
        await dbConnection.run('DELETE FROM user_configs');
        
        // Reset auto-increment counters
        await dbConnection.run('DELETE FROM sqlite_sequence');
        
        console.log('✅ Database cleared successfully');
    } catch (error) {
        console.log('❌ Error clearing database:', error.message);
    }
    
    await dbConnection.close();
}

async function testInsert() {
    await dbConnection.initialize();
    
    console.log('\n🧪 Testing template insertion...');
    
    try {
        const contentHash = dbConnection.generateContentHash('Test Template', 'type: task\nname: test');
        
        const result = await dbConnection.run(`
            INSERT INTO community_templates (
                title, description, emoji, category, yaml_content, filename,
                author_id, author_name, author_username, author_avatar_url,
                content_hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            'Test Template',
            'A test configuration template',
            '🧪',
            'testing',
            'type: task\nname: test\ncommands:\n  - echo "Hello World"',
            'test.yml',
            'test_user_123',
            'Test User',
            'testuser',
            'https://avatars.githubusercontent.com/u/1?v=4',
            contentHash
        ]);
        
        console.log(`✅ Test template inserted with ID: ${result.id}`);
    } catch (error) {
        console.log('❌ Error inserting test template:', error.message);
    }
    
    await dbConnection.close();
}

// Command line interface
const command = process.argv[2];

switch (command) {
    case 'stats':
        showStats();
        break;
    case 'clear':
        clearDatabase();
        break;
    case 'test':
        testInsert();
        break;
    default:
        console.log(`
📊 Database Administration Tool

Usage: node db-admin.js <command>

Commands:
  stats   - Show database statistics
  clear   - Clear all data from database
  test    - Insert a test template

Examples:
  node db-admin.js stats
  node db-admin.js clear
  node db-admin.js test
`);
}