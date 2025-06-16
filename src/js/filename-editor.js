// Filename Editor Module - Handle editable YAML filename in header

class FilenameEditor {
    constructor() {
        this.isEditing = false;
        this.currentConfigId = null;
        this.originalFilename = 'dstack.yml';
        this.init();
    }

    init() {
        const filenameElement = document.getElementById('yaml-filename');
        const filenameInput = document.getElementById('yaml-filename-input');

        if (filenameElement && filenameInput) {
            // Add click handler to filename
            filenameElement.addEventListener('click', () => {
                this.startEditing();
            });

            // Add input handlers
            filenameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.saveFilename();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.cancelEditing();
                }
            });

            filenameInput.addEventListener('blur', () => {
                this.saveFilename();
            });

            console.log('Filename editor initialized');
        }
    }

    // Start editing mode
    startEditing() {
        // Only allow editing for custom configurations, not templates
        if (!this.currentConfigId || this.isTemplate()) {
            console.log('Cannot edit filename for templates');
            return;
        }

        const filenameElement = document.getElementById('yaml-filename');
        const filenameInput = document.getElementById('yaml-filename-input');

        if (filenameElement && filenameInput) {
            this.isEditing = true;
            
            // Get current filename without extension
            const currentText = filenameElement.textContent;
            const nameWithoutExt = currentText.replace('.yml', '').replace('.yaml', '');
            
            // Show input, hide text
            filenameElement.style.display = 'none';
            filenameInput.style.display = 'block';
            filenameInput.value = nameWithoutExt;
            filenameInput.focus();
            filenameInput.select();

            console.log('Started editing filename:', nameWithoutExt);
        }
    }

    // Cancel editing and restore original
    cancelEditing() {
        const filenameElement = document.getElementById('yaml-filename');
        const filenameInput = document.getElementById('yaml-filename-input');

        if (filenameElement && filenameInput) {
            this.isEditing = false;
            
            // Hide input, show text
            filenameInput.style.display = 'none';
            filenameElement.style.display = 'block';

            console.log('Cancelled filename editing');
        }
    }

    // Save the new filename
    async saveFilename() {
        if (!this.isEditing || !this.currentConfigId) {
            return;
        }

        const filenameElement = document.getElementById('yaml-filename');
        const filenameInput = document.getElementById('yaml-filename-input');

        if (filenameElement && filenameInput) {
            const newName = filenameInput.value.trim();
            
            // Validate filename
            if (!newName) {
                this.showError('Filename cannot be empty');
                filenameInput.focus();
                return;
            }

            if (newName.length > 50) {
                this.showError('Filename must be 50 characters or less');
                filenameInput.focus();
                return;
            }

            // Sanitize filename
            const sanitizedName = this.sanitizeFilename(newName);
            if (sanitizedName !== newName) {
                filenameInput.value = sanitizedName;
                this.showError('Filename contains invalid characters and was cleaned');
                filenameInput.focus();
                return;
            }

            try {
                // Get current configuration
                const config = await window.api.configurations.get(this.currentConfigId);
                
                // Update configuration name via API
                await window.api.configurations.update(this.currentConfigId, {
                    name: sanitizedName,
                    yaml_content: config.yaml_content,
                    description: config.description
                });

                // Update UI
                const newFilename = `${sanitizedName}.yml`;
                filenameElement.textContent = newFilename;
                
                // Update navigation
                this.updateNavigationItem(config.group_id, sanitizedName);
                
                this.isEditing = false;
                filenameInput.style.display = 'none';
                filenameElement.style.display = 'block';

                console.log('Filename updated successfully:', newFilename);
                this.showSuccess('Filename updated successfully');

            } catch (error) {
                console.error('Error updating filename:', error);
                this.showError(error.message || 'Failed to update filename');
                filenameInput.focus();
            }
        }
    }

    // Update the configuration name when a config is loaded
    updateCurrentConfig(configId, configName, isTemplate = false) {
        this.currentConfigId = configId;
        this.isTemplate = () => isTemplate;
        
        const filenameElement = document.getElementById('yaml-filename');
        if (filenameElement) {
            const filename = isTemplate ? configName : `${configName}.yml`;
            filenameElement.textContent = filename;
            
            // Add visual indicator for editability
            if (isTemplate) {
                filenameElement.classList.remove('cursor-pointer', 'hover:text-blue-300');
                filenameElement.title = 'Template filename cannot be edited';
            } else {
                filenameElement.classList.add('cursor-pointer', 'hover:text-blue-300');
                filenameElement.title = 'Click to edit filename';
            }
        }
    }

    // Update navigation item with new name
    updateNavigationItem(groupId, newName) {
        // Find the navigation item and update it
        const navItems = document.querySelectorAll('.nav-template-item[data-config-id]');
        for (const item of navItems) {
            if (item.dataset.configId === this.currentConfigId) {
                const nameElement = item.querySelector('.text-white.font-medium.text-sm');
                if (nameElement) {
                    nameElement.textContent = newName;
                }
                
                // Update the item ID
                const oldId = item.id;
                const newId = `nav-yml-${groupId || 'default'}-${newName.toLowerCase().replace(/\s+/g, '-')}`;
                item.id = newId;
                
                console.log('Updated navigation item from', oldId, 'to', newId);
                break;
            }
        }
    }

    // Sanitize filename to remove invalid characters
    sanitizeFilename(filename) {
        // Remove invalid characters for filenames
        return filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, '').trim();
    }

    // Show error message
    showError(message) {
        // Could implement a toast notification here
        console.error('Filename editor error:', message);
        
        // Simple alert for now - could be replaced with a toast
        const errorDiv = this.createTemporaryMessage(message, 'error');
        this.showTemporaryMessage(errorDiv);
    }

    // Show success message
    showSuccess(message) {
        console.log('Filename editor success:', message);
        
        const successDiv = this.createTemporaryMessage(message, 'success');
        this.showTemporaryMessage(successDiv);
    }

    // Create temporary message element
    createTemporaryMessage(message, type) {
        const div = document.createElement('div');
        div.className = `fixed top-4 right-4 p-3 rounded-lg text-white text-sm font-medium z-50 transition-all`;
        div.style.transform = 'translateY(-100px)';
        div.style.opacity = '0';
        
        if (type === 'error') {
            div.classList.add('bg-red-500/90');
        } else {
            div.classList.add('bg-green-500/90');
        }
        
        div.textContent = message;
        return div;
    }

    // Show temporary message with animation
    showTemporaryMessage(element) {
        document.body.appendChild(element);
        
        // Animate in
        setTimeout(() => {
            element.style.transform = 'translateY(0)';
            element.style.opacity = '1';
        }, 10);
        
        // Animate out and remove
        setTimeout(() => {
            element.style.transform = 'translateY(-100px)';
            element.style.opacity = '0';
            
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }, 300);
        }, 3000);
    }

    // Check if current config is a template
    isTemplate() {
        return this.currentConfigId === null || 
               (window.app && window.app.selectedTemplate && 
                (window.app.selectedTemplate === 'open-r1' || 
                 window.app.selectedTemplate.startsWith('template-')));
    }
}

// Create global instance
window.filenameEditor = new FilenameEditor();

// Export for module use
window.FilenameEditor = FilenameEditor;