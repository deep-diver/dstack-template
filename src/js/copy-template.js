// Copy Template Module

let currentTemplateData = null;
let copiedTemplates = new Map(); // Store copied template data permanently

// Show/hide copy template button based on current selection
const updateCopyTemplateButtonVisibility = () => {
    const copyBtn = document.getElementById('copy-template-btn');
    if (!copyBtn) return;
    
    // Show button only when a template is selected (Open-R1, dstack-complete, or other predefined templates)
    if (window.app && window.app.selectedTemplate) {
        const selectedTemplate = window.app.selectedTemplate;
        // Show for predefined templates (not custom YAML configs)
        if (selectedTemplate === 'open-r1' || selectedTemplate === 'dstack-complete' || selectedTemplate.startsWith('template-')) {
            copyBtn.style.display = 'inline-flex';
        } else {
            copyBtn.style.display = 'none';
        }
    } else {
        copyBtn.style.display = 'none';
    }
};

// Open the copy template modal
const openCopyTemplateModal = () => {
    if (!window.app || !window.app.yamlEditor) {
        console.error('No YAML editor available');
        return;
    }
    
    // Capture current template data - get the original content without arrows
    if (window.yamlCollapse && window.yamlCollapse.originalContent) {
        currentTemplateData = window.yamlCollapse.originalContent;
        console.log('Captured original content without arrows');
    } else {
        // Fallback: clean the current content by removing arrows
        const currentContent = window.app.yamlEditor.getValue();
        currentTemplateData = currentContent.replace(/ [▼▶]/g, '');
        console.log('Cleaned current content by removing arrows');
    }
    
    const overlay = document.getElementById('copy-template-modal-overlay');
    const modal = document.getElementById('copy-template-modal');
    const nameInput = document.getElementById('copy-template-name-input');
    const groupSelect = document.getElementById('copy-template-group-select');
    const descriptionInput = document.getElementById('copy-template-description-input');
    
    if (overlay && modal && nameInput && groupSelect && descriptionInput) {
        // Update group options
        updateCopyTemplateGroupOptions();
        
        overlay.classList.add('open');
        modal.classList.add('open');
        
        // Pre-fill with suggested name based on current template
        const suggestedName = generateSuggestedName();
        nameInput.value = suggestedName;
        groupSelect.value = 'default';
        descriptionInput.value = '';
        
        setTimeout(() => nameInput.focus(), 100);
    }
};

// Close the copy template modal
const closeCopyTemplateModal = () => {
    const overlay = document.getElementById('copy-template-modal-overlay');
    const modal = document.getElementById('copy-template-modal');
    
    if (overlay && modal) {
        overlay.classList.remove('open');
        modal.classList.remove('open');
    }
    
    // Don't clear currentTemplateData here - we need it for the copy operation
};

// Generate a suggested name based on current template
const generateSuggestedName = () => {
    if (!window.app || !window.app.selectedTemplate) {
        return 'my-config';
    }
    
    const template = window.app.selectedTemplate;
    if (template === 'open-r1') {
        return 'my-open-r1';
    } else if (template === 'dstack-complete') {
        return 'my-dstack-config';
    }
    
    return `my-${template}`;
};

