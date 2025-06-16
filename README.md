# dstack Configuration Management

A modern, interactive web application for creating, managing, and sharing dstack configurations with a visual editor and YAML viewer.

![dstack config management](https://img.shields.io/badge/dstack-config-blue)
![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

### 🎨 Visual Configuration Editor
- **Intuitive Form-Based UI**: Create dstack configurations without writing YAML
- **Real-time Sync**: Visual editor and YAML viewer stay in perfect sync
- **Smart Field Management**: Add/remove fields dynamically with Quick Add buttons
- **Collapsible Sections**: Organize complex configurations with expandable/collapsible YAML sections

### 📝 Built-in Templates
- **dstack Complete**: Comprehensive template with all supported fields
- **Axolotl Fine-tuning**: Ready-to-use configuration for LLM fine-tuning
- **vLLM Deployment**: High-performance inference service setup
- **TRL Training**: Reinforcement learning configuration for language models

### 🌐 Community Features
- **Share Configurations**: Share your configurations with the community
- **GitHub Authentication**: Secure login with GitHub OAuth
- **Like System**: Like and discover popular configurations
- **Top Templates**: See the most liked templates in the sidebar

### 🛠️ Developer Features
- **YAML Syntax Highlighting**: CodeMirror-powered editor with syntax highlighting
- **Copy to Clipboard**: One-click YAML copying
- **Export/Import**: Save and load configurations locally
- **Auto-save**: Configurations are automatically saved to browser storage

## Prerequisites

- Node.js (v14.0.0 or higher)
- npm or yarn
- A GitHub OAuth App (for authentication features)

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/dstack-template.git
cd dstack-template
```

2. **Install dependencies**
```bash
cd server
npm install
```

3. **Set up environment variables**

Create a `.env` file in the `server` directory:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback

# Session Secret (generate a random string)
SESSION_SECRET=your_random_session_secret

# Frontend URL
FRONTEND_URL=http://localhost:8080
```

4. **Initialize the database**
```bash
cd server
npm run init-db
```

## Running the Application

### Development Mode

1. **Start the backend server**
```bash
cd server
npm run dev
```
The server will start on `http://localhost:3001`

2. **Start the frontend**

In a new terminal:
```bash
cd dstack-template
python -m http.server 8080
```
Or if you prefer using Node.js:
```bash
npx http-server -p 8080
```

3. **Access the application**

Open your browser and navigate to `http://localhost:8080`

### Production Mode

1. **Start the server**
```bash
cd server
npm start
```

2. **Serve the frontend**

Use a production-grade web server like nginx or Apache to serve the static files.

Example nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/dstack-template;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## GitHub OAuth Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: dstack Config Manager
   - **Homepage URL**: `http://localhost:8080` (development) or your production URL
   - **Authorization callback URL**: `http://localhost:3001/api/auth/github/callback`
4. Copy the Client ID and Client Secret to your `.env` file

## Usage Guide

### Creating a Configuration

1. **Using Visual Editor**:
   - Click on form fields to edit values
   - Use Quick Add buttons to add missing fields
   - Arrays can be managed with + and - buttons
   - All changes sync automatically to YAML viewer

2. **Using YAML Editor**:
   - Click on the YAML viewer to see the raw configuration
   - Use the collapse/expand arrows to manage sections
   - Copy the YAML with the copy button

3. **Using Templates**:
   - Click on a template from the left navigation
   - Modify the template to suit your needs
   - Save or share your customized configuration

### Sharing Configurations

1. Click the "Share" button (requires GitHub login)
2. Add a title and description for your configuration
3. Choose an emoji and category
4. Click "Share to Community"

### Managing Shared Configurations

- **View**: Click "Explore" to see all community configurations
- **Like**: Click the heart icon on any configuration (requires login)
- **Delete**: Click the trash icon on your own shared configurations
- **Load**: Click on any shared configuration to load it into the editor

## Project Structure

```
dstack-template/
├── index.html              # Main application HTML
├── assets/                 # Static assets (images, fonts)
├── src/
│   ├── css/               # Stylesheets
│   │   ├── main.css       # Main application styles
│   │   ├── components.css # Component-specific styles
│   │   └── ...
│   └── js/                # JavaScript modules
│       ├── app.js         # Main application logic
│       ├── form-renderer.js # Visual form rendering
│       ├── data-sync.js   # YAML-Form synchronization
│       ├── navigation.js  # Navigation and templates
│       ├── share.js       # Sharing functionality
│       ├── auth.js        # GitHub authentication
│       └── ...
└── server/
    ├── server.js          # Express server
    ├── database/          # SQLite database files
    │   ├── schema.sql     # Database schema
    │   └── init.sql       # Initial data
    └── routes/            # API routes
        ├── auth.js        # Authentication endpoints
        ├── templates.js   # Template management
        └── ...
```

## API Endpoints

### Authentication
- `GET /api/auth/github` - Initiate GitHub OAuth
- `GET /api/auth/github/callback` - GitHub OAuth callback
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - Logout user

### Templates
- `GET /api/templates` - List all templates
- `GET /api/templates/:id` - Get specific template
- `POST /api/templates` - Create new template
- `DELETE /api/templates/:id` - Delete template
- `POST /api/templates/:id/like` - Toggle like on template

## Troubleshooting

### Common Issues

1. **GitHub authentication not working**
   - Verify your GitHub OAuth app settings
   - Check that callback URLs match exactly
   - Ensure `.env` file is properly configured

2. **Database errors**
   - Run `npm run init-db` to reinitialize
   - Check file permissions on the database directory

3. **Templates not loading**
   - Clear browser cache and localStorage
   - Check browser console for errors
   - Verify server is running on correct port

### Development Tips

- Use Chrome DevTools for debugging
- Check Network tab for API call issues
- Monitor server logs for backend errors
- Use `npm run dev` for automatic server restarts

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with ❤️ for the dstack.ai community
- Uses CodeMirror for YAML editing
- Styled with Tailwind CSS
- Icons from Heroicons

## Support

- Create an issue on GitHub for bug reports
- Join the dstack.ai community for discussions
- Check the [dstack documentation](https://dstack.ai/docs) for configuration reference