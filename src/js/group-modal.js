// Group Modal Module

// Open the group modal
const openGroupModal = () => {
    const overlay = document.getElementById('group-modal-overlay');
    const modal = document.getElementById('group-modal');
    const input = document.getElementById('group-name-input');
    
    if (overlay && modal && input) {
        overlay.classList.add('open');
        modal.classList.add('open');
        
        // Clear and focus input
        input.value = '';
        setTimeout(() => input.focus(), 100);
    }
};

// Close the group modal
const closeGroupModal = () => {
    const overlay = document.getElementById('group-modal-overlay');
    const modal = document.getElementById('group-modal');
    
    if (overlay && modal) {
        overlay.classList.remove('open');
        modal.classList.remove('open');
    }
};

// Create a new group
const createGroup = async () => {
    console.log('Create group button clicked');
    
    const input = document.getElementById('group-name-input');
    const groupName = input.value.trim();
    
    console.log('Group name:', groupName);
    
    if (!groupName) {
        showModalError('Please enter a group name');
        return;
    }
    
    // Validate group name
    if (groupName.length > 50) {
        showModalError('Group name must be 50 characters or less');
        return;
    }
    
    try {
        // Create group via API
        const newGroup = await window.api.groups.create({
            name: groupName,
            description: `Group for ${groupName} configurations`
        });
        
        console.log('Group created successfully:', newGroup);
        
        // Add group to navigation
        addGroupToNav(newGroup.name, newGroup.id);
        
        // Update YML modal group options if it exists
        if (window.ymlModal && window.ymlModal.updateGroupOptions) {
            window.ymlModal.updateGroupOptions();
        }
        
        // Close modal
        closeGroupModal();
        
        console.log('Created new group:', newGroup.name);
    } catch (error) {
        console.error('Error creating group:', error);
        showModalError(error.message || 'Failed to create group');
    }
};

// Add group to the navigation sidebar
const addGroupToNav = (groupName, groupId = null) => {
    console.log('Creating new group section for:', groupName);
    
    // Find the nav content container
    const navContent = document.querySelector('.nav-content');
    if (!navContent) {
        console.error('Could not find nav content container');
        return;
    }
    
    // Find the action buttons section to insert before it
    const actionButtons = document.querySelector('.nav-actions');
    if (!actionButtons) {
        console.error('Could not find action buttons section');
        return;
    }
    
    // Use provided groupId or generate one
    const navGroupId = groupId || groupName.toLowerCase().replace(/\s+/g, '-');
    const sectionId = `nav-group-section-${navGroupId}`;
    
    // Check if group already exists
    if (document.getElementById(sectionId)) {
        console.log('Group already exists in navigation:', groupName);
        return;
    }
    
    // Create new group section
    const groupSection = document.createElement('div');
    groupSection.id = sectionId;
    groupSection.className = 'nav-section mb-6';
    groupSection.dataset.groupId = navGroupId;
    
    groupSection.innerHTML = `
        <div class="nav-section-header flex items-center justify-between mb-3 group-header">
            <h3 class="text-white font-semibold text-sm uppercase tracking-wider">${groupName}</h3>
            <div class="flex items-center space-x-2">
                <button class="delete-group-btn p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-all opacity-0" 
                        onclick="deleteGroup('${navGroupId}', '${groupName}', event)" 
                        title="Delete group">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
                <svg class="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 1v6m8-6v6"></path>
                </svg>
            </div>
        </div>
        <div class="nav-section-content">
            <!-- Group configurations will be added here -->
        </div>
    `;
    
    // Insert the new group section before the action buttons
    navContent.insertBefore(groupSection, actionButtons);
    
    console.log('Added group section to navigation:', groupName);
};

// Show modal error with shake animation
const showModalError = (message) => {
    const modal = document.getElementById('group-modal');
    const errorMsg = document.getElementById('group-error-message');
    
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
    const input = document.getElementById('group-name-input');
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                createGroup();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeGroupModal();
            }
        });
    }
    
    // Add click handler to Add Group button
    const addGroupBtn = document.getElementById('add-group-btn');
    if (addGroupBtn) {
        addGroupBtn.addEventListener('click', openGroupModal);
    }
});

// Delete group and all its configurations
const deleteGroup = async (groupId, groupName, event) => {
    // Prevent event bubbling
    event.stopPropagation();
    
    // Prevent deletion of default group
    if (groupId === 'default') {
        alert('The Default group cannot be deleted.');
        return;
    }
    
    try {
        // Get configurations in this group first
        const configurations = await window.api.configurations.getAll();
        const groupConfigs = configurations.filter(config => config.group_id === groupId);
        
        let confirmMessage;
        if (groupConfigs.length > 0) {
            const configNames = groupConfigs.map(config => config.name).join(', ');
            confirmMessage = `Delete group "${groupName}"?\n\nConfigurations in this group will be moved to the Default group:\n- ${configNames}\n\nThis action cannot be undone.`;
        } else {
            confirmMessage = `Are you sure you want to delete the group "${groupName}"?\n\nThis action cannot be undone.`;
        }
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        console.log('Deleting group:', groupName, 'ID:', groupId);
        
        // Check if any of the configurations in this group is currently loaded
        const currentConfigId = window.filenameEditor && window.filenameEditor.currentConfigId;
        const wasCurrentConfigInGroup = groupConfigs.some(config => config.id === currentConfigId);
        
        // Delete the group from server (configurations will have group_id set to NULL automatically)
        await window.api.groups.delete(groupId);
        
        // Remove group from navigation UI
        const groupElement = document.getElementById(`nav-group-section-${groupId}`);
        if (groupElement) {
            groupElement.remove();
        }
        
        // Move configurations to Default group in the UI
        for (const config of groupConfigs) {
            // Find the configuration element in the deleted group and remove it
            const configElement = document.querySelector(`[data-config-id="${config.id}"]`);
            if (configElement) {
                configElement.remove();
            }
            
            // Add to Default group with updated group reference (group_id will be null from server, treat as 'default')
            const updatedConfig = { ...config, group_id: 'default' };
            if (window.ymlModal && window.ymlModal.addYmlToNav) {
                window.ymlModal.addYmlToNav(updatedConfig);
            }
        }
        
        // If the currently loaded configuration was in this group, reload it to reflect the group change
        if (wasCurrentConfigInGroup && window.filenameEditor && window.filenameEditor.currentConfigId) {
            try {
                // Reload the current configuration to get updated group info
                const updatedConfig = await window.api.configurations.get(window.filenameEditor.currentConfigId);
                // The configuration should now have group_id: null, which we'll treat as 'default'
                console.log('Current configuration moved to Default group');
            } catch (error) {
                // If config no longer exists, load default template
                if (window.navigationLoader) {
                    await window.navigationLoader.loadDefaultTemplate();
                }
            }
        }
        
        // Update group options in YML modal
        if (window.ymlModal && window.ymlModal.updateGroupOptions) {
            window.ymlModal.updateGroupOptions();
        }
        
        console.log('Group deleted successfully:', groupName);
        
    } catch (error) {
        console.error('Error deleting group:', error);
        alert(`Failed to delete group: ${error.message}`);
    }
};

// Export functions
window.groupModal = {
    openGroupModal,
    closeGroupModal,
    createGroup,
    addGroupToNav,
    deleteGroup
};

// Make functions globally available for onclick handlers
window.openGroupModal = openGroupModal;
window.closeGroupModal = closeGroupModal;
window.createGroup = createGroup;
window.deleteGroup = deleteGroup;