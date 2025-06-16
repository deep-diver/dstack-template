// Event Handlers Module

// DOM-based click detection for YAML editor
const initYamlClickHandlers = () => {
    const yamlEditorContainer = document.getElementById('yaml-editor-container');
    if (!yamlEditorContainer) return;

    // Use DOM-based click detection instead of CodeMirror coordinates
    yamlEditorContainer.addEventListener('click', (event) => {
        console.log('=== DOM CLICK DEBUG ===');
        
        // Find which line element was clicked
        const target = event.target;
        const lineElement = target.closest('.CodeMirror-line');
        
        if (lineElement) {
            // Get the text content of the clicked line
            const lineText = lineElement.textContent || lineElement.innerText;
            console.log('Clicked line text:', JSON.stringify(lineText));
            console.log('Has ▼?', lineText.includes('▼'));
            console.log('Has ▶?', lineText.includes('▶'));
            
            if (lineText.includes('▼') || lineText.includes('▶')) {
                console.log('Arrow detected in clicked line!');
                event.preventDefault();
                event.stopPropagation();
                
                // Extract section key from the line text
                const cleanLine = lineText.replace(/[▼▶]/g, '').trim();
                const sectionKey = cleanLine.replace(':', '');
                
                console.log('Raw line text:', JSON.stringify(lineText));
                console.log('Clean line:', JSON.stringify(cleanLine));
                console.log('Section key:', JSON.stringify(sectionKey));
                console.log('Current collapsed sections before toggle:', Array.from(window.app.collapsedSections));
                
                if (window.yamlCollapse && window.yamlCollapse.toggleSection) {
                    window.yamlCollapse.toggleSection(sectionKey);
                }
                
                console.log('Current collapsed sections after toggle:', Array.from(window.app.collapsedSections));
                return false;
            } else {
                console.log('No arrow in clicked line');
            }
        } else {
            console.log('Could not find line element');
        }
    });

    // Keep the CodeMirror handler as backup
    const { yamlEditor } = window.app || {};
    if (yamlEditor) {
        yamlEditor.on('mousedown', (cm, event) => {
            // This is now just for debugging
            const pos = cm.coordsChar({left: event.clientX, top: event.clientY});
            console.log('CodeMirror detected click on line:', pos.line, 'Content:', cm.getLine(pos.line));
        });

        // Handle cursor change on hover
        yamlEditor.on('mousemove', (cm, event) => {
            const pos = cm.coordsChar({left: event.clientX, top: event.clientY});
            const line = cm.getLine(pos.line);
            
            if (line && (line.includes(' ▼') || line.includes(' ▶'))) {
                yamlEditorContainer.style.cursor = 'pointer';
            } else {
                yamlEditorContainer.style.cursor = 'text';
            }
        });

        // Line numbers are now built into CodeMirror, no sync needed

        // Note: YAML editor is read-only, so no change events needed
    }
};

// Form event handlers
const initFormHandlers = () => {
    const formContainer = document.getElementById('form-container');
    if (!formContainer) return;

    formContainer.addEventListener('input', (e) => {
        if (e.target.dataset.path) {
            const path = e.target.dataset.path;
            let value = e.target.value;
            if (e.target.type === 'checkbox') {
                value = e.target.checked;
                // Update label for checkbox
                const label = e.target.nextElementSibling;
                if (label) {
                    label.textContent = value ? 'Enabled' : 'Disabled';
                }
            } else if (e.target.type === 'number') {
                value = parseFloat(value) || 0;
            }
            if (window.dataSync && window.dataSync.updateDataFromForm) {
                window.dataSync.updateDataFromForm(path, value);
            }
        }
    });

    formContainer.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const path = button.dataset.path;
        if (button.classList.contains('remove-btn')) {
            if (confirm('Are you sure you want to remove this item?')) {
                if (window.utils && window.utils.deleteNestedValue) {
                    window.utils.deleteNestedValue(window.app.currentData, path);
                    formContainer.innerHTML = '';
                    if (window.formRenderer && window.formRenderer.renderForm) {
                        window.formRenderer.renderForm(window.app.currentData, formContainer);
                    }
                    if (window.dataSync && window.dataSync.updateYamlEditor) {
                        window.dataSync.updateYamlEditor();
                    }
                }
            }
        } else if (button.classList.contains('add-btn')) {
            let newItem;
            try {
                newItem = JSON.parse(button.dataset.template);
            } catch (e) {
                newItem = button.dataset.template;
            }
            
            const currentArray = path ? window.app.currentData[path] : window.app.currentData;
            const newIndex = Array.isArray(currentArray) ? currentArray.length : 0;
            if (window.utils && window.utils.setNestedValue) {
                window.utils.setNestedValue(window.app.currentData, `${path ? path + '.' : ''}${newIndex}`, newItem);
                formContainer.innerHTML = '';
                if (window.formRenderer && window.formRenderer.renderForm) {
                    window.formRenderer.renderForm(window.app.currentData, formContainer);
                }
                if (window.dataSync && window.dataSync.updateYamlEditor) {
                    window.dataSync.updateYamlEditor();
                }
            }
        }
    });
};

// Preset button handlers (removed - now handled in navigation)
const initPresetHandlers = () => {
    // No preset buttons in main UI anymore - all handled in navigation
    console.log('Preset handlers: Templates now managed through navigation panel');
};

