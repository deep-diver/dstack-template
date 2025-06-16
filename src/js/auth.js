/**
 * GitHub OAuth Authentication Module
 * Handles GitHub OAuth login/logout flow
 */

class GitHubAuth {
    constructor() {
        this.clientId = 'Ov23livFZHELjXi0eMpk'; // Your GitHub OAuth App Client ID
        this.redirectUri = window.location.origin + window.location.pathname;
        this.scope = 'user:email';
        this.storageKey = 'github_auth_data';
        this.user = null;
        this.accessToken = null;
        this.demoMode = false; // Using real GitHub OAuth
        
        this.init();
    }

    init() {
        // Check for existing auth data
        this.loadAuthData();
        
        // Handle OAuth callback
        this.handleOAuthCallback();
        
        // Initialize UI
        this.initAuthUI();
        
        // Update UI based on auth state
        this.updateAuthUI();
        
        // Dispatch initial auth state
        this.dispatchAuthStateChange();
    }

    loadAuthData() {
        try {
            const authData = localStorage.getItem(this.storageKey);
            if (authData) {
                const data = JSON.parse(authData);
                this.accessToken = data.accessToken;
                this.user = data.user;
            }
        } catch (error) {
            console.error('Failed to load auth data:', error);
            this.clearAuthData();
        }
    }

    saveAuthData() {
        try {
            const authData = {
                accessToken: this.accessToken,
                user: this.user,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(authData));
        } catch (error) {
            console.error('Failed to save auth data:', error);
        }
    }

    clearAuthData() {
        localStorage.removeItem(this.storageKey);
        this.accessToken = null;
        this.user = null;
    }

    isAuthenticated() {
        return !!(this.accessToken && this.user);
    }

