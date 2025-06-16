// Quick Add Module - Dynamic buttons based on dstack.ai configuration

// Check if a field exists in the current configuration
const fieldExists = (fieldPath) => {
    if (!window.app || !window.app.currentData) return false;
    
    const keys = fieldPath.split('.');
    let current = window.app.currentData;
    
    for (const key of keys) {
        if (!current || typeof current !== 'object' || !(key in current)) {
            return false;
        }
        current = current[key];
    }
    
    return true;
};

// Field order for proper positioning when adding back
const FIELD_ORDER = [
    'type',
    'name', 
    'python',
    'nvcc',
    'image',
    'working_dir',
    'commands',
    'env',
    'ports',
    'resources',
    'volumes',
    'backends',
    'regions',
    'nodes',
    'replicas',
    'spot_policy',
    'retry_policy',
    'max_price',
    'max_duration',
    'idle_duration'
];

// All possible dstack.ai configurable fields
const DSTACK_FIELDS = {
    'type': {
        label: 'Add Type',
        icon: '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>',
        defaultValue: 'task',
        className: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 hover:from-blue-500/30 hover:to-indigo-500/30 hover:border-blue-500/50'
    },
    'name': {
        label: 'Add Name',
        icon: '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>',
        defaultValue: 'my-config',
        className: 'from-purple-500/20 to-violet-500/20 border-purple-500/30 hover:from-purple-500/30 hover:to-violet-500/30 hover:border-purple-500/50'
    },
    'python': {
        label: 'Add Python',
        icon: '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>',
        defaultValue: '3.11',
        className: 'from-green-500/20 to-emerald-500/20 border-green-500/30 hover:from-green-500/30 hover:to-emerald-500/30 hover:border-green-500/50'
    },
    'nvcc': {
        label: 'Add NVCC',
        icon: '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>',
        defaultValue: true,
        className: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 hover:from-yellow-500/30 hover:to-orange-500/30 hover:border-yellow-500/50'
    },
    'env': {
        label: 'Add Environment',
        icon: '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9 3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>',
        defaultValue: ['MODEL_NAME=meta-llama/Llama-2-7b'],
        className: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30 hover:from-emerald-500/30 hover:to-green-500/30 hover:border-emerald-500/50'
    },
    'ports': {
        label: 'Add Ports',
        icon: '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path></svg>',
        defaultValue: [8000],
        className: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 hover:from-cyan-500/30 hover:to-blue-500/30 hover:border-cyan-500/50'
    },
    'commands': {
        label: 'Add Commands',
        icon: '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3"></path></svg>',
        defaultValue: ['pip install -r requirements.txt'],
        className: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-500/50'
    },
    'resources': {
        label: 'Add Resources',
        icon: '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>',
        defaultValue: { gpu: '24GB', memory: '16GB', cpu: 4 },
        className: 'from-orange-500/20 to-red-500/20 border-orange-500/30 hover:from-orange-500/30 hover:to-red-500/30 hover:border-orange-500/50'
    },
    'volumes': {
        label: 'Add Volumes',
        icon: '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path></svg>',
        defaultValue: ['/data:/workspace/data:rw'],
        className: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30 hover:from-indigo-500/30 hover:to-purple-500/30 hover:border-indigo-500/50'
    },
    'backends': {
        label: 'Add Backends',
        icon: '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"></path></svg>',
        defaultValue: ['aws', 'gcp'],
        className: 'from-teal-500/20 to-cyan-500/20 border-teal-500/30 hover:from-teal-500/30 hover:to-cyan-500/30 hover:border-teal-500/50'
    },
    'regions': {
        label: 'Add Regions',
        icon: '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
        defaultValue: ['us-east-1', 'us-west-2'],
        className: 'from-green-500/20 to-emerald-500/20 border-green-500/30 hover:from-green-500/30 hover:to-emerald-500/30 hover:border-green-500/50'
    },
    'image': {
        label: 'Add Image',
        icon: '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>',
        defaultValue: 'dstackai/base:py3.11-0.4.2',
        className: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 hover:from-blue-500/30 hover:to-indigo-500/30 hover:border-blue-500/50'
    },
    'working_dir': {
        label: 'Add Working Dir',
        icon: '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path></svg>',
        defaultValue: '/workspace',
        className: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 hover:from-yellow-500/30 hover:to-orange-500/30 hover:border-yellow-500/50'
    },
    'spot_policy': {
        label: 'Add Spot Policy',
        icon: '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>',
        defaultValue: 'auto',
        className: 'from-pink-500/20 to-rose-500/20 border-pink-500/30 hover:from-pink-500/30 hover:to-rose-500/30 hover:border-pink-500/50'
    },
    'retry_policy': {
        label: 'Add Retry Policy',
        icon: '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>',
        defaultValue: 'on-failure',
        className: 'from-violet-500/20 to-purple-500/20 border-violet-500/30 hover:from-violet-500/30 hover:to-purple-500/30 hover:border-violet-500/50'
    },
    'max_price': {
        label: 'Add Max Price',
        icon: '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path></svg>',
        defaultValue: '$2.50',
        className: 'from-red-500/20 to-pink-500/20 border-red-500/30 hover:from-red-500/30 hover:to-pink-500/30 hover:border-red-500/50'
    },
    'max_duration': {
        label: 'Add Max Duration',
        icon: '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
        defaultValue: '6h',
        className: 'from-slate-500/20 to-gray-500/20 border-slate-500/30 hover:from-slate-500/30 hover:to-gray-500/30 hover:border-slate-500/50'
    },
    'idle_duration': {
        label: 'Add Idle Duration',
        icon: '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
        defaultValue: '10m',
        className: 'from-stone-500/20 to-neutral-500/20 border-stone-500/30 hover:from-stone-500/30 hover:to-neutral-500/30 hover:border-stone-500/50'
    },
    'nodes': {
        label: 'Add Nodes',
        icon: '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>',
        defaultValue: 1,
        className: 'from-lime-500/20 to-green-500/20 border-lime-500/30 hover:from-lime-500/30 hover:to-green-500/30 hover:border-lime-500/50'
    },
    'replicas': {
        label: 'Add Replicas',
        icon: '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>',
        defaultValue: 1,
        className: 'from-sky-500/20 to-blue-500/20 border-sky-500/30 hover:from-sky-500/30 hover:to-blue-500/30 hover:border-sky-500/50'
    }
};