// Annotation system handlers
const initAnnotationHandlers = () => {
    let annotations = {}; // Store annotations by path
    
    window.toggleAnnotation = function(btn, event) {
        event.preventDefault();
        event.stopPropagation();
        const path = btn.dataset.path;
        const popup = document.getElementById(`annotation-popup-${path}`);
        const isVisible = popup.classList.contains('show');
        
        // Close all other popups
        document.querySelectorAll('.annotation-popup.show').forEach(p => {
            p.classList.remove('show');
        });
        
        if (!isVisible) {
            popup.classList.add('show');
            const textarea = popup.querySelector('.annotation-input');
            textarea.value = annotations[path] || '';
            textarea.focus();
        }
    };
    
    window.saveAnnotation = function(path) {
        const popup = document.getElementById(`annotation-popup-${path}`);
        const textarea = popup.querySelector('.annotation-input');
        const value = textarea.value.trim();
        const btn = document.querySelector(`[data-path="${path}"].annotation-btn`);
        const display = document.getElementById(`annotation-display-${path}`);
        
        if (value) {
            annotations[path] = value;
            btn.classList.add('has-annotation');
            display.textContent = value;
            display.style.display = 'block';
        } else {
            delete annotations[path];
            btn.classList.remove('has-annotation');
            display.style.display = 'none';
        }
        
        popup.classList.remove('show');
    };
    
    window.cancelAnnotation = function(path) {
        const popup = document.getElementById(`annotation-popup-${path}`);
        popup.classList.remove('show');
    };
    
    // Close annotation popups when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.annotation-container')) {
            document.querySelectorAll('.annotation-popup.show').forEach(p => {
                p.classList.remove('show');
            });
        }
    });
};

// Drawer management handlers
const initDrawerHandlers = () => {
    let currentDrawerPath = null;
    let currentDrawerKey = null;
    let drawerData = null;
    
    window.openDrawer = function(path, key) {
        currentDrawerPath = path;
        currentDrawerKey = key;
        
        // Get the data for this section
        const keys = path.split('.');
        let data = window.app.currentData;
        for (const k of keys) {
            if (data && typeof data === 'object') {
                data = data[k];
            }
        }
        drawerData = JSON.parse(JSON.stringify(data || {})); // Deep clone
        
        // Update drawer content
        const drawerTitle = document.getElementById('drawer-title');
        const drawerContent = document.getElementById('drawer-content');
        
        if (drawerTitle) {
            drawerTitle.textContent = `Edit ${key.replace(/_/g, ' ')}`;
        }
        
        // Simple drawer interface - just render the form
        if (drawerContent) {
            drawerContent.innerHTML = '';
            if (window.formRenderer && window.formRenderer.renderForm) {
                window.formRenderer.renderForm(drawerData, drawerContent, '');
            }
            
            // Auto-resize all textareas after rendering
            setTimeout(() => {
                drawerContent.querySelectorAll('textarea.auto-resize').forEach(textarea => {
                    autoResizeTextarea(textarea);
                });
            }, 50);
        }
        
        // Show drawer
        const overlay = document.getElementById('drawer-overlay');
        const drawer = document.getElementById('drawer');
        if (overlay) overlay.classList.add('open');
        if (drawer) drawer.classList.add('open');
    };
    
    window.closeDrawer = function() {
        const overlay = document.getElementById('drawer-overlay');
        const drawer = document.getElementById('drawer');
        if (overlay) overlay.classList.remove('open');
        if (drawer) drawer.classList.remove('open');
        
        currentDrawerPath = null;
        currentDrawerKey = null;
        drawerData = null;
    };
    
    window.saveDrawer = async function() {
        if (currentDrawerPath && drawerData) {
            // Update the main data
            if (window.utils && window.utils.setNestedValue) {
                window.utils.setNestedValue(window.app.currentData, currentDrawerPath, drawerData);
            }
            
            // Update YAML and form
            if (window.dataSync && window.dataSync.updateYamlEditor) {
                window.dataSync.updateYamlEditor();
            }
            
            // For non-template configurations, save changes to server
            if (window.filenameEditor && window.filenameEditor.currentConfigId && 
                !window.filenameEditor.isTemplate()) {
                try {
                    const yamlContent = window.app.yamlEditor ? window.app.yamlEditor.getValue() : '';
                    const config = await window.api.configurations.get(window.filenameEditor.currentConfigId);
                    
                    await window.api.configurations.update(window.filenameEditor.currentConfigId, {
                        name: config.name,
                        yaml_content: yamlContent,
                        description: config.description
                    });
                    
                    console.log('Configuration saved to server successfully');
                } catch (error) {
                    console.error('Error saving configuration to server:', error);
                    // Could show an error message to user here
                }
            }
            
            const formContainer = document.getElementById('form-container');
            if (formContainer) {
                formContainer.innerHTML = '';
                if (window.formRenderer && window.formRenderer.renderForm) {
                    window.formRenderer.renderForm(window.app.currentData, formContainer);
                }
            }
            
            window.closeDrawer();
        }
    };
    
    // Auto-resize textarea function
    const autoResizeTextarea = (textarea) => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    };
    
    // Handle drawer form changes
    document.addEventListener('input', (e) => {
        if (e.target.closest('#drawer-content') && e.target.dataset.path) {
            const path = e.target.dataset.path;
            let value = e.target.value;
            if (e.target.type === 'checkbox') {
                value = e.target.checked;
            } else if (e.target.type === 'number') {
                value = parseFloat(value) || 0;
            }
            if (window.utils && window.utils.setNestedValue) {
                window.utils.setNestedValue(drawerData, path, value);
            }
            
            // Auto-resize textareas
            if (e.target.tagName === 'TEXTAREA' && e.target.classList.contains('auto-resize')) {
                autoResizeTextarea(e.target);
            }
        }
    });
    
    // Handle drawer form clicks (add/remove buttons)
    document.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button || !button.closest('#drawer-content')) return;
        
        const path = button.dataset.path;
        if (button.classList.contains('remove-btn')) {
            if (confirm('Are you sure you want to remove this item?')) {
                if (window.utils && window.utils.deleteNestedValue) {
                    window.utils.deleteNestedValue(drawerData, path);
                    const drawerContent = document.getElementById('drawer-content');
                    if (drawerContent) {
                        drawerContent.innerHTML = '';
                        if (window.formRenderer && window.formRenderer.renderForm) {
                            window.formRenderer.renderForm(drawerData, drawerContent, '');
                        }
                    }
                }
            }
        } else if (button.classList.contains('add-btn')) {
            let newItem;
            try {
                newItem = JSON.parse(button.dataset.template);
            } catch (e) {
                newItem = button.dataset.template;
            }
            
            const currentArray = path ? drawerData[path] : drawerData;
            const newIndex = Array.isArray(currentArray) ? currentArray.length : 0;
            if (window.utils && window.utils.setNestedValue) {
                window.utils.setNestedValue(drawerData, `${path ? path + '.' : ''}${newIndex}`, newItem);
                
                const drawerContent = document.getElementById('drawer-content');
                if (drawerContent) {
                    drawerContent.innerHTML = '';
                    if (window.formRenderer && window.formRenderer.renderForm) {
                        window.formRenderer.renderForm(drawerData, drawerContent, '');
                    }
                }
            }
        }
    });
};