    getAuthUrl() {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: this.scope,
            state: Math.random().toString(36).substr(2, 15) // CSRF protection
        });
        
        return `https://github.com/login/oauth/authorize?${params.toString()}`;
    }

    async handleOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (code) {
            try {
                // In a real app, this would go through your backend
                // For demo purposes, we'll simulate the token exchange
                await this.exchangeCodeForToken(code);
                
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
                
                this.showNotification('Successfully logged in with GitHub!', 'success');
            } catch (error) {
                console.error('OAuth callback error:', error);
                this.showNotification('Login failed. Please try again.', 'error');
            }
        }
    }

    async exchangeCodeForToken(code) {
        try {
            const response = await fetch('/api/auth/github/callback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code,
                    redirect_uri: this.redirectUri
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'OAuth callback failed');
            }

            this.accessToken = data.access_token;
            this.user = data.user;
            
            // Save auth data
            this.saveAuthData();
            
            // Update UI
            this.updateAuthUI();
            
            // Dispatch auth state change event
            this.dispatchAuthStateChange();
            
        } catch (error) {
            console.error('Token exchange error:', error);
            throw error;
        }
    }

    async fetchUserData() {
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            this.user = await response.json();
            
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            throw error;
        }
    }

    async login() {
        if (this.demoMode) {
            // Demo mode - simulate login without GitHub redirect
            this.showNotification('Demo login in progress...', 'info');
            
            // Simulate loading delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Generate demo user data
            const demoUsers = [
                {
                    id: 123456,
                    login: 'johndoe',
                    name: 'John Doe',
                    email: 'john@example.com',
                    avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4'
                },
                {
                    id: 789012,
                    login: 'janedeveloper',
                    name: 'Jane Developer',
                    email: 'jane@example.com',
                    avatar_url: 'https://avatars.githubusercontent.com/u/1024025?v=4'
                },
                {
                    id: 345678,
                    login: 'techuser',
                    name: 'Tech User',
                    email: 'tech@example.com',
                    avatar_url: 'https://avatars.githubusercontent.com/u/2612513?v=4'
                }
            ];
            
            // Pick a random demo user
            const randomUser = demoUsers[Math.floor(Math.random() * demoUsers.length)];
            
            this.accessToken = 'demo_token_' + Math.random().toString(36).substr(2, 40);
            this.user = {
                ...randomUser,
                html_url: `https://github.com/${randomUser.login}`,
                created_at: new Date().toISOString()
            };
            
            this.saveAuthData();
            this.updateAuthUI();
            this.showNotification(`Welcome ${this.user.name}! (Demo Mode)`, 'success');
        } else {
            // Real GitHub OAuth
            window.location.href = this.getAuthUrl();
        }
    }

    logout() {
        this.clearAuthData();
        this.updateAuthUI();
        this.dispatchAuthStateChange();
        this.showNotification('Successfully logged out', 'success');
    }

    initAuthUI() {
        // Create auth button container in the top bar
        const topBar = document.querySelector('.top-bar');
        if (!topBar) return;

        // Make the top bar relative for absolute positioning
        topBar.style.position = 'relative';

        // Keep the existing flex container centered
        const existingFlex = topBar.querySelector('.flex');
        if (existingFlex) {
            // Keep the original centering for the title
            existingFlex.className = 'flex items-center justify-center h-full';
        }

        // Create auth container with absolute positioning
        const authContainer = document.createElement('div');
        authContainer.id = 'auth-container';
        authContainer.className = 'absolute right-6 top-1/2 transform -translate-y-1/2 flex items-center space-x-3';
        
        topBar.appendChild(authContainer);
    }

    updateAuthUI() {
        const authContainer = document.getElementById('auth-container');
        if (!authContainer) return;

        if (this.isAuthenticated()) {
            // Show user profile
            authContainer.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="flex items-center space-x-2 px-3 py-2 glass rounded-lg border border-white/20">
                        <img src="${this.user.avatar_url}" alt="${this.user.name}" class="w-6 h-6 rounded-full">
                        <span class="text-white text-sm font-medium">${this.user.name || this.user.login}</span>
                    </div>
                    <button id="logout-btn" class="px-3 py-2 text-sm font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all">
                        Logout
                    </button>
                </div>
            `;

            // Add logout handler
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => this.logout());
            }
        } else {
            // Show login button
            authContainer.innerHTML = `
                <button id="login-btn" class="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg transition-all border border-white/20">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span>${this.demoMode ? 'Demo Login' : 'Login with GitHub'}</span>
                </button>
            `;

            // Add login handler
            const loginBtn = document.getElementById('login-btn');
            if (loginBtn) {
                loginBtn.addEventListener('click', () => this.login());
            }
        }
    }

    showNotification(message, type = 'info') {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} fixed top-4 right-4 z-50`;
        notification.textContent = message;
        
        // Add styles
        notification.style.cssText = `
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            max-width: 400px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        // Set background color based on type
        const colors = {
            success: 'background: rgba(34, 197, 94, 0.9); border: 1px solid rgba(34, 197, 94, 0.3);',
            error: 'background: rgba(239, 68, 68, 0.9); border: 1px solid rgba(239, 68, 68, 0.3);',
            info: 'background: rgba(59, 130, 246, 0.9); border: 1px solid rgba(59, 130, 246, 0.3);'
        };
        notification.style.cssText += colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Show with animation
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // API methods for other modules to use
    getUser() {
        return this.user;
    }

    getAccessToken() {
        return this.accessToken;
    }

    requireAuth(callback) {
        if (this.isAuthenticated()) {
            callback();
        } else {
            this.showNotification('Please login with GitHub to use this feature', 'info');
        }
    }

    dispatchAuthStateChange() {
        // Dispatch custom event to notify other components of auth state change
        const event = new CustomEvent('authStateChanged', {
            detail: {
                isAuthenticated: this.isAuthenticated(),
                user: this.user
            }
        });
        document.dispatchEvent(event);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.githubAuth = new GitHubAuth();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GitHubAuth;
}