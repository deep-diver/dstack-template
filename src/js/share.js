/**
 * YAML Share Functionality
 * Handles sharing YAML configurations via URL, clipboard, or other methods
 */

class YAMLSharer {
    constructor() {
        this.initEventListeners();
        // Load saved community templates on initialization (after ensuring DOM is ready)
        this.initCommunityTemplates();
    }

    async initCommunityTemplates() {
        // Wait for DOM to be fully ready and app to be initialized
        const waitForElement = () => {
            return new Promise((resolve) => {
                const checkElement = () => {
                    const communityGrid = document.getElementById('community-templates-grid');
                    if (communityGrid) {
                        console.log('✅ Community grid element found, loading templates...');
                        resolve();
                    } else {
                        console.log('⏳ Waiting for community grid element...');
                        setTimeout(checkElement, 100);
                    }
                };
                checkElement();
            });
        };

        await waitForElement();
        await this.loadCommunityTemplatesFromStorage();
    }

    initEventListeners() {
        const shareBtn = document.getElementById('share-yaml-btn');
        console.log('🔧 Share button found:', !!shareBtn);
        if (shareBtn) {
            shareBtn.addEventListener('click', (e) => {
                console.log('🖱️ Share button clicked!');
                e.preventDefault();
                this.handleShare();
            });
            console.log('✅ Share button event listener attached');
        } else {
            console.error('❌ Share button not found!');
        }
        
        // Update share button state when auth changes
        this.updateShareButtonState();
        
        // Listen for auth state changes
        document.addEventListener('authStateChanged', () => {
            this.updateShareButtonState();
        });

        // Listen for like changes to update template counts in explore modal
        document.addEventListener('templateLikeChanged', (event) => {
            console.log('Explore modal received like change event:', event.detail);
            this.updateTemplateInExploreModal(event.detail.templateId);
        });
    }

    updateShareButtonState() {
        const shareBtn = document.getElementById('share-yaml-btn');
        if (!shareBtn) return;

        const isAuthenticated = window.githubAuth && window.githubAuth.isAuthenticated();
        
        if (isAuthenticated) {
            // Enable share button
            shareBtn.disabled = false;
            shareBtn.style.opacity = '1';
            shareBtn.title = 'Share YAML Configuration';
            shareBtn.style.cursor = 'pointer';
        } else {
            // Disable share button
            shareBtn.disabled = true;
            shareBtn.style.opacity = '0.5';
            shareBtn.title = 'Login with GitHub to share configurations';
            shareBtn.style.cursor = 'not-allowed';
        }
    }

    async handleShare() {
        console.log('🚀 handleShare() called');
        try {
            // Get current YAML content
            const yamlContent = this.getCurrentYAML();
            console.log('📄 YAML content:', yamlContent ? yamlContent.length + ' characters' : 'empty');
            
            if (!yamlContent || yamlContent.trim() === '') {
                console.log('⚠️ No YAML content, showing notification');
                this.showNotification('No YAML content to share', 'warning');
                return;
            }

            // Always show the custom share modal (bypassing auth for now)
            console.log('✅ Showing share modal');
            this.showShareModal(yamlContent);
        } catch (error) {
            console.error('❌ Share failed:', error);
            this.showNotification('Failed to share configuration', 'error');
        }
    }

    getCurrentYAML() {
        if (window.app && window.app.yamlEditor) {
            return window.app.yamlEditor.getValue();
        }
        return '';
    }

    async shareViaWebAPI(yamlContent) {
        const filename = this.getCurrentFilename();
        await navigator.share({
            title: `dstack Configuration: ${filename}`,
            text: 'Check out this dstack configuration:',
            files: [new File([yamlContent], filename, { type: 'text/yaml' })]
        });
        this.showNotification('Configuration shared successfully!', 'success');
    }

    showShareModal(yamlContent) {
        // Create and show a custom share modal
        const modal = this.createShareModal(yamlContent);
        document.body.appendChild(modal);
        
        // Show modal with animation
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
    }