// Help text hover handlers
const initHelpTextHandlers = () => {
    let hoverTimeouts = new Map();
    
    // Use event delegation for dynamically created form fields
    const formContainer = document.getElementById('form-container');
    if (!formContainer) return;
    
    formContainer.addEventListener('mouseenter', (e) => {
        const fieldContainer = e.target.closest('.field-container');
        if (!fieldContainer) return;
        
        const helpText = fieldContainer.querySelector('.help-text');
        if (!helpText) return;
        
        // Clear any existing timeout for this field
        const existingTimeout = hoverTimeouts.get(fieldContainer);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }
        
        // Set new timeout to show help text after 0.7 seconds
        const timeout = setTimeout(() => {
            helpText.classList.add('show');
            hoverTimeouts.delete(fieldContainer);
        }, 700);
        
        hoverTimeouts.set(fieldContainer, timeout);
    }, true); // Use capture to catch events on child elements
    
    formContainer.addEventListener('mouseleave', (e) => {
        const fieldContainer = e.target.closest('.field-container');
        if (!fieldContainer) return;
        
        const helpText = fieldContainer.querySelector('.help-text');
        if (!helpText) return;
        
        // Clear timeout if still pending
        const existingTimeout = hoverTimeouts.get(fieldContainer);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
            hoverTimeouts.delete(fieldContainer);
        }
        
        // Hide help text immediately
        helpText.classList.remove('show');
    }, true); // Use capture to catch events on child elements
};

// Helper function to add template to community grid (fallback when YAMLSharer not available)
const addTemplateToCommunityGrid = (shareData) => {
    const communityGrid = document.getElementById('community-templates-grid');
    if (!communityGrid) {
        console.error('❌ Community templates grid not found!');
        return;
    }
    
    console.log('✅ Adding template to community grid (fallback):', shareData.title);

    // Remove empty state if it exists
    const emptyState = communityGrid.querySelector('.col-span-2');
    if (emptyState) {
        emptyState.remove();
    }

    // Generate random gradient colors for visual variety
    const gradients = [
        'from-emerald-500/20 to-green-500/20 border-emerald-500/30',
        'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
        'from-purple-500/20 to-violet-500/20 border-purple-500/30',
        'from-pink-500/20 to-rose-500/20 border-pink-500/30',
        'from-orange-500/20 to-red-500/20 border-orange-500/30',
        'from-teal-500/20 to-cyan-500/20 border-teal-500/30',
        'from-yellow-500/20 to-amber-500/20 border-yellow-500/30'
    ];
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

    // Create template card
    const templateCard = document.createElement('div');
    templateCard.className = `aspect-[3/1] bg-gradient-to-br ${randomGradient} rounded-lg p-2 hover:scale-105 transition-all cursor-pointer group overflow-hidden`;
    
    const emoji = shareData.emoji || '📄';
    const getTimeAgo = (timestamp) => {
        if (!timestamp) return 'Just now';
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return `${Math.floor(diffInSeconds / 604800)}w ago`;
    };
    const timeAgo = getTimeAgo(shareData.created_at || shareData.timestamp);
    
    const getCategoryLabel = (category) => {
        const categoryLabels = {
            'ml-training': 'ML Training',
            'data-processing': 'Data Processing',
            'web-services': 'Web Services',
            'database': 'Database',
            'networking': 'Networking',
            'monitoring': 'Monitoring',
            'testing': 'Testing',
            'documentation': 'Documentation'
        };
        return categoryLabels[category] || category || 'General';
    };
    
    // Handle both old localStorage format and new database format
    const authorInfo = (shareData.author_name || shareData.author?.name) ? `
        <div class="flex items-center gap-1 mb-1">
            <img src="${shareData.author_avatar_url || shareData.author?.avatar_url}" alt="${shareData.author_name || shareData.author?.name}" class="w-3 h-3 rounded-full">
            <span class="text-white/50 text-[8px] truncate">by ${shareData.author_name || shareData.author?.name}</span>
        </div>
    ` : '';

    templateCard.innerHTML = `
        <div class="h-full flex flex-col justify-between">
            <div class="flex items-start gap-1">
                <span class="text-sm shrink-0">${emoji}</span>
                <div class="min-w-0 flex-1">
                    <h4 class="text-white text-xs font-medium leading-none truncate">${shareData.title}</h4>
                    <p class="text-white/60 text-[9px] leading-tight mt-0.5 line-clamp-2">${shareData.description || 'Community shared configuration'}</p>
                </div>
            </div>
            <div class="mt-auto">
                ${authorInfo}
                <div class="flex items-center justify-between">
                    <span class="text-white/50 text-[8px] font-medium px-2 py-0.5 bg-white/10 rounded-full">${getCategoryLabel(shareData.category)}</span>
                    <p class="text-white/40 text-[8px] leading-none">${timeAgo}</p>
                </div>
            </div>
        </div>
    `;

    // Ensure like count is always 0 for display (fresh shared items)
    const displayData = { ...shareData, like_count: 0, view_count: 0 };
    
    // Add click handler to load the configuration
    templateCard.addEventListener('click', async () => {
        try {
            let yamlContent = shareData.yaml_content || shareData.yamlContent;
            
            // If we only have basic info, fetch full template from API
            if (!yamlContent && shareData.id) {
                const response = await fetch(`/api/templates/${shareData.id}`);
                if (response.ok) {
                    const fullTemplate = await response.json();
                    yamlContent = fullTemplate.yaml_content;
                    shareData = fullTemplate; // Update with full data
                }
            }
            
            if (!yamlContent) {
                console.error('Failed to load template content');
                return;
            }

            // Load the YAML content into both editors
            if (window.app && window.app.yamlEditor) {
                // Set YAML editor content
                window.app.yamlEditor.setValue(yamlContent);
                
                // Update the visual form from YAML content
                if (window.dataSync && window.dataSync.updateFormFromYaml) {
                    window.dataSync.updateFormFromYaml();
                } else {
                    // Fallback: manually trigger form update
                    console.log('📝 Manually updating form from YAML...');
                    try {
                        const parsedData = jsyaml.load(yamlContent);
                        if (parsedData && typeof parsedData === 'object') {
                            window.app.currentData = parsedData;
                            const formContainer = document.getElementById('form-container');
                            if (formContainer && window.formRenderer && window.formRenderer.renderForm) {
                                formContainer.innerHTML = '';
                                window.formRenderer.renderForm(parsedData, formContainer);
                            }
                        }
                    } catch (error) {
                        console.error('Failed to parse and update form:', error);
                    }
                }
                
                // Dispatch YAML content change event
                const event = new CustomEvent('yamlContentChanged', {
                    detail: {
                        content: yamlContent,
                        timestamp: new Date().toISOString()
                    }
                });
                document.dispatchEvent(event);
                
                // Update filename if provided
                const filename = shareData.filename || 'dstack.yml';
                const filenameElement = document.getElementById('yaml-filename');
                if (filenameElement) {
                    filenameElement.textContent = filename;
                }
                
                // Update title section with template info
                if (window.configTitleEditor && shareData.title) {
                    window.configTitleEditor.setConfigData({
                        title: shareData.title,
                        description: shareData.description || 'Community shared configuration',
                        emoji: shareData.emoji || '📄',
                        category: shareData.category || 'community'
                    });
                }
            }
            
            // Close explore modal if open
            const exploreModal = document.getElementById('explore-modal');
            if (exploreModal) {
                exploreModal.style.display = 'none';
                exploreModal.classList.add('opacity-0', 'pointer-events-none');
                exploreModal.classList.remove('opacity-100');
                document.body.style.overflow = '';
            }
            
            console.log(`Loaded "${shareData.title}" from community`);
        } catch (error) {
            console.error('Failed to load community template:', error);
        }
    });

    // Insert at the beginning of the grid
    communityGrid.insertBefore(templateCard, communityGrid.firstChild);
};

