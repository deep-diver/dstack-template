/**
 * Configuration Title Editor Module
 * Handles editing and persistence of configuration titles
 */

class ConfigTitleEditor {
    constructor() {
        this.storageKey = 'config_titles';
        this.currentConfigHash = null;
        this.initEventListeners();
        this.loadTitleState();
    }

    initEventListeners() {
        const titleElement = document.getElementById('config-title');
        const titleInput = document.getElementById('config-title-input');
        const descriptionElement = document.getElementById('config-description');
        const descriptionInput = document.getElementById('config-description-input');
        const emojiSelect = document.getElementById('config-emoji');
        const categorySelect = document.getElementById('config-category');

        // Title editing
        if (titleElement && titleInput) {
            titleElement.addEventListener('click', () => this.startEditingTitle());
            titleInput.addEventListener('blur', () => this.saveTitle());
            titleInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    titleInput.blur();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.cancelEditingTitle();
                }
            });
        }

        // Description editing
        if (descriptionElement && descriptionInput) {
            descriptionElement.addEventListener('click', () => this.startEditingDescription());
            descriptionInput.addEventListener('blur', () => this.saveDescription());
            descriptionInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.shiftKey) {
                    // Allow Shift+Enter for new lines
                    return;
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    descriptionInput.blur();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.cancelEditingDescription();
                }
            });
            
            // Character counter
            descriptionInput.addEventListener('input', () => this.updateCharacterCount());
        }

        // Emoji and category change handlers
        if (emojiSelect) {
            emojiSelect.addEventListener('change', () => this.saveConfig());
        }
        
        if (categorySelect) {
            categorySelect.addEventListener('change', () => this.saveConfig());
        }

        // Listen for YAML content changes to update title for current config
        document.addEventListener('yamlContentChanged', () => {
            this.updateTitleForCurrentConfig();
        });

        // Listen for app initialization
        document.addEventListener('appInitialized', () => {
            setTimeout(() => this.loadTitleState(), 100);
        });
    }

    startEditingTitle() {
        const titleElement = document.getElementById('config-title');
        const titleInput = document.getElementById('config-title-input');
        
        if (titleElement && titleInput) {
            titleInput.value = titleElement.textContent.trim();
            titleElement.style.display = 'none';
            titleInput.style.display = 'block';
            titleInput.focus();
            titleInput.select();
        }
    }

    cancelEditingTitle() {
        const titleElement = document.getElementById('config-title');
        const titleInput = document.getElementById('config-title-input');
        
        if (titleElement && titleInput) {
            titleInput.style.display = 'none';
            titleElement.style.display = 'block';
        }
    }

    saveTitle() {
        const titleElement = document.getElementById('config-title');
        const titleInput = document.getElementById('config-title-input');
        
        if (titleElement && titleInput) {
            const newTitle = titleInput.value.trim() || 'Untitled Configuration';
            titleElement.textContent = newTitle;
            this.cancelEditingTitle();
            this.saveConfig();
            this.showNotification(`Title updated to "${newTitle}"`, 'success');
        }
    }

    startEditingDescription() {
        const descriptionElement = document.getElementById('config-description');
        const descriptionInput = document.getElementById('config-description-input');
        const charCountDiv = document.getElementById('description-char-count');
        
        if (descriptionElement && descriptionInput) {
            const currentText = descriptionElement.textContent.trim();
            if (currentText === 'Click to add a description...') {
                descriptionInput.value = '';
            } else {
                descriptionInput.value = currentText;
            }
            
            descriptionElement.style.display = 'none';
            descriptionInput.style.display = 'block';
            if (charCountDiv) charCountDiv.style.display = 'block';
            
            this.updateCharacterCount();
            descriptionInput.focus();
        }
    }

    cancelEditingDescription() {
        const descriptionElement = document.getElementById('config-description');
        const descriptionInput = document.getElementById('config-description-input');
        const charCountDiv = document.getElementById('description-char-count');
        
        if (descriptionElement && descriptionInput) {
            descriptionInput.style.display = 'none';
            descriptionElement.style.display = 'block';
            if (charCountDiv) charCountDiv.style.display = 'none';
        }
    }

    saveDescription() {
        const descriptionElement = document.getElementById('config-description');
        const descriptionInput = document.getElementById('config-description-input');
        
        if (descriptionElement && descriptionInput) {
            const newDescription = descriptionInput.value.trim();
            if (newDescription) {
                descriptionElement.textContent = newDescription;
                descriptionElement.classList.remove('text-white/60');
                descriptionElement.classList.add('text-white/80');
            } else {
                descriptionElement.textContent = 'Click to add a description...';
                descriptionElement.classList.remove('text-white/80');
                descriptionElement.classList.add('text-white/60');
            }
            
            this.cancelEditingDescription();
            this.saveConfig();
            
            if (newDescription) {
                this.showNotification('Description updated', 'success');
            }
        }
    }

    updateCharacterCount() {
        const descriptionInput = document.getElementById('config-description-input');
        const charCount = document.getElementById('char-count');
        
        if (descriptionInput && charCount) {
            const count = descriptionInput.value.length;
            charCount.textContent = count;
            
            // Update color based on length
            if (count > 180) {
                charCount.style.color = '#ef4444';
            } else if (count > 150) {
                charCount.style.color = '#f59e0b';
            } else {
                charCount.style.color = 'rgba(255, 255, 255, 0.5)';
            }
        }
    }

    saveConfig() {
        if (this.currentConfigHash) {
            const configData = this.getCurrentConfigData();
            this.saveConfigForHash(this.currentConfigHash, configData);
        }
    }

    getCurrentConfigData() {
        const titleElement = document.getElementById('config-title');
        const descriptionElement = document.getElementById('config-description');
        const emojiSelect = document.getElementById('config-emoji');
        const categorySelect = document.getElementById('config-category');
        
        const description = descriptionElement?.textContent.trim();
        
        return {
            title: titleElement?.textContent.trim() || 'Untitled Configuration',
            description: description === 'Click to add a description...' ? '' : description || '',
            emoji: emojiSelect?.value || '📝',
            category: categorySelect?.value || '',
            timestamp: new Date().toISOString()
        };
    }

    updateTitleForCurrentConfig() {
        // Don't auto-generate title if this is a template
        if (this.isTemplate) {
            return;
        }
        
        const currentYAML = this.getCurrentYAML();
        if (currentYAML && currentYAML.trim() !== '') {
            this.currentConfigHash = this.generateConfigHash(currentYAML);
            const savedConfig = this.getConfigForHash(this.currentConfigHash);
            
            if (savedConfig) {
                this.setConfigData(savedConfig);
            } else {
                // Generate smart defaults based on the YAML content
                const smartConfig = this.generateSmartConfig(currentYAML);
                this.setConfigData(smartConfig);
            }
        } else {
            this.currentConfigHash = null;
            this.setConfigData({
                title: 'Untitled Configuration',
                description: '',
                emoji: '📝',
                category: ''
            });
        }
    }

    generateSmartConfig(yamlContent) {
        try {
            // Try to extract meaningful info from YAML
            const lines = yamlContent.split('\n');
            let configType = 'Configuration';
            let configName = null;
            let smartEmoji = '📝';
            let smartCategory = '';
            
            for (const line of lines) {
                const trimmed = line.trim();
                
                // Look for type field
                if (trimmed.startsWith('type:')) {
                    const type = trimmed.split(':')[1]?.trim().replace(/['"]/g, '');
                    if (type) {
                        configType = type.charAt(0).toUpperCase() + type.slice(1);
                        
                        // Set smart emoji and category based on type
                        switch (type.toLowerCase()) {
                            case 'task':
                                smartEmoji = '🚀';
                                smartCategory = 'ml-training';
                                break;
                            case 'service':
                                smartEmoji = '🌐';
                                smartCategory = 'web-services';
                                break;
                            case 'dev-environment':
                                smartEmoji = '🛠️';
                                smartCategory = 'development';
                                break;
                            default:
                                smartEmoji = '⚡';
                        }
                    }
                }
                
                // Look for name field
                if (trimmed.startsWith('name:')) {
                    const name = trimmed.split(':')[1]?.trim().replace(/['"]/g, '');
                    if (name) {
                        configName = name;
                    }
                }
                
                // Stop after finding both or hitting significant content
                if (configType !== 'Configuration' && configName) break;
            }
            
            // Generate title
            let smartTitle;
            if (configName && configType !== 'Configuration') {
                smartTitle = `${configName} (${configType})`;
            } else if (configName) {
                smartTitle = configName;
            } else if (configType !== 'Configuration') {
                smartTitle = `${configType} Configuration`;
            } else {
                smartTitle = 'Untitled Configuration';
            }
            
            return {
                title: smartTitle,
                description: '',
                emoji: smartEmoji,
                category: smartCategory
            };
        } catch (error) {
            console.warn('Failed to generate smart config:', error);
            return {
                title: 'Untitled Configuration',
                description: '',
                emoji: '📝',
                category: ''
            };
        }
    }

    setConfigData(configData) {
        const titleElement = document.getElementById('config-title');
        const descriptionElement = document.getElementById('config-description');
        const emojiSelect = document.getElementById('config-emoji');
        const categorySelect = document.getElementById('config-category');
        
        if (titleElement) titleElement.textContent = configData.title || 'Untitled Configuration';
        
        if (descriptionElement) {
            if (configData.description) {
                descriptionElement.textContent = configData.description;
                descriptionElement.classList.remove('text-white/60');
                descriptionElement.classList.add('text-white/80');
            } else {
                descriptionElement.textContent = 'Click to add a description...';
                descriptionElement.classList.remove('text-white/80');
                descriptionElement.classList.add('text-white/60');
            }
        }
        
        if (emojiSelect) emojiSelect.value = configData.emoji || '📝';
        if (categorySelect) categorySelect.value = configData.category || '';
    }

    getConfigForHash(configHash) {
        const configs = this.getConfigs();
        return configs[configHash] || null;
    }

    saveConfigForHash(configHash, configData) {
        const configs = this.getConfigs();
        configs[configHash] = configData;
        this.saveConfigs(configs);
    }

    getConfigs() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Failed to load configs:', error);
            return {};
        }
    }

    saveConfigs(configs) {
        try {
            // Keep only the 50 most recent configs to prevent storage bloat
            const entries = Object.entries(configs);
            if (entries.length > 50) {
                const sorted = entries.sort((a, b) => 
                    new Date(b[1].timestamp) - new Date(a[1].timestamp)
                );
                const limited = Object.fromEntries(sorted.slice(0, 50));
                localStorage.setItem(this.storageKey, JSON.stringify(limited));
            } else {
                localStorage.setItem(this.storageKey, JSON.stringify(configs));
            }
        } catch (error) {
            console.error('Failed to save configs:', error);
        }
    }

    generateConfigHash(yamlContent) {
        // Same hash function as the like module for consistency
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

    loadTitleState() {
        // Wait for YAML editor to be ready
        const checkAndLoadState = () => {
            if (window.app && window.app.yamlEditor) {
                const yamlContent = this.getCurrentYAML();
                if (yamlContent && yamlContent.trim() !== '') {
                    this.updateTitleForCurrentConfig();
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
        const maxAttempts = 50;
        const interval = setInterval(() => {
            attempts++;
            if (checkAndLoadState() || attempts >= maxAttempts) {
                clearInterval(interval);
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

    // API methods for other modules
    getCurrentTitle() {
        const titleElement = document.getElementById('config-title');
        return titleElement ? titleElement.textContent.trim() : 'Untitled Configuration';
    }

    getCurrentConfigMetadata() {
        return this.getCurrentConfigData();
    }

    setCurrentTitle(title) {
        const titleElement = document.getElementById('config-title');
        if (titleElement) titleElement.textContent = title;
        this.saveConfig();
    }

    setCurrentConfigMetadata(configData) {
        this.setConfigData(configData);
        this.saveConfig();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.configTitleEditor = new ConfigTitleEditor();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigTitleEditor;
}