// Generic function to add any dstack field
const addDstackField = (fieldName) => {
    console.log(`Adding ${fieldName} section...`);
    
    if (!window.app || !window.app.currentData) {
        console.error('No current data available');
        return;
    }
    
    // Check if field already exists
    if (fieldExists(fieldName)) {
        console.log(`${fieldName} section already exists`);
        return;
    }
    
    const fieldConfig = DSTACK_FIELDS[fieldName];
    if (!fieldConfig) {
        console.error(`Unknown field: ${fieldName}`);
        return;
    }
    
    // Add field in the correct position based on FIELD_ORDER
    const newData = {};
    const fieldOrderIndex = FIELD_ORDER.indexOf(fieldName);
    
    // Rebuild the object with proper ordering
    for (const orderedField of FIELD_ORDER) {
        if (orderedField === fieldName) {
            // Insert the new field at its proper position
            newData[fieldName] = fieldConfig.defaultValue;
        } else if (window.app.currentData.hasOwnProperty(orderedField)) {
            // Keep existing fields in their order
            newData[orderedField] = window.app.currentData[orderedField];
        }
    }
    
    // Add any fields not in FIELD_ORDER at the end (custom fields)
    for (const [key, value] of Object.entries(window.app.currentData)) {
        if (!FIELD_ORDER.includes(key) && !newData.hasOwnProperty(key)) {
            newData[key] = value;
        }
    }
    
    // Replace the current data with the ordered version
    window.app.currentData = newData;
    
    // Preserve original YAML formatting and append new field
    if (window.dataSync && window.dataSync.addFieldToYaml) {
        window.dataSync.addFieldToYaml(fieldName, fieldConfig.defaultValue);
    } else {
        // Fallback to full regeneration if smart append isn't available
        if (window.dataSync && window.dataSync.updateYamlEditorFull) {
            window.dataSync.updateYamlEditorFull();
        }
    }
    
    // Re-render form
    const formContainer = document.getElementById('form-container');
    if (formContainer && window.formRenderer && window.formRenderer.renderForm) {
        formContainer.innerHTML = '';
        window.formRenderer.renderForm(window.app.currentData, formContainer);
    }
    
    // Update quick add buttons
    updateQuickAddButtons();
    
    console.log(`Added ${fieldName} section with default value in proper order:`, fieldConfig.defaultValue);
};