// Explore modal functionality
const initExploreHandlers = () => {
    const exploreBtn = document.getElementById('explore-btn');
    const exploreModal = document.getElementById('explore-modal');
    const exploreCloseBtn = document.getElementById('explore-close-btn');
    const searchInput = document.getElementById('template-search');
    
    if (!exploreBtn || !exploreModal || !exploreCloseBtn) return;
    
    // Search functionality
    const performSearch = (query) => {
        const searchTerm = query.toLowerCase().trim();
        const templateCards = exploreModal.querySelectorAll('.aspect-\\[3\\/1\\]');
        
        let hasVisibleCards = false;
        
        templateCards.forEach(card => {
            const title = card.querySelector('h4')?.textContent?.toLowerCase() || '';
            const description = card.querySelector('p:not(:last-child)')?.textContent?.toLowerCase() || '';
            
            const matches = searchTerm === '' || 
                          title.includes(searchTerm) || 
                          description.includes(searchTerm);
            
            if (matches) {
                card.style.display = '';
                hasVisibleCards = true;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Show/hide "no results" message
        updateNoResultsMessage(searchTerm, hasVisibleCards);
    };
    
    // Update or create "no results" message
    const updateNoResultsMessage = (searchTerm, hasVisibleCards) => {
        const sections = exploreModal.querySelectorAll('.bg-white\\/5');
        
        sections.forEach(section => {
            let noResultsMsg = section.querySelector('.no-results-message');
            
            if (!hasVisibleCards && searchTerm !== '') {
                if (!noResultsMsg) {
                    noResultsMsg = document.createElement('div');
                    noResultsMsg.className = 'no-results-message text-center py-8 text-white/60';
                    noResultsMsg.innerHTML = `
                        <div class="text-4xl mb-4">🔍</div>
                        <p class="text-sm">No templates found matching "${searchTerm}"</p>
                        <p class="text-xs mt-2 text-white/40">Try searching with different keywords</p>
                    `;
                    section.querySelector('.grid').appendChild(noResultsMsg);
                }
                noResultsMsg.querySelector('p').textContent = `No templates found matching "${searchTerm}"`;
                noResultsMsg.style.display = 'block';
            } else if (noResultsMsg) {
                noResultsMsg.style.display = 'none';
            }
        });
    };
    
    // Search input event listener
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(e.target.value);
            }, 150); // Debounce search for better performance
        });
        
        // Clear search when modal closes
        const clearSearch = () => {
            searchInput.value = '';
            performSearch('');
        };
        
        // Focus search input when modal opens
        const focusSearch = () => {
            setTimeout(() => {
                searchInput.focus();
            }, 300);
        };
        
        exploreBtn.addEventListener('click', focusSearch);
    }
    
    // Open modal
    exploreBtn.addEventListener('click', async () => {
        // Show modal completely
        exploreModal.style.display = 'flex';
        exploreModal.classList.remove('opacity-0', 'pointer-events-none');
        exploreModal.classList.add('opacity-100');
        
        // Prevent background scrolling
        document.body.style.overflow = 'hidden';
        
        // Animate the modal content
        const modalContent = exploreModal.querySelector('.relative');
        if (modalContent) {
            modalContent.classList.remove('scale-95');
            modalContent.classList.add('scale-100');
        }
        
        // Load community templates when modal opens
        console.log('🔄 Loading community templates for explore modal...');
        
        // Function to load community templates directly
        const loadCommunityTemplates = async () => {
            try {
                // Clear existing templates first to prevent duplicates
                const communityGrid = document.getElementById('community-templates-grid');
                if (communityGrid) {
                    // Remove all existing template cards but keep the empty state structure
                    const templateCards = communityGrid.querySelectorAll('.aspect-\\[3\\/1\\]');
                    templateCards.forEach(card => card.remove());
                    console.log(`🧹 Cleared ${templateCards.length} existing template cards`);
                }
                
                // Load from real database via API
                const response = await fetch('/api/templates?limit=50&sort=recent');
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch templates: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                const templates = data.templates || [];
                
                console.log(`📊 Fetched ${templates.length} templates from API:`, templates);
                
                // Load each template into the UI using YAMLSharer if available, otherwise inline
                if (window.yamlSharer && window.yamlSharer.addToCommunityTemplates) {
                    templates.forEach(template => {
                        console.log('🔄 Processing template via YAMLSharer:', template.title);
                        window.yamlSharer.addToCommunityTemplates(template, false);
                    });
                } else {
                    // Fallback: add templates directly to the grid
                    console.log('⚠️ YAMLSharer not available, adding templates directly');
                    templates.forEach(template => {
                        console.log('🔄 Processing template directly:', template.title);
                        addTemplateToCommunityGrid(template);
                    });
                }
                
                console.log(`✅ Loaded ${templates.length} community templates`);
                return templates.length > 0;
            } catch (error) {
                console.error('❌ Failed to load community templates:', error);
                return false;
            }
        };
        
        await loadCommunityTemplates();
    });
    
    // Close modal
    const closeModal = () => {
        const modalContent = exploreModal.querySelector('.relative');
        if (modalContent) {
            modalContent.classList.remove('scale-100');
            modalContent.classList.add('scale-95');
        }
        
        setTimeout(() => {
            // Hide modal completely
            exploreModal.style.display = 'none';
            exploreModal.classList.add('opacity-0', 'pointer-events-none');
            exploreModal.classList.remove('opacity-100');
            
            // Restore background scrolling
            document.body.style.overflow = '';
            
            // Clear search when modal closes
            if (searchInput) {
                searchInput.value = '';
                performSearch('');
            }
        }, 150);
    };
    
    // Close button click
    exploreCloseBtn.addEventListener('click', closeModal);
    
    // Close on backdrop click
    exploreModal.addEventListener('click', (e) => {
        if (e.target === exploreModal || e.target.id === 'explore-backdrop') {
            closeModal();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !exploreModal.classList.contains('opacity-0')) {
            closeModal();
        }
    });
    
    // Add click handler for dstack Complete template in explore modal
    const dstackCompleteTemplate = exploreModal.querySelector('.aspect-\\[3\\/1\\].bg-gradient-to-br.from-blue-500\\/20');
    if (dstackCompleteTemplate) {
        dstackCompleteTemplate.addEventListener('click', () => {
            // Load the default template (same as navigation panel)
            if (window.navigationModule && window.navigationModule.loadTemplate) {
                window.navigationModule.loadTemplate('dstack-complete');
            }
            // Close the modal
            closeModal();
        });
    }
    
    // Add click handler for Axolotl template in explore modal
    const axolotlTemplate = exploreModal.querySelector('.aspect-\\[3\\/1\\].bg-gradient-to-br.from-orange-500\\/20');
    if (axolotlTemplate) {
        axolotlTemplate.addEventListener('click', () => {
            // Load the Axolotl template (same as navigation panel)
            if (window.navigationModule && window.navigationModule.loadTemplate) {
                window.navigationModule.loadTemplate('axolotl');
            }
            // Close the modal
            closeModal();
        });
    }
    
    // Add click handler for vLLM template in explore modal
    const vllmTemplate = exploreModal.querySelector('.aspect-\\[3\\/1\\].bg-gradient-to-br.from-purple-500\\/20');
    if (vllmTemplate) {
        vllmTemplate.addEventListener('click', () => {
            // Load the vLLM template (same as navigation panel)
            if (window.navigationModule && window.navigationModule.loadTemplate) {
                window.navigationModule.loadTemplate('vllm');
            }
            // Close the modal
            closeModal();
        });
    }
    
    // Add click handler for TRL template in explore modal
    const trlTemplate = exploreModal.querySelector('.aspect-\\[3\\/1\\].bg-gradient-to-br.from-green-500\\/20');
    if (trlTemplate) {
        trlTemplate.addEventListener('click', () => {
            // Load the TRL template (same as navigation panel)
            if (window.navigationModule && window.navigationModule.loadTemplate) {
                window.navigationModule.loadTemplate('trl');
            }
            // Close the modal
            closeModal();
        });
    }
};

