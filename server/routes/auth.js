const express = require('express');
const router = express.Router();

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Ov23livFZHELjXi0eMpk';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET; // Set this in environment variables

/**
 * POST /api/auth/github/callback
 * Exchange GitHub OAuth code for access token
 */
router.post('/github/callback', async (req, res) => {
    try {
        const { code, state } = req.body;
        
        if (!code) {
            return res.status(400).json({ 
                error: 'Missing authorization code' 
            });
        }

        if (!GITHUB_CLIENT_SECRET) {
            return res.status(500).json({ 
                error: 'GitHub OAuth not configured. Please set GITHUB_CLIENT_SECRET environment variable.' 
            });
        }

        // Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'dstack-config-editor'
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code: code,
                state: state
            })
        });

        const tokenData = await tokenResponse.json();
        
        if (tokenData.error) {
            console.error('GitHub OAuth error:', tokenData);
            return res.status(400).json({ 
                error: tokenData.error_description || 'Token exchange failed' 
            });
        }

        if (!tokenData.access_token) {
            return res.status(400).json({ 
                error: 'No access token received from GitHub' 
            });
        }

        // Fetch user data with the access token
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'dstack-config-editor'
            }
        });

        if (!userResponse.ok) {
            const errorText = await userResponse.text();
            console.error('GitHub API error:', errorText);
            return res.status(400).json({ 
                error: 'Failed to fetch user data from GitHub' 
            });
        }

        const userData = await userResponse.json();

        // Return both token and user data
        res.json({
            access_token: tokenData.access_token,
            token_type: tokenData.token_type,
            scope: tokenData.scope,
            user: userData
        });

    } catch (error) {
        console.error('OAuth callback error:', error);
        res.status(500).json({ 
            error: 'Internal server error during OAuth flow',
            message: error.message 
        });
    }
});

/**
 * GET /api/auth/user
 * Get current user info using access token
 */
router.get('/user', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                error: 'Missing or invalid authorization header' 
            });
        }

        const accessToken = authHeader.substring(7); // Remove "Bearer " prefix

        // Fetch user data from GitHub
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'dstack-config-editor'
            }
        });

        if (!userResponse.ok) {
            return res.status(401).json({ 
                error: 'Invalid or expired access token' 
            });
        }

        const userData = await userResponse.json();
        res.json(userData);

    } catch (error) {
        console.error('User info error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

/**
 * POST /api/auth/logout
 * Logout (invalidate token on client side)
 */
router.post('/logout', (req, res) => {
    // For OAuth apps, logout is handled client-side by removing the token
    // GitHub doesn't provide a way to revoke OAuth tokens via API for security
    res.json({ message: 'Logout successful' });
});

module.exports = router;