# dstack Configuration Server

A Node.js backend server with SQLite database for the dstack configuration editor.

## Features

- **REST API** for managing groups, templates, and configurations
- **SQLite Database** for persistent storage
- **YAML Validation** for configuration content
- **Template System** with predefined Open-R1 configuration
- **Group Management** for organizing configurations
- **Configuration Copying** from templates
- **Static File Serving** for the front-end application

## Quick Start

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Initialize the database:**
   ```bash
   npm run init-db
   ```

3. **Start the server:**
   ```bash
   npm run dev  # Development with auto-reload
   # or
   npm start    # Production
   ```

4. **Access the application:**
   - Web Interface: http://localhost:3001
   - API: http://localhost:3001/api/

## API Endpoints

### Groups
- `GET /api/groups` - Get all groups
- `POST /api/groups` - Create a new group
- `GET /api/groups/:id` - Get a specific group
- `PUT /api/groups/:id` - Update a group
- `DELETE /api/groups/:id` - Delete a group

### Templates
- `GET /api/templates` - Get all templates
- `GET /api/templates/:id` - Get a specific template

### Configurations
- `GET /api/configurations` - Get all configurations
- `GET /api/configurations/with-groups` - Get configurations with group info
- `POST /api/configurations` - Create a new configuration
- `POST /api/configurations/copy-template` - Copy a template to configuration
- `GET /api/configurations/:id` - Get a specific configuration
- `PUT /api/configurations/:id` - Update a configuration
- `DELETE /api/configurations/:id` - Delete a configuration

### System
- `GET /api/health` - Health check endpoint

## Database Schema

### Tables
- **groups**: Organize configurations into groups
- **templates**: Predefined configuration templates
- **configurations**: User-created YAML configurations

### Default Data
- Default group for unorganized configurations
- Open-R1 template with ML training configuration

## Development

- Uses SQLite for simple, file-based database
- Automatic database initialization with schema
- CORS enabled for front-end development
- Body parser with 10MB limit for large YAML files
- Error handling and validation
- Graceful shutdown handling

## File Structure

```
server/
├── package.json          # Dependencies and scripts
├── server.js             # Main server file
├── database/
│   ├── db.js             # Database class with methods
│   ├── schema.sql        # Database schema
│   └── dstack.db         # SQLite database file (created)
├── routes/
│   ├── groups.js         # Group management routes
│   ├── templates.js      # Template routes
│   └── configurations.js # Configuration routes
└── scripts/
    └── init-db.js        # Database initialization script
```

## Environment Variables

- `PORT`: Server port (default: 3001)

## Production Deployment

1. Install dependencies: `npm install --production`
2. Initialize database: `npm run init-db`
3. Start server: `npm start`
4. Configure reverse proxy (nginx/apache) if needed
5. Set up process manager (PM2) for production