    createShareModal(yamlContent) {
        // Get current configuration metadata from title section
        const configData = window.configTitleEditor ? window.configTitleEditor.getCurrentConfigMetadata() : {
            title: 'Untitled Configuration',
            description: '',
            emoji: '📝',
            category: ''
        };

        const modal = document.createElement('div');
        modal.className = 'share-modal-overlay';
        modal.innerHTML = `
            <div class="share-modal">
                <div class="share-modal-header">
                    <h3 class="text-xl font-bold text-white">Share to Community</h3>
                    <button class="share-modal-close" onclick="this.closest('.share-modal-overlay').remove()">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="share-modal-content">
                    <!-- Configuration Preview -->
                    <div class="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
                        <div class="flex items-center space-x-3 mb-2">
                            <span class="text-2xl">${configData.emoji}</span>
                            <h4 class="text-lg font-semibold text-white">${configData.title}</h4>
                            ${configData.category ? `<span class="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-300">${this.getCategoryLabel(configData.category)}</span>` : ''}
                        </div>
                        ${configData.description ? `<p class="text-sm text-white/70 mb-3">${configData.description}</p>` : ''}
                        <div class="text-xs text-white/50">
                            Configuration will be shared with these details
                        </div>
                    </div>

                    <!-- Missing Information Warning -->
                    ${this.getMissingFieldsWarning(configData)}

                    <!-- Confirmation Message -->
                    <div class="mb-6 text-center">
                        <div class="flex items-center justify-center mb-3">
                            <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                        </div>
                        <p class="text-white/80 text-sm">
                            Ready to share this configuration with the community?
                        </p>
                        <p class="text-white/60 text-xs mt-2">
                            Your configuration will be available in the "from community" section of the Explore templates.
                        </p>
                    </div>

                    <!-- Action Buttons -->
                    <div class="share-modal-footer">
                        <button type="button" class="btn-secondary" onclick="this.closest('.share-modal-overlay').remove()">
                            Cancel
                        </button>
                        <button type="button" class="btn-primary" onclick="window.yamlSharer.confirmShare('${this.encodeYAML(yamlContent)}')">
                            Share to Community
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

        return modal;
    }

    getMissingFieldsWarning(configData) {
        const missingFields = [];
        if (!configData.title || configData.title === 'Untitled Configuration') missingFields.push('title');
        if (!configData.category) missingFields.push('category');
        if (!configData.description) missingFields.push('description');

        if (missingFields.length === 0) {
            return '';
        }

        return `
            <div class="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/40 rounded-lg">
                <div class="flex items-center mb-2">
                    <svg class="w-4 h-4 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    <span class="text-sm font-medium text-yellow-300">Consider adding missing information</span>
                </div>
                <p class="text-xs text-yellow-200">
                    Missing: ${missingFields.join(', ')}. You can edit these in the title section above before sharing.
                </p>
            </div>
        `;
    }

    async confirmShare(encodedYAML) {
        // Get current configuration metadata
        const configData = window.configTitleEditor ? window.configTitleEditor.getCurrentConfigMetadata() : {
            title: 'Untitled Configuration',
            description: '',
            emoji: '📝',
            category: ''
        };
        
        const yamlContent = this.decodeYAML(encodedYAML);
        
        // Create the share data object
        const shareData = {
            title: configData.title,
            category: configData.category,
            emoji: configData.emoji,
            description: configData.description,
            yaml_content: yamlContent,
            filename: this.getCurrentFilename(),
            author: window.githubAuth ? window.githubAuth.getUser() : null
        };
        
        console.log('Share Data:', shareData);
        
        try {
            // Submit to real database via API
            await this.submitToDatabase(shareData);
            
            // Close the modal
            this.closeShareModal();
        } catch (error) {
            if (error.status === 409) {
                // Handle duplicate error from backend
                this.showDuplicateWarning(configData.title);
            } else {
                console.error('Failed to share template:', error);
                this.showNotification('Failed to share configuration. Please try again.', 'error');
            }
        }
    }

    async isDuplicate(title, yamlContent) {
        // Duplicate checking is now handled by the backend
        // This method can be simplified or removed since the backend 
        // will return a 409 error if there's a duplicate
        return false;
    }

    showDuplicateWarning(title) {
        // Close the share modal first
        this.closeShareModal();
        
        // Show duplicate warning notification
        this.showNotification(`"${title}" has already been shared to the community`, 'warning', 5000);
        
        // Show a more detailed modal
        const warningModal = document.createElement('div');
        warningModal.className = 'share-modal-overlay';
        warningModal.innerHTML = `
            <div class="share-modal">
                <div class="share-modal-header">
                    <h3 class="text-xl font-bold text-white">Duplicate Configuration</h3>
                    <button class="share-modal-close" onclick="this.closest('.share-modal-overlay').remove()">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="share-modal-content">
                    <!-- Warning Icon and Message -->
                    <div class="text-center mb-6">
                        <div class="flex items-center justify-center mb-4">
                            <svg class="w-16 h-16 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                        </div>
                        <h4 class="text-lg font-semibold text-white mb-2">Configuration Already Shared</h4>
                        <p class="text-white/80 text-sm mb-2">
                            A configuration with the title <strong>"${title}"</strong> and identical YAML content already exists in the community.
                        </p>
                        <p class="text-white/60 text-xs">
                            To share this configuration, please modify the title or YAML content to make it unique.
                        </p>
                    </div>

                    <!-- Suggestions -->
                    <div class="mb-6 p-4 bg-blue-500/20 border border-blue-500/40 rounded-lg">
                        <h5 class="text-sm font-medium text-blue-300 mb-2">Suggestions:</h5>
                        <ul class="text-xs text-blue-200 space-y-1">
                            <li>• Modify the title in the configuration section above</li>
                            <li>• Add version numbers or unique identifiers</li>
                            <li>• Make changes to the YAML configuration</li>
                            <li>• Check the community templates to see the existing version</li>
                        </ul>
                    </div>

                    <!-- Action Buttons -->
                    <div class="share-modal-footer">
                        <button type="button" class="btn-secondary" onclick="this.closest('.share-modal-overlay').remove()">
                            Got It
                        </button>
                        <button type="button" class="btn-primary" onclick="this.closest('.share-modal-overlay').remove(); document.getElementById('explore-btn').click();">
                            View Community Templates
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add click outside to close
        warningModal.addEventListener('click', (e) => {
            if (e.target === warningModal) {
                warningModal.remove();
            }
        });

        document.body.appendChild(warningModal);
        
        // Show modal with animation
        requestAnimationFrame(() => {
            warningModal.classList.add('show');
        });
    }