// Copy to clipboard functionality
const initCopyHandlers = () => {
    const copyBtn = document.getElementById('copy-yaml-btn');
    if (!copyBtn) return;
    
    copyBtn.addEventListener('click', async () => {
        try {
            const { yamlEditor } = window.app || {};
            if (!yamlEditor) {
                console.error('YAML editor not available');
                return;
            }
            
            // Get the YAML content without arrows
            const yamlContent = yamlEditor.getValue().replace(/ [▼▶]/g, '');
            
            // Copy to clipboard
            await navigator.clipboard.writeText(yamlContent);
            
            // Visual feedback - change button temporarily
            const originalHTML = copyBtn.innerHTML;
            const originalClasses = copyBtn.className;
            
            // Show success state
            copyBtn.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            `;
            copyBtn.className = copyBtn.className.replace('from-green-500 to-emerald-500', 'from-green-600 to-green-700');
            copyBtn.title = 'Copied!';
            
            // Reset after 2 seconds
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.className = originalClasses;
                copyBtn.title = 'Copy YAML to Clipboard';
            }, 2000);
            
            console.log('YAML copied to clipboard successfully');
        } catch (error) {
            console.error('Failed to copy YAML to clipboard:', error);
            
            // Show error state briefly
            const originalTitle = copyBtn.title;
            copyBtn.title = 'Copy failed';
            setTimeout(() => {
                copyBtn.title = originalTitle;
            }, 2000);
        }
    });
};

// Initialize all event handlers
const initEventHandlers = () => {
    console.log('🔍 [DEBUG] initEventHandlers called');
    
    initYamlClickHandlers();
    initFormHandlers();
    initPresetHandlers();
    initAnnotationHandlers();
    initDrawerHandlers();
    initHelpTextHandlers();
    initExploreHandlers();
    initCopyHandlers();
    
    // Initialize navigation
    if (window.navigationModule && window.navigationModule.initNavigation) {
        console.log('🔍 [DEBUG] Calling navigationModule.initNavigation');
        window.navigationModule.initNavigation();
    }
    
    // Initialize navigation templates
    if (window.navigationModule && window.navigationModule.initNavTemplates) {
        window.navigationModule.initNavTemplates();
    }
    
    // Debug: Check global pointer events
    setTimeout(() => {
        console.log('🔍 [DEBUG] Global pointer events check:', {
            bodyPointerEvents: getComputedStyle(document.body).pointerEvents,
            bodyClasses: document.body.className,
            leftNavExists: !!document.getElementById('left-nav'),
            leftNavPointerEvents: document.getElementById('left-nav') ? getComputedStyle(document.getElementById('left-nav')).pointerEvents : 'N/A',
            toggleBtnExists: !!document.getElementById('nav-toggle'),
            toggleBtnPointerEvents: document.getElementById('nav-toggle') ? getComputedStyle(document.getElementById('nav-toggle')).pointerEvents : 'N/A'
        });
    }, 1000);
};

// Global test functions
window.testArrows = () => {
    console.log('Manual arrow test...');
    if (window.yamlCollapse && window.yamlCollapse.addArrowsToContent) {
        window.yamlCollapse.addArrowsToContent();
    }
};

window.testToggle = (sectionKey) => {
    console.log('=== MANUAL TOGGLE TEST ===');
    console.log('Toggling section:', sectionKey);
    console.log('Before:', Array.from(window.app.collapsedSections));
    if (window.yamlCollapse && window.yamlCollapse.toggleSection) {
        window.yamlCollapse.toggleSection(sectionKey);
    }
    console.log('After:', Array.from(window.app.collapsedSections));
};

// Debug function to test navigation
window.testNavigation = () => {
    console.log('🔍 [DEBUG] Testing navigation manually...');
    const toggleBtn = document.getElementById('nav-toggle');
    const leftNav = document.getElementById('left-nav');
    const exploreModal = document.getElementById('explore-modal');
    
    console.log('🔍 [DEBUG] Navigation test results:', {
        toggleBtn: !!toggleBtn,
        leftNav: !!leftNav,
        toggleBtnPointerEvents: toggleBtn ? getComputedStyle(toggleBtn).pointerEvents : 'N/A',
        leftNavPointerEvents: leftNav ? getComputedStyle(leftNav).pointerEvents : 'N/A',
        bodyPointerEvents: getComputedStyle(document.body).pointerEvents,
        bodyClasses: document.body.className,
        toggleBtnVisible: toggleBtn ? (getComputedStyle(toggleBtn).visibility === 'visible') : false,
        toggleBtnDisplay: toggleBtn ? getComputedStyle(toggleBtn).display : 'N/A',
        toggleBtnZIndex: toggleBtn ? getComputedStyle(toggleBtn).zIndex : 'N/A',
        leftNavZIndex: leftNav ? getComputedStyle(leftNav).zIndex : 'N/A',
        modalExists: !!exploreModal,
        modalClasses: exploreModal ? exploreModal.className : 'N/A',
        modalOpen: exploreModal && !exploreModal.classList.contains('opacity-0')
    });
    
    if (toggleBtn) {
        console.log('🔍 [DEBUG] Attempting to click toggle button programmatically...');
        toggleBtn.click();
    }
};

// Function to force close modal
window.forceCloseModal = () => {
    console.log('🔍 [DEBUG] Force closing explore modal...');
    const exploreModal = document.getElementById('explore-modal');
    const backdrop = document.getElementById('explore-backdrop');
    
    if (exploreModal) {
        exploreModal.classList.add('opacity-0', 'pointer-events-none');
        exploreModal.classList.remove('opacity-100');
        
        // Fix the backdrop pointer events issue
        if (backdrop) {
            backdrop.classList.remove('pointer-events-auto');
            backdrop.classList.add('pointer-events-none');
            console.log('🔍 [DEBUG] Backdrop fixed:', backdrop.className);
        }
        
        console.log('🔍 [DEBUG] Modal closed. New classes:', exploreModal.className);
    } else {
        console.log('🔍 [DEBUG] Modal not found');
    }
};

// Function to check modal status
window.checkModal = () => {
    const exploreModal = document.getElementById('explore-modal');
    if (exploreModal) {
        console.log('🔍 [DEBUG] Modal status:', {
            classes: exploreModal.className,
            computedPointerEvents: getComputedStyle(exploreModal).pointerEvents,
            computedDisplay: getComputedStyle(exploreModal).display,
            computedOpacity: getComputedStyle(exploreModal).opacity,
            computedZIndex: getComputedStyle(exploreModal).zIndex,
            inlineStyles: {
                pointerEvents: exploreModal.style.pointerEvents,
                display: exploreModal.style.display
            }
        });
    } else {
        console.log('🔍 [DEBUG] Modal not found');
    }
};

// Add global click detector to see what's actually being clicked
document.addEventListener('click', (e) => {
    console.log('🌐 GLOBAL CLICK HANDLER FIRED:', {
        target: e.target,
        id: e.target.id,
        tagName: e.target.tagName,
        bubbles: e.bubbles,
        cancelable: e.cancelable,
        defaultPrevented: e.defaultPrevented
    });
    // Check if modal is open
    const exploreModal = document.getElementById('explore-modal');
    const isModalOpen = exploreModal && !exploreModal.classList.contains('opacity-0');
    
    if (e.target.id === 'nav-toggle' || e.target.closest('#nav-toggle')) {
        console.log('🔍 [DEBUG] DETECTED: Click on nav-toggle!', {
            target: e.target,
            currentTarget: e.currentTarget,
            element: e.target.id === 'nav-toggle' ? e.target : e.target.closest('#nav-toggle'),
            modalOpen: isModalOpen
        });
    } else if (e.target.closest('#left-nav')) {
        console.log('🔍 [DEBUG] DETECTED: Click inside left-nav!', {
            target: e.target,
            closest: e.target.closest('#left-nav'),
            modalOpen: isModalOpen
        });
    } else if (e.target.closest('#explore-modal')) {
        console.log('🔍 [DEBUG] DETECTED: Click inside explore modal!', {
            target: e.target,
            modalOpen: isModalOpen,
            modalClasses: exploreModal ? exploreModal.className : 'N/A'
        });
    } else if (e.target.id === 'share-yaml-btn') {
        console.log('🔍 [DEBUG] DETECTED: Share button clicked!');
        e.preventDefault();
        e.stopPropagation();
        
        // Check authentication first
        if (!window.githubAuth || !window.githubAuth.isAuthenticated()) {
            const notification = document.createElement('div');
            notification.className = 'notification notification-info show';
            notification.textContent = 'Please login with GitHub to share configurations';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
            return;
        }
        
        // Handle share button click directly
        if (window.yamlSharer && window.yamlSharer.handleShare) {
            console.log('✅ Calling yamlSharer.handleShare()');
            window.yamlSharer.handleShare();
        } else {
            console.log('❌ yamlSharer not available, creating inline share modal');
            // Create share modal inline
            const yamlContent = window.app && window.app.yamlEditor ? window.app.yamlEditor.getValue() : '';
            if (!yamlContent || yamlContent.trim() === '') {
                // Create and show notification
                const notification = document.createElement('div');
                notification.className = 'notification notification-warning show';
                notification.textContent = 'No YAML content to share';
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 3000);
                return;
            }
            
            // Create and show simple share modal
            createInlineShareModal(yamlContent);
        }
    } else {
        // Log any other clicks for debugging
        console.log('🔍 [DEBUG] Click detected on:', {
            id: e.target.id,
            className: e.target.className,
            tagName: e.target.tagName,
            target: e.target,
            modalOpen: isModalOpen,
            modalClasses: exploreModal ? exploreModal.className : 'N/A'
        });
    }
}, true); // Use capture phase to catch all clicks

// Update share button state based on authentication
function updateShareButtonState() {
    const shareBtn = document.getElementById('share-yaml-btn');
    if (!shareBtn) return;

    const isAuthenticated = window.githubAuth && window.githubAuth.isAuthenticated();
    
    if (isAuthenticated) {
        // Enable share button
        shareBtn.disabled = false;
        shareBtn.style.opacity = '1';
        shareBtn.title = 'Share YAML Configuration';
        shareBtn.style.cursor = 'pointer';
        shareBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        // Disable share button
        shareBtn.disabled = true;
        shareBtn.style.opacity = '0.5';
        shareBtn.title = 'Login with GitHub to share configurations';
        shareBtn.style.cursor = 'not-allowed';
        shareBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// Direct share button handler as backup
setTimeout(() => {
    const shareBtn = document.getElementById('share-yaml-btn');
    console.log('🔧 Direct share button setup:', !!shareBtn);
    if (shareBtn) {
        shareBtn.addEventListener('click', (e) => {
            console.log('🎯 DIRECT SHARE BUTTON CLICKED!');
            e.preventDefault();
            e.stopPropagation();
            const yamlContent = window.app && window.app.yamlEditor ? window.app.yamlEditor.getValue() : '';
            if (yamlContent && yamlContent.trim()) {
                createInlineShareModal(yamlContent);
            } else {
                alert('No YAML content to share');
            }
        });
        console.log('✅ Direct share button handler attached');
        
        // Initial button state update
        updateShareButtonState();
        
        // Listen for auth state changes
        document.addEventListener('authStateChanged', updateShareButtonState);
        
        // Periodic check for auth state (fallback)
        setInterval(updateShareButtonState, 2000);
    }
}, 1000);

// Inline share modal function
function createInlineShareModal(yamlContent) {
    console.log('🎨 Creating inline share modal');
    
    // Remove any existing share modal
    const existingModal = document.querySelector('.share-modal-overlay');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'share-modal-overlay';
    modal.innerHTML = `
        <div class="share-modal">
            <div class="share-modal-header">
                <h3 class="text-xl font-bold text-white">Share Configuration</h3>
                <button class="share-modal-close" onclick="this.closest('.share-modal-overlay').remove()">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            
            <div class="share-modal-content">
                <div class="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
                    <div class="flex items-center space-x-3 mb-2">
                        <span class="text-2xl">📝</span>
                        <h4 class="text-lg font-semibold text-white">dstack Configuration</h4>
                    </div>
                    <p class="text-sm text-white/70 mb-3">YAML content: ${yamlContent.length} characters</p>
                    <div class="text-xs text-white/50">
                        Ready to share this configuration
                    </div>
                </div>

                <div class="mb-6 text-center">
                    <div class="flex items-center justify-center mb-3">
                        <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                        </svg>
                    </div>
                    <p class="text-white/80 text-sm">
                        Share this configuration with others
                    </p>
                </div>

                <div class="share-modal-footer">
                    <button type="button" class="btn-secondary" onclick="this.closest('.share-modal-overlay').remove()">
                        Cancel
                    </button>
                    <button type="button" class="btn-primary" onclick="submitToCommunity('${encodeURIComponent(yamlContent)}')">
                        Submit to Community
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    document.body.appendChild(modal);
    
    // Show modal with animation
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

// Submit to community function
function submitToCommunity(encodedYaml) {
    try {
        const yamlContent = decodeURIComponent(encodedYaml);
        
        // Get GitHub user information
        const githubUser = window.githubAuth ? window.githubAuth.getUser() : null;
        
        // Get configuration metadata from title section
        const configData = {
            title: document.getElementById('config-title')?.textContent?.trim() || 'Untitled Configuration',
            description: (() => {
                const desc = document.getElementById('config-description')?.textContent?.trim();
                return (desc && desc !== 'Click to add a description...') ? desc : 'Community shared configuration';
            })(),
            emoji: document.getElementById('config-emoji')?.value || '📝',
            category: document.getElementById('config-category')?.value || '',
            yaml_content: yamlContent,
            filename: 'dstack.yml',
            // Explicitly reset engagement metrics for new shares
            like_count: 0,
            view_count: 0,
            author: githubUser ? {
                id: githubUser.id || githubUser.node_id,
                name: githubUser.name || githubUser.login,
                username: githubUser.login,
                avatar_url: githubUser.avatar_url,
                profile_url: githubUser.html_url
            } : {
                id: 'anonymous',
                name: 'Anonymous User',
                username: 'anonymous',
                avatar_url: 'https://github.com/github.png',
                profile_url: 'https://github.com'
            }
        };
        
        console.log('📤 Submitting to community:', configData);
        console.log('🔍 DEBUG: like_count in configData:', configData.like_count);
        console.log('🔍 DEBUG: view_count in configData:', configData.view_count);
        
        // Submit to database via API
        submitToDatabase(configData);
        
    } catch (error) {
        console.error('Failed to submit to community:', error);
        alert('Failed to submit to community');
    }
}

// Submit to database via API
async function submitToDatabase(configData) {
    try {
        console.log('💾 Submitting to database:', configData);
        
        const response = await fetch('/api/templates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(configData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 409) {
                // Handle duplicate error
                const notification = document.createElement('div');
                notification.className = 'notification notification-warning show';
                notification.textContent = `"${configData.title}" has already been shared to the community`;
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 5000);
            } else {
                throw new Error(errorData.message || 'Failed to submit template');
            }
        } else {
            const newTemplate = await response.json();
            console.log('✅ Template saved to database:', newTemplate);
            console.log('🔍 DEBUG: like_count in server response:', newTemplate.like_count);
            console.log('🔍 DEBUG: view_count in server response:', newTemplate.view_count);
            
            // Add to UI immediately for better UX - use server response data to ensure correct like_count
            addToCommunityTemplates(newTemplate);
            
            // Reset localStorage like count for this configuration since it's now a fresh shared template
            if (window.yamlLiker && window.yamlLiker.resetCurrentConfigLikes) {
                window.yamlLiker.resetCurrentConfigLikes();
            }
            
            // Show success notification
            const notification = document.createElement('div');
            notification.className = 'notification notification-success show';
            notification.textContent = `"${configData.title}" submitted to community!`;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }
        
        // Close modal
        document.querySelector('.share-modal-overlay')?.remove();
        
    } catch (error) {
        console.error('❌ Failed to submit to database:', error);
        
        // Show error notification
        const notification = document.createElement('div');
        notification.className = 'notification notification-error show';
        notification.textContent = 'Failed to submit to community. Please try again.';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

// Add to community templates function
function addToCommunityTemplates(shareData) {
    const communityGrid = document.getElementById('community-templates-grid');
    if (!communityGrid) {
        console.error('Community templates grid not found');
        return;
    }

    // Remove empty state if it exists
    const emptyState = communityGrid.querySelector('.col-span-2');
    if (emptyState) {
        emptyState.remove();
    }

    // Generate random gradient colors for visual variety
    const gradients = [
        'from-emerald-500/20 to-green-500/20 border-emerald-500/30',
        'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
        'from-purple-500/20 to-violet-500/20 border-purple-500/30',
        'from-pink-500/20 to-rose-500/20 border-pink-500/30',
        'from-orange-500/20 to-red-500/20 border-orange-500/30',
        'from-teal-500/20 to-cyan-500/20 border-teal-500/30',
        'from-yellow-500/20 to-amber-500/20 border-yellow-500/30'
    ];
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

    // Create template card
    const templateCard = document.createElement('div');
    templateCard.className = `aspect-[3/1] bg-gradient-to-br ${randomGradient} rounded-lg p-2 hover:scale-105 transition-all cursor-pointer group overflow-hidden`;
    
    const emoji = shareData.emoji || '📄';
    const categoryLabel = getCategoryLabel(shareData.category);
    
    templateCard.innerHTML = `
        <div class="h-full flex flex-col justify-between">
            <div class="flex items-start gap-1">
                <span class="text-sm shrink-0">${emoji}</span>
                <div class="min-w-0 flex-1">
                    <h4 class="text-white text-xs font-medium leading-none truncate">${shareData.title}</h4>
                    <p class="text-white/60 text-[9px] leading-tight mt-0.5 line-clamp-2">${shareData.description}</p>
                </div>
            </div>
            <div class="mt-auto">
                <div class="flex items-center gap-1 mb-1">
                    <img src="${shareData.author?.avatar_url}" alt="${shareData.author?.name}" class="w-3 h-3 rounded-full">
                    <span class="text-white/50 text-[8px] truncate">by ${shareData.author?.name}</span>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-white/50 text-[8px] font-medium px-2 py-0.5 bg-white/10 rounded-full">${categoryLabel}</span>
                    <p class="text-white/40 text-[8px] leading-none">Just now</p>
                </div>
            </div>
        </div>
    `;

    // Add click handler to load the configuration
    templateCard.addEventListener('click', () => {
        loadCommunityTemplate(shareData);
    });

    // Insert at the beginning of the grid
    communityGrid.insertBefore(templateCard, communityGrid.firstChild);
    
    console.log('✅ Added template to community grid:', shareData.title);
}

// Helper function to get category label
function getCategoryLabel(category) {
    const categoryLabels = {
        'ml-training': 'ML Training',
        'data-processing': 'Data Processing',
        'web-services': 'Web Services',
        'database': 'Database',
        'networking': 'Networking',
        'monitoring': 'Monitoring',
        'testing': 'Testing',
        'documentation': 'Documentation'
    };
    return categoryLabels[category] || category || 'General';
}

// Helper function to load community template
function loadCommunityTemplate(shareData) {
    try {
        const yamlContent = shareData.yaml_content;
        
        if (!yamlContent) {
            alert('Failed to load template content');
            return;
        }

        // Load the YAML content into the editor
        if (window.app && window.app.yamlEditor) {
            window.app.yamlEditor.setValue(yamlContent);
            
            // Dispatch YAML content change event
            const event = new CustomEvent('yamlContentChanged', {
                detail: {
                    content: yamlContent,
                    timestamp: new Date().toISOString()
                }
            });
            document.dispatchEvent(event);
        }
        
        // Show notification
        const notification = document.createElement('div');
        notification.className = 'notification notification-success show';
        notification.textContent = `Loaded "${shareData.title}" from community`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
        
        // Close explore modal if open
        const exploreModal = document.getElementById('explore-modal');
        if (exploreModal) {
            exploreModal.style.display = 'none';
            exploreModal.classList.add('opacity-0', 'pointer-events-none');
            exploreModal.classList.remove('opacity-100');
            document.body.style.overflow = '';
        }
        
    } catch (error) {
        console.error('Failed to load community template:', error);
        alert('Failed to load template');
    }
}

// Export
window.eventHandlers = {
    initEventHandlers
};