// Function to remove any field (not just dstack fields)
const removeDstackField = (fieldName) => {
    console.log(`Removing ${fieldName} section...`);
    
    if (!window.app || !window.app.currentData) {
        console.error('No current data available');
        return;
    }
    
    // All fields can be removed (no core field protection)
    
    // Check if field exists
    if (!fieldExists(fieldName)) {
        console.log(`${fieldName} section doesn't exist`);
        return;
    }
    
    // Confirm removal
    const fieldConfig = DSTACK_FIELDS[fieldName];
    const fieldLabel = fieldConfig ? fieldConfig.label.replace('Add ', '') : fieldName.replace(/_/g, ' ');
    
    if (!confirm(`Are you sure you want to remove the "${fieldLabel}" section?\n\nThis action cannot be undone.`)) {
        return;
    }
    
    // Remove the field from data
    if (window.utils && window.utils.deleteNestedValue) {
        window.utils.deleteNestedValue(window.app.currentData, fieldName);
        
        // Preserve original YAML formatting and remove field
        if (window.dataSync && window.dataSync.removeFieldFromYaml) {
            window.dataSync.removeFieldFromYaml(fieldName);
        } else {
            // Fallback to full regeneration if smart removal isn't available
            if (window.dataSync && window.dataSync.updateYamlEditorFull) {
                window.dataSync.updateYamlEditorFull();
            }
        }
        
        // Re-render form
        const formContainer = document.getElementById('form-container');
        if (formContainer && window.formRenderer && window.formRenderer.renderForm) {
            formContainer.innerHTML = '';
            window.formRenderer.renderForm(window.app.currentData, formContainer);
        }
        
        // Update quick add buttons
        updateQuickAddButtons();
        
        console.log(`Removed ${fieldName} section`);
    }
};

// Backward compatibility functions
const addPorts = () => addDstackField('ports');
const addEnv = () => addDstackField('env');

// Update button visibility based on current configuration
const updateQuickAddButtons = () => {
    const buttonsContainer = document.getElementById('quick-add-buttons');
    if (!buttonsContainer) return;
    
    // Clear existing buttons
    const buttonArea = buttonsContainer.querySelector('.flex');
    if (!buttonArea) return;
    
    buttonArea.innerHTML = '';
    
    // Get missing fields from current configuration
    const missingFields = Object.keys(DSTACK_FIELDS).filter(fieldName => !fieldExists(fieldName));
    
    // Create ADD buttons for missing fields only (remove buttons are now in form fields)
    missingFields.forEach(fieldName => {
        const fieldConfig = DSTACK_FIELDS[fieldName];
        const button = document.createElement('button');
        button.id = `add-${fieldName}-btn`;
        button.className = `quick-add-btn px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r ${fieldConfig.className} rounded-lg transition-all hover:scale-105`;
        button.innerHTML = `
            <div class="flex items-center space-x-2">
                ${fieldConfig.icon}
                <span>${fieldConfig.label}</span>
            </div>
        `;
        button.addEventListener('click', () => addDstackField(fieldName));
        buttonArea.appendChild(button);
    });
    
    // Show/hide the entire container based on whether there are missing fields
    if (missingFields.length === 0) {
        buttonsContainer.style.display = 'none';
    } else {
        buttonsContainer.style.display = 'block';
    }
};

// Initialize quick add functionality
const initQuickAdd = () => {
    // Update button visibility when configuration changes
    updateQuickAddButtons();
    
    console.log('Dynamic quick add functionality initialized');
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initQuickAdd();
});

// Export functions
window.quickAdd = {
    addPorts,
    addEnv,
    addDstackField,
    removeDstackField,
    updateQuickAddButtons,
    initQuickAdd,
    fieldExists,
    DSTACK_FIELDS,
    FIELD_ORDER
};