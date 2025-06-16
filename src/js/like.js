/**
 * YAML Like Functionality
 * Handles liking/unliking YAML configurations
 */

class YAMLLiker {
    constructor() {
        this.storageKey = 'yaml_likes';
        this.currentConfigHash = null;
        this.currentTemplateId = null; // Track if current content is a community template
        this.initEventListeners();
        this.loadLikeState();
    }

    initEventListeners() {
        const likeBtn = document.getElementById('like-yaml-btn');
        console.log('🔍 LIKE DEBUG - initEventListeners called, likeBtn found:', !!likeBtn);
        if (likeBtn) {
            console.log('🔍 LIKE DEBUG - Adding click listener to like button');
            likeBtn.addEventListener('click', (e) => {
                console.log('🔍 LIKE DEBUG - Like button clicked!', e);
                this.handleLike();
            });
        } else {
            console.log('🔍 LIKE DEBUG - Like button not found in DOM');
        }

        // Listen for YAML content changes to update like state
        document.addEventListener('yamlContentChanged', () => {
            this.updateLikeState();
        });

        // Listen for auth state changes to update like button
        document.addEventListener('authStateChanged', () => {
            this.updateLikeButtonState();
        });

        // Listen for app initialization complete
        document.addEventListener('appInitialized', () => {
            console.log('App initialized - loading like state');
            setTimeout(() => this.loadLikeState(), 100);
        });

        // Listen for community template loading to track template ID
        document.addEventListener('communityTemplateLoaded', (event) => {
            console.log('🔍 LIKE DEBUG - Community template loaded event:', event.detail);
            this.currentTemplateId = event.detail.id;
            console.log('🔍 LIKE DEBUG - Set currentTemplateId to:', this.currentTemplateId);
            // Reload like state for the community template
            this.loadLikeStateForTemplate(event.detail.id);
        });
    }

    async handleLike() {
        console.log('🔍 LIKE DEBUG - handleLike called');
        console.log('🔍 LIKE DEBUG - Current state:', {
            isAuthenticated: window.githubAuth && window.githubAuth.isAuthenticated(),
            selectedTemplate: window.app && window.app.selectedTemplate,
            currentTemplateId: this.currentTemplateId,
            hasYAML: !!this.getCurrentYAML()
        });

        // Check if user is authenticated
        if (!window.githubAuth || !window.githubAuth.isAuthenticated()) {
            console.log('🔍 LIKE DEBUG - User not authenticated');
            this.showNotification('Please login with GitHub to like configurations', 'info');
            return;
        }

        // Check if this is a built-in template (has selectedTemplate but no currentTemplateId)
        if (window.app && window.app.selectedTemplate && !this.currentTemplateId) {
            console.log('🔍 LIKE DEBUG - Built-in template detected:', window.app.selectedTemplate);
            this.showNotification('Official dstack.ai templates cannot be liked. Try modifying the configuration or load a community template.', 'info');
            return;
        }

        const currentYAML = this.getCurrentYAML();
        if (!currentYAML || currentYAML.trim() === '') {
            console.log('🔍 LIKE DEBUG - No YAML content');
            this.showNotification('No YAML content to like', 'warning');
            return;
        }

        // Check if this is a community template
        if (this.currentTemplateId) {
            console.log('🔍 LIKE DEBUG - Handling like for community template:', this.currentTemplateId);
            await this.handleCommunityTemplateLike();
        } else {
            console.log('🔍 LIKE DEBUG - Handling like for user-generated content');
            // Handle localStorage-based likes for user-generated content
            const configHash = this.generateConfigHash(currentYAML);
            const isLiked = this.isConfigLiked(configHash);

            console.log('🔍 LIKE DEBUG - Hash:', configHash, 'isLiked:', isLiked);

            if (isLiked) {
                this.unlikeConfig(configHash);
            } else {
                this.likeConfig(configHash);
            }

            this.updateLikeUI(configHash);
        }
    }