    async submitToDatabase(shareData) {
        // Check if user is authenticated
        if (!window.githubAuth || !window.githubAuth.isAuthenticated()) {
            throw new Error('Authentication required');
        }

        const response = await fetch('/api/templates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(shareData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            const error = new Error(errorData.message || 'Failed to share template');
            error.status = response.status;
            error.data = errorData;
            throw error;
        }

        const newTemplate = await response.json();
        
        // Add to UI immediately for better UX
        this.addToCommunityTemplates(newTemplate);
        
        this.showNotification(`Configuration "${shareData.title}" shared to community!`, 'success');
        
        return newTemplate;
    }

    saveToCommunityStorage(shareData) {
        try {
            // Get existing community templates
            const existingTemplates = JSON.parse(localStorage.getItem('communityTemplates') || '[]');
            
            // Add new template with unique ID and timestamp
            const newTemplate = {
                id: Math.random().toString(36).substr(2, 9),
                ...shareData,
                timestamp: new Date().toISOString()
            };
            
            // Add to beginning of array (most recent first)
            existingTemplates.unshift(newTemplate);
            
            // Limit to 50 templates to prevent storage bloat
            if (existingTemplates.length > 50) {
                existingTemplates.splice(50);
            }
            
            // Save back to localStorage
            localStorage.setItem('communityTemplates', JSON.stringify(existingTemplates));
        } catch (error) {
            console.error('Failed to save to community storage:', error);
        }
    }

