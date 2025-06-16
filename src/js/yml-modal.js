// YAML Modal Module

// Open the YAML modal
const openYmlModal = () => {
    const overlay = document.getElementById('yml-modal-overlay');
    const modal = document.getElementById('yml-modal');
    const input = document.getElementById('yml-name-input');
    const select = document.getElementById('yml-group-select');
    const description = document.getElementById('yml-description-input');
    
    if (overlay && modal && input && select && description) {
        // Update group options
        updateGroupOptions();
        
        overlay.classList.add('open');
        modal.classList.add('open');
        
        // Clear and focus input
        input.value = '';
        select.value = 'default';
        description.value = '';
        setTimeout(() => input.focus(), 100);
    }
};

// Close the YAML modal
const closeYmlModal = () => {
    const overlay = document.getElementById('yml-modal-overlay');
    const modal = document.getElementById('yml-modal');
    
    if (overlay && modal) {
        overlay.classList.remove('open');
        modal.classList.remove('open');
    }
};

// Update group options in the select dropdown
const updateGroupOptions = async () => {
    const select = document.getElementById('yml-group-select');
    if (!select) return;
    
    try {
        // Get groups from server
        const groups = await window.api.groups.getAll();
        
        // Clear existing options
        select.innerHTML = '';
        
        // Add all groups as options
        for (const group of groups) {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name;
            select.appendChild(option);
        }
    } catch (error) {
        console.error('Error loading groups for dropdown:', error);
        // Fallback to UI-based detection
        select.innerHTML = '<option value="default">Default</option>';
        
        const navSections = document.querySelectorAll('.nav-section');
        for (const section of navSections) {
            const header = section.querySelector('.nav-section-header h3');
            if (header) {
                const groupName = header.textContent.trim();
                if (groupName !== 'Template' && groupName !== 'Default') {
                    const option = document.createElement('option');
                    option.value = groupName.toLowerCase().replace(/\s+/g, '-');
                    option.textContent = groupName;
                    select.appendChild(option);
                }
            }
        }
    }
};

