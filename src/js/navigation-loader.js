// Navigation Loader Module - Loads data from server on page load

class NavigationLoader {
    constructor() {
        this.loadedGroups = new Set();
        this.loadedConfigurations = new Set();
    }

    // Initialize navigation with server data
    async init() {
        try {
            console.log('Loading navigation data from server...');
            await this.loadGroups();
            await this.loadConfigurations();
            await this.loadDefaultTemplate();
            console.log('Navigation data loaded successfully');
        } catch (error) {
            console.error('Error loading navigation data:', error);
            // Show error to user but don't block the app
            this.showLoadingError('Failed to load navigation data from server');
        }
    }

    // Load all groups from server
    async loadGroups() {
        try {
            const groups = await window.api.groups.getAll();
            console.log('Loaded groups from server:', groups);

            for (const group of groups) {
                // Skip default group as it's already in HTML
                if (group.id === 'default') {
                    continue;
                }

                if (!this.loadedGroups.has(group.id)) {
                    this.addGroupToNavigation(group);
                    this.loadedGroups.add(group.id);
                }
            }
        } catch (error) {
            console.error('Error loading groups:', error);
            throw error;
        }
    }

    // Load all configurations from server
    async loadConfigurations() {
        try {
            const configurations = await window.api.configurations.getAllWithGroups();
            console.log('Loaded configurations from server:', configurations);

            for (const config of configurations) {
                if (!this.loadedConfigurations.has(config.id)) {
                    this.addConfigurationToNavigation(config);
                    this.loadedConfigurations.add(config.id);
                }
            }
        } catch (error) {
            console.error('Error loading configurations:', error);
            throw error;
        }
    }

    // Load default template
    async loadDefaultTemplate() {
        try {
            const template = await window.api.templates.get('open-r1');
            if (template && window.app && window.app.yamlEditor) {
                // Update filename editor for template
                if (window.filenameEditor) {
                    window.filenameEditor.updateCurrentConfig(null, template.name, true);
                }
                
                // Set default template content
                window.app.yamlEditor.setValue(template.yaml_content);
                
                // Update form from YAML
                setTimeout(() => {
                    if (window.dataSync && window.dataSync.updateFormFromYaml) {
                        window.dataSync.updateFormFromYaml();
                    }
                    
                    // Add arrows and auto-collapse
                    setTimeout(() => {
                        if (window.yamlCollapse && window.yamlCollapse.addArrowsToContent) {
                            window.yamlCollapse.addArrowsToContent();
                        }
                        
                        setTimeout(() => {
                            // if (window.yamlCollapse && window.yamlCollapse.autoCollapseAll) {
                            //     window.yamlCollapse.autoCollapseAll();
                            // }
                        }, 100);
                    }, 100);
                }, 50);
                
                // Highlight the template in navigation
                this.highlightTemplate('open-r1');
                
                // Update quick add buttons visibility (hide for templates)
                if (window.quickAdd && window.quickAdd.updateQuickAddButtons) {
                    window.quickAdd.updateQuickAddButtons();
                }
            }
        } catch (error) {
            console.error('Error loading default template:', error);
            // Don't throw - this is not critical
        }
    }

    // Add group to navigation UI
    addGroupToNavigation(group) {
        if (window.groupModal && window.groupModal.addGroupToNav) {
            window.groupModal.addGroupToNav(group.name, group.id);
        }
    }