    async loadCommunityTemplatesFromStorage() {
        console.log('📡 Loading community templates from database...');
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
            
            // Load each template into the UI
            templates.forEach(template => {
                console.log('🔄 Processing template:', template.title);
                this.addToCommunityTemplates(template, false); // false = don't save again
            });
            
            console.log(`✅ Loaded ${templates.length} community templates from database`);
            return templates.length > 0;
        } catch (error) {
            console.error('Failed to load community templates from database:', error);
            
            // Fallback to localStorage for offline functionality
            try {
                const savedTemplates = JSON.parse(localStorage.getItem('communityTemplates') || '[]');
                savedTemplates.forEach(template => {
                    this.addToCommunityTemplates(template, false);
                });
                return savedTemplates.length > 0;
            } catch (fallbackError) {
                console.error('Fallback to localStorage also failed:', fallbackError);
                return false;
            }
        }
    }

    addToCommunityTemplates(shareData, shouldSave = true) {
        const communityGrid = document.getElementById('community-templates-grid');
        if (!communityGrid) {
            console.error('❌ Community templates grid not found!');
            return;
        }
        
        console.log('✅ Adding template to community grid:', shareData.title);

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
        // Add template ID for precise identification when updating likes
        if (shareData.id) {
            templateCard.setAttribute('data-template-id', shareData.id);
        }
        
        const emoji = shareData.emoji || '📄';
        const timeAgo = this.getTimeAgo(shareData.created_at || shareData.timestamp);
        
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
                        <span class="text-white/50 text-[8px] font-medium px-2 py-0.5 bg-white/10 rounded-full">${this.getCategoryLabel(shareData.category)}</span>
                        <p class="text-white/40 text-[8px] leading-none">${timeAgo}</p>
                    </div>
                </div>
            </div>
        `;

        // Add click handler to load the configuration
        templateCard.addEventListener('click', () => {
            this.loadCommunityTemplate(shareData);
        });

        // Insert at the beginning of the grid
        communityGrid.insertBefore(templateCard, communityGrid.firstChild);
    }

    async loadCommunityTemplate(shareData) {
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
                this.showNotification('Failed to load template content', 'error');
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
                
                // Set the correct like count from database after a brief delay to ensure like system is ready
                setTimeout(() => {
                    if (window.yamlLiker && window.yamlLiker.setCommunityTemplateLikeCount) {
                        window.yamlLiker.setCommunityTemplateLikeCount(shareData.like_count || 0);
                    }
                    
                    // Dispatch community template loaded event for delete button
                    const templateLoadedEvent = new CustomEvent('communityTemplateLoaded', {
                        detail: shareData
                    });
                    document.dispatchEvent(templateLoadedEvent);
                }, 100);
                
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
            
            // Show notification
            this.showNotification(`Loaded "${shareData.title}" from community`, 'success');
            
            // Close explore modal if open
            const exploreModal = document.getElementById('explore-modal');
            if (exploreModal) {
                // Animate close
                const modalContent = exploreModal.querySelector('.relative');
                if (modalContent) {
                    modalContent.classList.remove('scale-100');
                    modalContent.classList.add('scale-95');
                }
                
                setTimeout(() => {
                    exploreModal.style.display = 'none';
                    exploreModal.classList.add('opacity-0', 'pointer-events-none');
                    exploreModal.classList.remove('opacity-100');
                    
                    // Restore background scrolling
                    document.body.style.overflow = '';
                }, 150);
            }
        }
    }

    async shareAsURL(encodedYAML) {
        try {
            const url = new URL(window.location.href);
            url.searchParams.set('config', encodedYAML);
            
            await navigator.clipboard.writeText(url.toString());
            this.showNotification('Shareable link copied to clipboard!', 'success');
            this.closeShareModal();
        } catch (error) {
            this.showNotification('Failed to copy link', 'error');
        }
    }

    async shareAsFile(encodedYAML) {
        try {
            const yamlContent = this.decodeYAML(encodedYAML);
            const filename = this.getCurrentFilename();
            const blob = new Blob([yamlContent], { type: 'text/yaml' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            
            URL.revokeObjectURL(url);
            this.showNotification('Configuration downloaded!', 'success');
            this.closeShareModal();
        } catch (error) {
            this.showNotification('Failed to download file', 'error');
        }
    }

    async shareAsGist(encodedYAML) {
        try {
            const yamlContent = this.decodeYAML(encodedYAML);
            const filename = this.getCurrentFilename();
            
            // Open GitHub Gist creation page with pre-filled content
            const gistUrl = 'https://gist.github.com/';
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = gistUrl;
            form.target = '_blank';
            
            const fileInput = document.createElement('input');
            fileInput.type = 'hidden';
            fileInput.name = 'gist[files][][name]';
            fileInput.value = filename;
            
            const contentInput = document.createElement('input');
            contentInput.type = 'hidden';
            contentInput.name = 'gist[files][][content]';
            contentInput.value = yamlContent;
            
            form.appendChild(fileInput);
            form.appendChild(contentInput);
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
            
            this.showNotification('Opening GitHub Gist...', 'info');
            this.closeShareModal();
        } catch (error) {
            this.showNotification('Failed to create Gist', 'error');
        }
    }

    async copyToClipboard(encodedYAML) {
        try {
            const yamlContent = this.decodeYAML(encodedYAML);
            await navigator.clipboard.writeText(yamlContent);
            this.showNotification('Configuration copied to clipboard!', 'success');
            this.closeShareModal();
        } catch (error) {
            this.showNotification('Failed to copy to clipboard', 'error');
        }
    }

    encodeYAML(yamlContent) {
        return btoa(encodeURIComponent(yamlContent));
    }

    decodeYAML(encodedYAML) {
        return decodeURIComponent(atob(encodedYAML));
    }

    getCurrentFilename() {
        const filenameElement = document.getElementById('yaml-filename');
        return filenameElement ? filenameElement.textContent.trim() : 'dstack.yml';
    }

    closeShareModal() {
        const modal = document.querySelector('.share-modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    isMobileDevice() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    showNotification(message, type = 'info', duration = 3000) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Show with animation
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // Remove after specified duration
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
    getTimeAgo(timestamp) {
        if (!timestamp) return 'Just now';
        
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return `${Math.floor(diffInSeconds / 604800)}w ago`;
    }

    getCategoryLabel(category) {
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

    // Admin function to clear community database
    async clearCommunityDatabase() {
        try {
            // Note: This would require admin API endpoints in a real application
            // For now, we'll just clear the localStorage and UI
            localStorage.removeItem('communityTemplates');
            
            // Clear the UI grid
            const communityGrid = document.getElementById('community-templates-grid');
            if (communityGrid) {
                communityGrid.innerHTML = `
                    <div class="col-span-2 text-center py-8">
                        <div class="text-white/40 text-sm">
                            <svg class="w-12 h-12 mx-auto mb-3 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                            <p class="font-medium">No community templates yet</p>
                            <p class="text-xs mt-1">Share your configurations to get started!</p>
                        </div>
                    </div>
                `;
            }
            
            console.log('Community templates cache cleared successfully');
            this.showNotification('Community cache cleared (database requires admin access)', 'success');
            return true;
        } catch (error) {
            console.error('Failed to clear community database:', error);
            this.showNotification('Failed to clear community database', 'error');
            return false;
        }
    }

    // Update a specific template's like count in the explore modal
    async updateTemplateInExploreModal(templateId) {
        try {
            // Fetch updated template data
            const response = await fetch(`/api/templates/${templateId}`);
            if (!response.ok) {
                console.error('Failed to fetch updated template data for explore modal');
                return;
            }
            
            const updatedTemplate = await response.json();
            
            // Find the template card in the explore modal by ID
            const communityGrid = document.getElementById('community-templates-grid');
            if (!communityGrid) return;
            
            const templateCard = communityGrid.querySelector(`[data-template-id="${templateId}"]`);
            if (templateCard) {
                // Find and update the like count element in this specific card
                const likeElements = templateCard.querySelectorAll('div');
                likeElements.forEach(element => {
                    if (element.textContent.includes('❤️')) {
                        // This element contains the like count, update it
                        const text = element.textContent;
                        const newText = text.replace(/❤️\s*\d+/, `❤️ ${updatedTemplate.like_count || 0}`);
                        element.textContent = newText;
                        console.log('Updated like count in explore modal for template ID:', templateId, 'new count:', updatedTemplate.like_count);
                    }
                });
            } else {
                console.log('Template card not found in explore modal for ID:', templateId);
            }
            
        } catch (error) {
            console.error('Error updating template in explore modal:', error);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📦 Initializing YAMLSharer...');
    window.yamlSharer = new YAMLSharer();
    console.log('✅ YAMLSharer initialized:', window.yamlSharer);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = YAMLSharer;
}