// Create a new YAML configuration
const createYml = async () => {
    console.log('Create YAML button clicked');
    
    const input = document.getElementById('yml-name-input');
    const select = document.getElementById('yml-group-select');
    const description = document.getElementById('yml-description-input');
    const ymlName = input.value.trim();
    const selectedGroup = select.value;
    const ymlDescription = description.value.trim();
    
    console.log('YAML name:', ymlName, 'Group:', selectedGroup, 'Description:', ymlDescription);
    
    if (!ymlName) {
        showYmlModalError('Please enter a configuration name');
        return;
    }
    
    // Validate YAML name
    if (ymlName.length > 50) {
        showYmlModalError('Configuration name must be 50 characters or less');
        return;
    }
    
    try {
        // Create default YAML content
        const defaultYamlContent = `type: task
name: ${ymlName.toLowerCase().replace(/\s+/g, '-')}
python: "3.11"
${ymlDescription ? `# ${ymlDescription}\n` : ''}
commands:
  - echo "Starting ${ymlName}..."
  - python --version
  - echo "Configuration ready!"

resources:
  gpu: 1
  memory: 4GB
  disk: 10GB`;

        // Create configuration via API
        const newConfiguration = await window.api.configurations.create({
            name: ymlName,
            group_id: selectedGroup,
            yaml_content: defaultYamlContent,
            description: ymlDescription || null
        });
        
        console.log('Configuration created successfully:', newConfiguration);
        
        // Add YAML to navigation
        addYmlToNav(newConfiguration);
        
        // Close modal
        closeYmlModal();
        
        console.log('Created new YAML:', ymlName, 'in group:', selectedGroup);
    } catch (error) {
        console.error('Error creating YAML configuration:', error);
        showYmlModalError(error.message || 'Failed to create configuration');
    }
};

// Check if YAML configuration already exists
const checkYmlExists = (ymlName, groupName) => {
    const ymlId = `nav-yml-${groupName}-${ymlName.toLowerCase().replace(/\s+/g, '-')}`;
    return document.getElementById(ymlId);
};

// Add YAML configuration to the navigation sidebar
const addYmlToNav = (configuration) => {
    const ymlName = configuration.name;
    const groupName = configuration.group_id || 'default';
    const ymlDescription = configuration.description || '';
    
    console.log('Adding YAML to group:', groupName, 'with description:', ymlDescription);
    
    let targetSection;
    
    if (groupName === 'default') {
        // Find the Default section
        const navSections = document.querySelectorAll('.nav-section');
        for (const section of navSections) {
            const header = section.querySelector('.nav-section-header h3');
            if (header && header.textContent.trim() === 'Default') {
                targetSection = section;
                break;
            }
        }
    } else {
        // Find the specific group section
        const groupId = `nav-group-section-${groupName}`;
        targetSection = document.getElementById(groupId);
    }
    
    if (!targetSection) {
        console.error('Could not find target section for group:', groupName);
        return;
    }
    
    const targetContent = targetSection.querySelector('.nav-section-content');
    if (!targetContent) {
        console.error('Could not find target section content');
        return;
    }
    
    // Create YAML ID
    const ymlId = `nav-yml-${groupName}-${ymlName.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Check if already exists
    if (document.getElementById(ymlId)) {
        console.log('YAML already exists in navigation:', ymlName);
        return;
    }
    
    // Create YAML element
    const ymlElement = document.createElement('div');
    ymlElement.id = ymlId;
    ymlElement.className = 'nav-template-item p-3 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer group mb-2';
    ymlElement.dataset.configId = configuration.id;
    
    const displayDescription = ymlDescription || 'YAML configuration';
    
    ymlElement.innerHTML = `
        <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all">
                <span class="text-lg">📄</span>
            </div>
            <div class="flex-1 min-w-0 yml-content">
                <div class="text-white font-medium text-sm">${ymlName}</div>
                <div class="text-white/60 text-xs truncate">${displayDescription}</div>
            </div>
            <div class="nav-item-actions flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="delete-yml-btn p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-all" 
                        onclick="deleteYmlConfiguration('${configuration.id}', '${ymlName}', event)" 
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
    const ymlContent = ymlElement.querySelector('.yml-content');
    if (ymlContent) {
        ymlContent.addEventListener('click', () => {
            console.log('Selected YAML:', ymlName, 'from group:', groupName);
            loadYmlConfiguration(configuration);
        });
        ymlContent.style.cursor = 'pointer';
    }
    
    // Add to navigation
    targetContent.appendChild(ymlElement);
    
    console.log('Added YAML to navigation:', ymlName, 'in group:', groupName);
};

// Load YAML configuration when clicked
const loadYmlConfiguration = async (configuration) => {
    console.log('Loading YAML configuration:', configuration.name);
    
    try {
        // Get the latest configuration data from server
        const latestConfig = await window.api.configurations.get(configuration.id);
        
        // Update filename editor
        if (window.filenameEditor) {
            window.filenameEditor.updateCurrentConfig(latestConfig.id, latestConfig.name, false);
        }
        
        // Update the YAML editor
        if (window.app && window.app.yamlEditor) {
            window.app.yamlEditor.setValue(latestConfig.yaml_content);
            
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
                            updateYmlHighlight(latestConfig.name, latestConfig.group_id || 'default');
                            
                            // Update quick add buttons visibility (show for configurations)
                            if (window.quickAdd && window.quickAdd.updateQuickAddButtons) {
                                window.quickAdd.updateQuickAddButtons();
                            }
                        }, 50);
                    }, 100);
                }, 100);
            }, 50);
        }
        
        console.log('Loaded configuration for:', configuration.name);
    } catch (error) {
        console.error('Error loading configuration:', error);
        // Fallback to cached data
        if (window.app && window.app.yamlEditor && configuration.yaml_content) {
            window.app.yamlEditor.setValue(configuration.yaml_content);
        }
    }
};

// Update YAML highlighting in navigation
const updateYmlHighlight = (selectedYml, selectedGroup) => {
    // Remove selected class from all nav items
    document.querySelectorAll('.nav-template-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Add selected class to the current YAML
    const ymlId = `nav-yml-${selectedGroup}-${selectedYml.toLowerCase().replace(/\s+/g, '-')}`;
    const ymlItem = document.getElementById(ymlId);
    if (ymlItem) {
        ymlItem.classList.add('selected');
    }
    
    // Also update the app's selected template reference
    if (window.app) {
        window.app.selectedTemplate = `${selectedGroup}-${selectedYml}`;
    }
};

// Show modal error with shake animation
const showYmlModalError = (message) => {
    const modal = document.getElementById('yml-modal');
    const errorMsg = document.getElementById('yml-error-message');
    
    if (!modal || !errorMsg) return;
    
    // Show error message
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
    
    // Add shake animation
    modal.classList.add('shake');
    
    // Remove shake animation after it completes
    setTimeout(() => {
        modal.classList.remove('shake');
    }, 500);
    
    // Hide error message after 3 seconds
    setTimeout(() => {
        errorMsg.style.display = 'none';
    }, 3000);
};

// Handle Enter key in modal input
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('yml-name-input');
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                createYml();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeYmlModal();
            }
        });
    }
    
    // Add click handler to Add YML button
    const addYmlBtn = document.getElementById('add-yml-btn');
    if (addYmlBtn) {
        addYmlBtn.addEventListener('click', openYmlModal);
    }
});

// Delete YAML configuration
const deleteYmlConfiguration = async (configId, configName, event) => {
    // Prevent event bubbling to parent click handler
    event.stopPropagation();
    
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${configName}"?\n\nThis action cannot be undone.`)) {
        return;
    }
    
    try {
        console.log('Deleting configuration:', configName, 'ID:', configId);
        
        // Delete from server
        await window.api.configurations.delete(configId);
        
        // Remove from navigation UI
        const configElements = document.querySelectorAll(`[data-config-id="${configId}"]`);
        configElements.forEach(element => element.remove());
        
        // If this was the currently loaded configuration, clear the editor
        if (window.filenameEditor && window.filenameEditor.currentConfigId === configId) {
            // Load default template instead
            if (window.navigationLoader) {
                await window.navigationLoader.loadDefaultTemplate();
            }
        }
        
        console.log('Configuration deleted successfully:', configName);
        
    } catch (error) {
        console.error('Error deleting configuration:', error);
        alert(`Failed to delete configuration: ${error.message}`);
    }
};

// Export functions
window.ymlModal = {
    openYmlModal,
    closeYmlModal,
    createYml,
    addYmlToNav,
    updateGroupOptions,
    updateYmlHighlight,
    deleteYmlConfiguration
};

// Make functions globally available for onclick handlers
window.openYmlModal = openYmlModal;
window.closeYmlModal = closeYmlModal;
window.createYml = createYml;
window.deleteYmlConfiguration = deleteYmlConfiguration;