// Update group options in the select dropdown
const updateCopyTemplateGroupOptions = async () => {
    const select = document.getElementById('copy-template-group-select');
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
        console.error('Error loading groups for copy template dropdown:', error);
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

// Copy the template
const copyTemplate = async () => {
    console.log('Copy template button clicked');
    
    if (!currentTemplateData) {
        showCopyTemplateError('No template data available');
        return;
    }
    
    const nameInput = document.getElementById('copy-template-name-input');
    const groupSelect = document.getElementById('copy-template-group-select');
    const descriptionInput = document.getElementById('copy-template-description-input');
    
    const configName = nameInput.value.trim();
    const targetGroup = groupSelect.value;
    const description = descriptionInput.value.trim();
    
    console.log('Copy template:', configName, 'to group:', targetGroup);
    
    if (!configName) {
        showCopyTemplateError('Please enter a configuration name');
        return;
    }
    
    // Validate config name
    if (configName.length > 50) {
        showCopyTemplateError('Configuration name must be 50 characters or less');
        return;
    }
    
    try {
        // Get current template ID
        const currentTemplate = window.app.selectedTemplate;
        
        // Copy template via API
        const newConfiguration = await window.api.configurations.copyTemplate({
            name: configName,
            group_id: targetGroup,
            template_id: currentTemplate,
            description: description || null
        });
        
        console.log('Template copied successfully via API:', newConfiguration);
        
        // Store the template data for local reference
        const configKey = `${targetGroup}-${configName.toLowerCase().replace(/\s+/g, '-')}`;
        copiedTemplates.set(configKey, currentTemplateData);
        
        // Add to navigation
        if (window.navigationLoader) {
            window.navigationLoader.addConfigurationToNavigation(newConfiguration);
        }
        
        // Close modal
        closeCopyTemplateModal();
        
        console.log('Template copied successfully:', configName, 'in group:', targetGroup);
    } catch (error) {
        console.error('Error copying template:', error);
        showCopyTemplateError(error.message || 'Failed to copy template');
    }
};

// Check if configuration already exists
const checkConfigExists = (configName, groupName) => {
    const configId = `nav-yml-${groupName}-${configName.toLowerCase().replace(/\s+/g, '-')}`;
    return document.getElementById(configId);
};

// Create template copy in navigation
const createTemplateCopy = (configName, groupName, description) => {
    console.log('Creating template copy with current YAML data');
    
    // Find target section for the group
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
    const configId = `nav-yml-${groupName}-${configName.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Create YAML element
    const configElement = document.createElement('div');
    configElement.id = configId;
    configElement.className = 'nav-template-item p-3 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer group mb-2';
    
    const displayDescription = description || 'Copied template';
    
    configElement.innerHTML = `
        <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all">
                <span class="text-lg">📄</span>
            </div>
            <div class="flex-1 min-w-0">
                <div class="text-white font-medium text-sm">${configName}</div>
                <div class="text-white/60 text-xs truncate">${displayDescription}</div>
            </div>
            <div class="template-indicator w-2 h-2 rounded-full bg-blue-400 opacity-0 transition-all"></div>
        </div>
    `;
    
    // Add click handler to load the copied template data
    configElement.addEventListener('click', () => {
        const configKey = `${groupName}-${configName.toLowerCase().replace(/\s+/g, '-')}`;
        const storedTemplateData = copiedTemplates.get(configKey);
        loadCopiedTemplate(configName, groupName, description, storedTemplateData);
    });
    
    // Add to navigation
    targetContent.appendChild(configElement);
    
    console.log('Added copied template to navigation:', configName, 'in group:', groupName);
};

// Load copied template when clicked
const loadCopiedTemplate = (configName, groupName, description, templateData) => {
    console.log('Loading copied template:', configName, 'Template data exists:', !!templateData);
    
    if (!templateData) {
        console.error('No template data found for:', configName);
        return;
    }
    
    // Update the YAML editor with the copied template data
    if (window.app && window.app.yamlEditor) {
        window.app.yamlEditor.setValue(templateData);
        
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
                        if (window.ymlModal && window.ymlModal.updateYmlHighlight) {
                            // Use the YML modal's highlighting function
                            window.ymlModal.updateYmlHighlight(configName, groupName);
                        }
                    }, 50);
                }, 100);
            }, 100);
        }, 50);
    }
    
    console.log('Loaded copied template for:', configName);
};

// Show modal error with shake animation
const showCopyTemplateError = (message) => {
    const modal = document.getElementById('copy-template-modal');
    const errorMsg = document.getElementById('copy-template-error-message');
    
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

// Initialize copy template functionality
const initCopyTemplate = () => {
    const copyBtn = document.getElementById('copy-template-btn');
    
    if (copyBtn) {
        copyBtn.addEventListener('click', openCopyTemplateModal);
    }
    
    // Handle Enter key in modal input
    const nameInput = document.getElementById('copy-template-name-input');
    if (nameInput) {
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                copyTemplate();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeCopyTemplateModal();
            }
        });
    }
    
    console.log('Copy template functionality initialized');
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initCopyTemplate();
});

// Export functions
window.copyTemplateModule = {
    updateCopyTemplateButtonVisibility,
    openCopyTemplateModal,
    closeCopyTemplateModal,
    copyTemplate,
    updateCopyTemplateGroupOptions
};

// Make functions globally available for onclick handlers
window.openCopyTemplateModal = openCopyTemplateModal;
window.closeCopyTemplateModal = closeCopyTemplateModal;
window.copyTemplate = copyTemplate;