    // Add configuration to navigation UI
    addConfigurationToNavigation(config) {
        const groupId = config.group_id || 'default';
        
        // Find target section
        let targetSection;
        if (groupId === 'default') {
            const navSections = document.querySelectorAll('.nav-section');
            for (const section of navSections) {
                const header = section.querySelector('.nav-section-header h3');
                if (header && header.textContent.trim() === 'Default') {
                    targetSection = section;
                    break;
                }
            }
        } else {
            targetSection = document.getElementById(`nav-group-section-${groupId}`);
        }

        if (!targetSection) {
            console.error('Could not find target section for group:', groupId);
            return;
        }

        const targetContent = targetSection.querySelector('.nav-section-content');
        if (!targetContent) {
            console.error('Could not find target section content');
            return;
        }

        // Create configuration element
        const configId = `nav-yml-${groupId}-${config.name.toLowerCase().replace(/\s+/g, '-')}`;
        
        // Check if already exists
        if (document.getElementById(configId)) {
            return;
        }

        const configElement = document.createElement('div');
        configElement.id = configId;
        configElement.className = 'nav-template-item p-3 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer group mb-2';
        configElement.dataset.configId = config.id;
        
        const displayDescription = config.description || 'Configuration';
        
        configElement.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all">
                    <span class="text-lg">📄</span>
                </div>
                <div class="flex-1 min-w-0 yml-content">
                    <div class="text-white font-medium text-sm">${config.name}</div>
                    <div class="text-white/60 text-xs truncate">${displayDescription}</div>
                </div>
                <div class="nav-item-actions flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="delete-yml-btn p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-all" 
                            onclick="deleteYmlConfiguration('${config.id}', '${config.name}', event)" 
                            title="Delete configuration">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
                <div class="template-indicator w-2 h-2 rounded-full bg-blue-400 opacity-0 transition-all"></div>
            </div>
        `;
        
        // Add click handler (only for the content area, not delete button)
        const ymlContent = configElement.querySelector('.yml-content');
        if (ymlContent) {
            ymlContent.addEventListener('click', () => {
                this.loadConfiguration(config);
            });
            ymlContent.style.cursor = 'pointer';
        }
        
        targetContent.appendChild(configElement);
    }

    // Load configuration when clicked
    async loadConfiguration(config) {
        try {
            console.log('Loading configuration:', config.name);
            
            // Update filename editor
            if (window.filenameEditor) {
                window.filenameEditor.updateCurrentConfig(config.id, config.name, false);
            }
            
            // Update the YAML editor
            if (window.app && window.app.yamlEditor) {
                window.app.yamlEditor.setValue(config.yaml_content);
                
                // Update form from YAML
                setTimeout(() => {
                    if (window.dataSync && window.dataSync.updateFormFromYaml) {
                        window.dataSync.updateFormFromYaml();
                    }
                    
                    // Add arrows and auto-collapse
                    setTimeout(() => {
                        if (window.yamlCollapse && window.yamlCollapse.addArrowsToContent) {
                            window.yamlCollapse.addArrowsToContent();
                        }
                        
                        setTimeout(() => {
                            // if (window.yamlCollapse && window.yamlCollapse.autoCollapseAll) {
                            //     window.yamlCollapse.autoCollapseAll();
                            // }
                            
                            // Update highlighting
                            setTimeout(() => {
                                this.highlightConfiguration(config);
                                
                                // Update quick add buttons visibility (show for configurations)
                                if (window.quickAdd && window.quickAdd.updateQuickAddButtons) {
                                    window.quickAdd.updateQuickAddButtons();
                                }
                            }, 50);
                        }, 100);
                    }, 100);
                }, 50);
            }
        } catch (error) {
            console.error('Error loading configuration:', error);
        }
    }

    // Highlight selected configuration
    highlightConfiguration(config) {
        // Remove selected class from all nav items
        document.querySelectorAll('.nav-template-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Add selected class to the current configuration
        const configId = `nav-yml-${config.group_id || 'default'}-${config.name.toLowerCase().replace(/\s+/g, '-')}`;
        const configItem = document.getElementById(configId);
        if (configItem) {
            configItem.classList.add('selected');
        }
        
        // Update app's selected template reference
        if (window.app) {
            window.app.selectedTemplate = `${config.group_id || 'default'}-${config.name}`;
        }
    }

    // Highlight selected template
    highlightTemplate(templateId) {
        // Remove selected class from all nav items
        document.querySelectorAll('.nav-template-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Add selected class to the template
        const templateItem = document.getElementById(`nav-template-${templateId}`);
        if (templateItem) {
            templateItem.classList.add('selected');
        }
        
        // Update app's selected template reference
        if (window.app) {
            window.app.selectedTemplate = templateId;
        }
    }

    // Show loading error to user
    showLoadingError(message) {
        console.error('Navigation loading error:', message);
        // Could show a toast notification here
    }

    // Refresh navigation data
    async refresh() {
        this.loadedGroups.clear();
        this.loadedConfigurations.clear();
        
        // Clear existing dynamic content
        document.querySelectorAll('.nav-section').forEach(section => {
            if (!section.querySelector('.nav-section-header h3')?.textContent.match(/^(Template|Default)$/)) {
                section.remove();
            }
        });
        
        // Clear configurations from default section
        const defaultSection = document.querySelector('.nav-section .nav-section-header h3[textContent="Default"]')?.closest('.nav-section');
        if (defaultSection) {
            const content = defaultSection.querySelector('.nav-section-content');
            if (content) {
                content.innerHTML = '';
            }
        }
        
        // Reload all data
        await this.init();
    }
}

// Create global navigation loader instance
window.navigationLoader = new NavigationLoader();

// Export for module use
window.NavigationLoader = NavigationLoader;