    likeConfig(configHash) {
        const likes = this.getLikes();
        const user = window.githubAuth.getUser();
        
        if (!likes[configHash]) {
            likes[configHash] = {
                count: 0,
                users: [],
                created: new Date().toISOString()
            };
        }

        // Add user to likes if not already present
        const userIndex = likes[configHash].users.findIndex(u => u.id === user.id);
        if (userIndex === -1) {
            likes[configHash].users.push({
                id: user.id,
                username: user.login,
                name: user.name,
                avatar_url: user.avatar_url,
                timestamp: new Date().toISOString()
            });
            likes[configHash].count = likes[configHash].users.length;
            
            this.saveLikes(likes);
            this.showNotification('Configuration liked! ❤️', 'success');
        }
    }

    unlikeConfig(configHash) {
        const likes = this.getLikes();
        const user = window.githubAuth.getUser();

        if (likes[configHash]) {
            // Remove user from likes
            const userIndex = likes[configHash].users.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
                likes[configHash].users.splice(userIndex, 1);
                likes[configHash].count = likes[configHash].users.length;
                
                // Remove the config entirely if no likes remain
                if (likes[configHash].count === 0) {
                    delete likes[configHash];
                }
                
                this.saveLikes(likes);
                this.showNotification('Like removed', 'info');
            }
        }
    }

    isConfigLiked(configHash) {
        if (!window.githubAuth || !window.githubAuth.isAuthenticated()) {
            return false;
        }

        const likes = this.getLikes();
        const user = window.githubAuth.getUser();
        
        return likes[configHash] && 
               likes[configHash].users.some(u => u.id === user.id);
    }

    getConfigLikeCount(configHash) {
        const likes = this.getLikes();
        return likes[configHash] ? likes[configHash].count : 0;
    }

    updateLikeState() {
        // Check if this is a built-in template (has selectedTemplate but no currentTemplateId)
        if (window.app && window.app.selectedTemplate && !this.currentTemplateId) {
            console.log('Built-in template selected:', window.app.selectedTemplate);
            // For built-in templates, hide the like button
            this.currentConfigHash = null;
            this.updateLikeButtonState();
            return;
        }

        const currentYAML = this.getCurrentYAML();
        if (currentYAML && currentYAML.trim() !== '') {
            this.currentConfigHash = this.generateConfigHash(currentYAML);
            this.updateLikeUI(this.currentConfigHash);
            console.log('Updated like state for config hash:', this.currentConfigHash);
        } else {
            // No content yet, reset to default state
            this.currentConfigHash = null;
            const likeCount = document.getElementById('like-count');
            if (likeCount) likeCount.textContent = '0';
            this.updateLikeButtonState();
        }
    }

    updateLikeUI(configHash) {
        const likeBtn = document.getElementById('like-yaml-btn');
        const likeCount = document.getElementById('like-count');
        
        if (!likeBtn || !likeCount) return;

        const isLiked = this.isConfigLiked(configHash);
        const count = this.getConfigLikeCount(configHash);

        // Update like count
        likeCount.textContent = count;

        // Update button appearance based on like state
        const heartIcon = likeBtn.querySelector('svg');
        if (isLiked) {
            // Liked state - filled heart
            heartIcon.setAttribute('fill', 'currentColor');
            heartIcon.setAttribute('stroke', 'currentColor');
            likeBtn.classList.add('liked');
            likeBtn.title = 'Unlike this configuration';
        } else {
            // Unliked state - outline heart
            heartIcon.setAttribute('fill', 'none');
            heartIcon.setAttribute('stroke', 'currentColor');
            likeBtn.classList.remove('liked');
            likeBtn.title = 'Like this configuration';
        }

        this.updateLikeButtonState();
    }

    updateLikeButtonState() {
        const likeBtn = document.getElementById('like-yaml-btn');
        if (!likeBtn) return;

        // Check if this is a built-in template
        const isBuiltInTemplate = window.app && window.app.selectedTemplate && !this.currentTemplateId;
        const isAuthenticated = window.githubAuth && window.githubAuth.isAuthenticated();
        
        console.log('🔍 LIKE DEBUG - updateLikeButtonState called, isAuthenticated:', isAuthenticated, 'isBuiltInTemplate:', isBuiltInTemplate);
        
        if (isBuiltInTemplate) {
            // Hide like button for built-in templates
            console.log('🔍 LIKE DEBUG - Hiding like button for built-in template');
            likeBtn.style.display = 'none';
        } else if (isAuthenticated) {
            // Show and enable like button
            console.log('🔍 LIKE DEBUG - Showing and enabling like button');
            likeBtn.style.display = 'flex';
            likeBtn.disabled = false;
            likeBtn.style.opacity = '1';
            likeBtn.style.cursor = 'pointer';
            likeBtn.title = 'Like this configuration';
        } else {
            // Show but disable like button
            console.log('🔍 LIKE DEBUG - Showing but disabling like button - user not authenticated');
            likeBtn.style.display = 'flex';
            likeBtn.disabled = true;
            likeBtn.style.opacity = '0.5';
            likeBtn.style.cursor = 'not-allowed';
            likeBtn.title = 'Login with GitHub to like configurations';
        }
    }

    generateConfigHash(yamlContent) {
        // Simple hash function for YAML content
        let hash = 0;
        const cleanContent = yamlContent.trim().replace(/\s+/g, ' ');
        
        if (cleanContent.length === 0) return hash;
        
        for (let i = 0; i < cleanContent.length; i++) {
            const char = cleanContent.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        return Math.abs(hash).toString(36);
    }

    getCurrentYAML() {
        if (window.app && window.app.yamlEditor) {
            return window.app.yamlEditor.getValue();
        }
        return '';
    }

    getLikes() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Failed to load likes:', error);
            return {};
        }
    }

    saveLikes(likes) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(likes));
        } catch (error) {
            console.error('Failed to save likes:', error);
        }
    }

    loadLikeState() {
        // Wait for YAML editor to be ready and content to be loaded
        const checkAndLoadState = () => {
            if (window.app && window.app.yamlEditor) {
                const yamlContent = this.getCurrentYAML();
                if (yamlContent && yamlContent.trim() !== '') {
                    console.log('Loading like state for YAML content:', yamlContent.substring(0, 50) + '...');
                    this.updateLikeState();
                    this.updateLikeButtonState();
                    return true;
                }
            }
            return false;
        };

        // Try immediately
        if (checkAndLoadState()) {
            return;
        }

        // If not ready, wait and retry
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds total
        const interval = setInterval(() => {
            attempts++;
            if (checkAndLoadState() || attempts >= maxAttempts) {
                clearInterval(interval);
                if (attempts >= maxAttempts) {
                    console.warn('Like state loading timed out - YAML editor not ready');
                    this.updateLikeButtonState(); // At least update button state
                }
            }
        }, 100);
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
            info: 'background: rgba(59, 130, 246, 0.9); border: 1px solid rgba(59, 130, 246, 0.3);',
            warning: 'background: rgba(245, 158, 11, 0.9); border: 1px solid rgba(245, 158, 11, 0.3);'
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

    resetCurrentConfigLikes() {
        // Reset the like count for the currently loaded configuration
        if (this.currentConfigHash) {
            console.log('🔄 Resetting localStorage likes for config hash:', this.currentConfigHash);
            const likes = this.getLikes();
            delete likes[this.currentConfigHash];
            this.saveLikes(likes);
            
            // Update UI to show 0 likes
            const likeCount = document.getElementById('like-count');
            if (likeCount) {
                likeCount.textContent = '0';
            }
            
            // Update button state to show unliked
            const likeBtn = document.getElementById('like-yaml-btn');
            if (likeBtn) {
                const heartIcon = likeBtn.querySelector('svg');
                if (heartIcon) {
                    heartIcon.setAttribute('fill', 'none');
                    heartIcon.setAttribute('stroke', 'currentColor');
                }
                likeBtn.classList.remove('liked');
                likeBtn.title = 'Like this configuration';
            }
            
            console.log('✅ Reset localStorage like count to 0');
        }
    }

    // Clear community template tracking (called when loading built-in templates)
    clearCommunityTemplateTracking() {
        console.log('🔍 LIKE DEBUG - clearCommunityTemplateTracking called');
        console.log('🔍 LIKE DEBUG - Previous currentTemplateId:', this.currentTemplateId);
        this.currentTemplateId = null;
        console.log('🔍 LIKE DEBUG - currentTemplateId cleared');
        
        // Update the like state to hide the button for built-in templates
        this.updateLikeState();
    }

    // Dispatch event when like count changes to update other UI components
    dispatchLikeChangeEvent(templateId, isLiked) {
        const event = new CustomEvent('templateLikeChanged', {
            detail: {
                templateId: templateId,
                isLiked: isLiked,
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(event);
        console.log('Dispatched templateLikeChanged event:', { templateId, isLiked });
    }

    // Handle liking/unliking community templates via API
    async handleCommunityTemplateLike() {
        try {
            const user = window.githubAuth.getUser();
            const response = await fetch(`/api/templates/${this.currentTemplateId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to toggle like');
            }

            const result = await response.json();
            console.log('Like toggled:', result);
            
            // Reload the like state to update UI
            await this.loadLikeStateForTemplate(this.currentTemplateId);
            
            // Dispatch event to update other UI components
            this.dispatchLikeChangeEvent(this.currentTemplateId, result.liked);
            
            // Show notification
            this.showNotification(result.message, 'success');
            
        } catch (error) {
            console.error('Error toggling like:', error);
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    // Load like state for a specific community template
    async loadLikeStateForTemplate(templateId) {
        try {
            const user = window.githubAuth.getUser();
            const userId = user ? user.id : null;
            
            const url = `/api/templates/${templateId}/likes${userId ? `?user_id=${userId}` : ''}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Failed to load like state');
            }
            
            const data = await response.json();
            console.log('Template like state:', data);
            
            // Update UI with database state
            this.updateLikeUIForTemplate(data.like_count, data.is_liked);
            
        } catch (error) {
            console.error('Error loading template like state:', error);
        }
    }

    // Update UI for community template likes
    updateLikeUIForTemplate(likeCount, isLiked) {
        const likeBtn = document.getElementById('like-yaml-btn');
        const likeCountElement = document.getElementById('like-count');
        
        if (!likeBtn || !likeCountElement) return;

        // Update like count
        likeCountElement.textContent = likeCount.toString();

        // Update button appearance based on like state
        const heartIcon = likeBtn.querySelector('svg');
        if (isLiked) {
            // Liked state - filled heart
            heartIcon.setAttribute('fill', 'currentColor');
            heartIcon.setAttribute('stroke', 'currentColor');
            likeBtn.classList.add('liked');
            likeBtn.title = 'Unlike this template';
        } else {
            // Unliked state - outline heart
            heartIcon.setAttribute('fill', 'none');
            heartIcon.setAttribute('stroke', 'currentColor');
            likeBtn.classList.remove('liked');
            likeBtn.title = 'Like this template';
        }

        this.updateLikeButtonState();
    }

    // Set like count for community templates (from database) - used when loading templates
    setCommunityTemplateLikeCount(likeCount) {
        console.log('Setting community template like count to:', likeCount);
        const likeCountElement = document.getElementById('like-count');
        if (likeCountElement) {
            likeCountElement.textContent = likeCount.toString();
        }
        
        // Reset to unliked state when just setting count (before loading full state)
        const likeBtn = document.getElementById('like-yaml-btn');
        if (likeBtn) {
            const heartIcon = likeBtn.querySelector('svg');
            if (heartIcon) {
                heartIcon.setAttribute('fill', 'none');
                heartIcon.setAttribute('stroke', 'currentColor');
            }
            likeBtn.classList.remove('liked');
            likeBtn.title = 'Like this template';
        }
    }

    // API methods for other modules
    getLikeStats(yamlContent) {
        const configHash = this.generateConfigHash(yamlContent);
        return {
            hash: configHash,
            count: this.getConfigLikeCount(configHash),
            isLiked: this.isConfigLiked(configHash),
            users: this.getLikes()[configHash]?.users || []
        };
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔍 LIKE DEBUG - DOMContentLoaded - Creating YAMLLiker instance');
    window.yamlLiker = new YAMLLiker();
    console.log('🔍 LIKE DEBUG - YAMLLiker instance created:', !!window.yamlLiker);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = YAMLLiker;
}