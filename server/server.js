require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const Database = require('./database/db');

// Import routes
const groupsRouter = require('./routes/groups');
const templatesRouter = require('./routes/templates');
const configurationsRouter = require('./routes/configurations');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
const db = new Database();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Attach database to request object
app.use((req, res, next) => {
    req.db = db;
    next();
});

// Static files - serve the front-end
app.use(express.static(path.join(__dirname, '..')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/configurations', configurationsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'dstack-config-server'
    });
});

// Serve the main application for any non-API routes
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '..', 'index.html'));
    } else {
        res.status(404).json({ error: 'API endpoint not found' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// Initialize database and start server
async function startServer() {
    try {
        console.log('✅ SQLite database initialized successfully');
        
        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 dstack Configuration Server running on http://localhost:${PORT}`);
            console.log(`📊 API endpoints available at http://localhost:${PORT}/api/`);
            console.log(`🎨 Web interface available at http://localhost:${PORT}`);
            console.log(`🗄️ SQLite database: ${path.join(__dirname, 'database', 'dstack.db')}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    try {
        await db.close();
        console.log('📊 Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

// Start the server
startServer();

module.exports = app;