/**
 * Template Delete Functionality
 * Handles deleting community templates (only for creators)
 */

class TemplateDeleter {
    constructor() {
        this.currentTemplateId = null;
        this.currentTemplateAuthorId = null;
        this.initEventListeners();
    }

    initEventListeners() {
        const deleteBtn = document.getElementById('delete-yaml-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.handleDelete());
        }

        // Listen for auth state changes to update delete button
        document.addEventListener('authStateChanged', () => {
            this.updateDeleteButtonVisibility();
        });

        // Listen for template loading to check ownership
        document.addEventListener('communityTemplateLoaded', (event) => {
            this.handleTemplateLoaded(event.detail);
        });
    }

    handleTemplateLoaded(templateData) {
        this.currentTemplateId = templateData.id;
        this.currentTemplateAuthorId = templateData.author_id;
        this.updateDeleteButtonVisibility();
    }

    updateDeleteButtonVisibility() {
        const deleteBtn = document.getElementById('delete-yaml-btn');
        if (!deleteBtn) return;

        const canDelete = this.canUserDeleteTemplate();
        
        // Check if user is authenticated and is the template creator
        if (canDelete) {
            deleteBtn.style.display = 'block';
        } else {
            deleteBtn.style.display = 'none';
        }
    }

    canUserDeleteTemplate() {
        // Must have a current template loaded
        if (!this.currentTemplateId || !this.currentTemplateAuthorId) {
            return false;
        }

        // User must be authenticated
        if (!window.githubAuth || !window.githubAuth.isAuthenticated()) {
            return false;
        }

        // Get current user
        const user = window.githubAuth.getUser();
        if (!user) {
            return false;
        }

        // Check if current user is the template creator
        return user.id.toString() === this.currentTemplateAuthorId.toString();
    }

    async handleDelete() {
        if (!this.currentTemplateId) {
            this.showNotification('No template selected for deletion', 'error');
            return;
        }

        if (!this.canUserDeleteTemplate()) {
            this.showNotification('You can only delete your own templates', 'error');
            return;
        }
        
        // Show confirmation dialog
        const confirmed = await this.showConfirmationDialog();
        if (!confirmed) {
            return;
        }

        try {
            // Show loading state
            const deleteBtn = document.getElementById('delete-yaml-btn');
            if (deleteBtn) {
                deleteBtn.disabled = true;
                deleteBtn.innerHTML = `
                    <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                `;
            }

            // Send delete request to API
            const user = window.githubAuth.getUser();
            const response = await fetch(`/api/templates/${this.currentTemplateId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Delete failed:', errorData);
                throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
            }

            // Success
            this.showNotification('Template deleted successfully!', 'success');
            
            // Clear current template data
            this.currentTemplateId = null;
            this.currentTemplateAuthorId = null;
            
            // Hide delete button
            this.updateDeleteButtonVisibility();
            
            // Refresh community templates in explore modal
            if (window.yamlSharer && window.yamlSharer.loadCommunityTemplatesFromStorage) {
                await window.yamlSharer.loadCommunityTemplatesFromStorage();
            }
            
            // Refresh top templates in sidebar
            if (window.navigationModule && window.navigationModule.loadTopTemplates) {
                await window.navigationModule.loadTopTemplates();
            }
            
            // Clear the current YAML editor content if it was showing the deleted template
            if (window.app && window.app.yamlEditor) {
                window.app.yamlEditor.setValue('');
                // Update form from empty YAML
                if (window.dataSync && window.dataSync.updateFormFromYaml) {
                    window.dataSync.updateFormFromYaml();
                }
                
                // Reset like count display
                if (window.yamlLiker && window.yamlLiker.setCommunityTemplateLikeCount) {
                    window.yamlLiker.setCommunityTemplateLikeCount(0);
                }
            }

        } catch (error) {
            console.error('Error deleting template:', error);
            this.showNotification(`Failed to delete template: ${error.message}`, 'error');
        } finally {
            // Restore delete button
            const deleteBtn = document.getElementById('delete-yaml-btn');
            if (deleteBtn) {
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = `
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                `;
            }
        }
    }

    showConfirmationDialog() {
        return new Promise((resolve) => {
            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center';
            
            // Create modal content
            const modal = document.createElement('div');
            modal.className = 'bg-gradient-to-br from-slate-900 to-slate-800 border border-red-500/30 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl';
            modal.innerHTML = `
                <div class="text-center">
                    <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2">Delete Template</h3>
                    <p class="text-white/70 mb-6">Are you sure you want to delete this template? This action cannot be undone.</p>
                    <div class="flex gap-3 justify-center">
                        <button id="cancel-delete" class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all">
                            Cancel
                        </button>
                        <button id="confirm-delete" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg border border-red-500 transition-all">
                            Delete
                        </button>
                    </div>
                </div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Add event listeners
            const cancelBtn = modal.querySelector('#cancel-delete');
            const confirmBtn = modal.querySelector('#confirm-delete');

            const cleanup = () => {
                document.body.removeChild(overlay);
            };

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });

            confirmBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });

            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    cleanup();
                    resolve(false);
                }
            });

            // Close on escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    resolve(false);
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
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
        switch (type) {
            case 'success':
                notification.style.background = 'rgba(34, 197, 94, 0.9)';
                notification.style.border = '1px solid rgba(34, 197, 94, 0.3)';
                break;
            case 'error':
                notification.style.background = 'rgba(239, 68, 68, 0.9)';
                notification.style.border = '1px solid rgba(239, 68, 68, 0.3)';
                break;
            case 'warning':
                notification.style.background = 'rgba(245, 158, 11, 0.9)';
                notification.style.border = '1px solid rgba(245, 158, 11, 0.3)';
                break;
            default:
                notification.style.background = 'rgba(59, 130, 246, 0.9)';
                notification.style.border = '1px solid rgba(59, 130, 246, 0.3)';
        }
        
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

    // Clear template data (called when loading non-community templates)
    clearTemplateData() {
        this.currentTemplateId = null;
        this.currentTemplateAuthorId = null;
        this.updateDeleteButtonVisibility();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.templateDeleter = new TemplateDeleter();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemplateDeleter;
}