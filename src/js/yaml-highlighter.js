/**
 * YAML Field Highlighter
 * Highlights corresponding YAML sections when hovering over form fields
 */

class YAMLHighlighter {
    constructor() {
        this.overlay = null;
        this.yamlEditor = null;
        this.fieldMappings = new Map();
        this.init();
    }

    init() {
        this.createOverlay();
        this.setupEventListeners();
        this.initializeFieldMappings();
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'yaml-highlight-overlay';
        
        // Append to YAML editor container
        const yamlContainer = document.getElementById('yaml-editor-container');
        if (yamlContainer) {
            yamlContainer.style.position = 'relative';
            yamlContainer.appendChild(this.overlay);
        }
    }

    setupEventListeners() {
        console.log('🔍 YAML Highlighter: Setting up event listeners');
        
        // Listen for mouseenter/mouseleave on field containers and fieldsets
        document.addEventListener('mouseenter', (e) => {
            if (!e.target || typeof e.target.closest !== 'function') return;
            
            const fieldContainer = e.target.closest('.field-container');
            const fieldset = e.target.closest('fieldset');
            const editButton = e.target.closest('.edit-button');
            
            console.log('🖱️ Mouse enter detected on:', {
                target: e.target.tagName + (e.target.className ? '.' + e.target.className : ''),
                fieldContainer: !!fieldContainer,
                fieldset: !!fieldset,
                editButton: !!editButton
            });
            
            if (fieldContainer) {
                console.log('🎯 Handling field container hover');
                this.handleFieldHover(fieldContainer);
            } else if (fieldset && fieldset.querySelector('legend')) {
                console.log('🎯 Handling fieldset hover');
                this.handleFieldsetHover(fieldset);
            } else if (editButton) {
                console.log('🎯 Handling edit button hover');
                this.handleEditButtonHover(editButton);
            } else {
                console.log('⚠️ No matching hover target found');
            }
        }, true);

        document.addEventListener('mouseleave', (e) => {
            if (!e.target || typeof e.target.closest !== 'function') return;
            
            const fieldContainer = e.target.closest('.field-container');
            const fieldset = e.target.closest('fieldset');
            const editButton = e.target.closest('.edit-button');
            
            if (fieldContainer || fieldset || editButton) {
                console.log('🖱️ Mouse leave detected, hiding highlight');
                this.hideHighlight();
            }
        }, true);
    }

    initializeFieldMappings() {
        // Map form field names to YAML paths
        this.fieldMappings.set('name', 'name');
        this.fieldMappings.set('type', 'type');
        this.fieldMappings.set('image', 'image');
        this.fieldMappings.set('commands', 'commands');
        this.fieldMappings.set('env', 'env');
        this.fieldMappings.set('ports', 'ports');
        this.fieldMappings.set('resources', 'resources');
        this.fieldMappings.set('volumes', 'volumes');
        this.fieldMappings.set('working_dir', 'working_dir');
        this.fieldMappings.set('setup', 'setup');
    }

    handleFieldHover(fieldContainer) {
        console.log('🎯 handleFieldHover called with container:', fieldContainer);
        
        // Get field path from data-path attribute
        const input = fieldContainer.querySelector('input, select, textarea, [data-path]');
        let fieldPath = input?.getAttribute('data-path') || fieldContainer.getAttribute('data-path');
        
        console.log('📍 Field path detection:', {
            input: input ? input.tagName + (input.name ? `[name="${input.name}"]` : '') : 'none',
            dataPath: fieldPath,
            containerDataPath: fieldContainer.getAttribute('data-path')
        });
        
        // If no direct data-path, try to infer from grouped field structure
        if (!fieldPath) {
            fieldPath = this.inferFieldPathFromContainer(fieldContainer);
            console.log('🔍 Inferred field path:', fieldPath);
        }
        
        if (fieldPath) {
            // Convert data-path to YAML key (e.g., "resources.gpu" -> "resources", "commands.0" -> "commands")
            const yamlKey = this.getYamlKeyFromPath(fieldPath);
            console.log('🔑 YAML key conversion:', { fieldPath, yamlKey });
            if (yamlKey) {
                console.log('✅ Calling highlightYAMLSection with key:', yamlKey);
                this.highlightYAMLSection(yamlKey);
            } else {
                console.log('❌ No YAML key generated');
            }
        } else {
            console.log('❌ No field path found');
        }
    }

    handleFieldsetHover(fieldset) {
        // Get the legend text or data-path from fieldset
        const legend = fieldset.querySelector('legend');
        const legendText = legend?.textContent?.trim();
        
        console.log('Fieldset hover detected:', legendText);
        
        // Try to get data-path from remove button inside fieldset
        const removeBtn = fieldset.querySelector('.remove-btn[data-path]');
        let yamlKey = null;
        
        if (removeBtn && removeBtn.getAttribute('data-path')) {
            const dataPath = removeBtn.getAttribute('data-path');
            yamlKey = this.getYamlKeyFromPath(dataPath);
            console.log('Fieldset YAML key from remove button:', yamlKey, 'data-path:', dataPath);
        } else {
            // Fallback: try to infer from parent structure or legend
            yamlKey = this.extractYamlKeyFromLegend(legendText) || 
                     this.inferFieldTypeFromContext(fieldset);
            console.log('Fieldset YAML key from legend/context:', yamlKey);
        }
        
        if (yamlKey) {
            this.highlightYAMLSection(yamlKey);
        }
    }

    handleEditButtonHover(editButton) {
        // Extract path from onclick handler
        const onclickAttr = editButton.getAttribute('onclick');
        let section = null;
        
        if (onclickAttr) {
            // Parse onclick="openDrawer('currentPath', 'key')" to extract the path
            const match = onclickAttr.match(/openDrawer\s*\(\s*['"]([^'"]*)['"]\s*,\s*['"]([^'"]*)['"]\s*\)/);
            if (match) {
                const currentPath = match[1];
                const key = match[2];
                section = currentPath ? `${currentPath}.${key}` : key;
            }
        }
        
        console.log('Edit button hover detected:', section, 'from onclick:', onclickAttr);
        
        if (section) {
            const yamlKey = this.getYamlKeyFromPath(section);
            console.log('Edit button YAML key:', yamlKey);
            this.highlightYAMLSection(yamlKey);
        }
    }

    inferFieldPathFromContainer(fieldContainer) {
        // Try to extract field path from grouped field containers
        
        // 1. Check for edit button onclick handler
        const editButton = fieldContainer.querySelector('.edit-button');
        if (editButton) {
            const onclickAttr = editButton.getAttribute('onclick');
            if (onclickAttr) {
                const match = onclickAttr.match(/openDrawer\s*\(\s*['"]([^'"]*)['"]\s*,\s*['"]([^'"]*)['"]\s*\)/);
                if (match) {
                    const currentPath = match[1];
                    const key = match[2];
                    return currentPath ? `${currentPath}.${key}` : key;
                }
            }
        }
        
        // 2. Check label text for field name
        const label = fieldContainer.querySelector('label span');
        if (label) {
            const labelText = label.textContent.trim();
            const yamlKey = this.extractYamlKeyFromLegend(labelText);
            if (yamlKey) {
                return yamlKey;
            }
        }
        
        // 3. Check for remove field button
        const removeBtn = fieldContainer.querySelector('.remove-field-btn');
        if (removeBtn) {
            const onclickAttr = removeBtn.getAttribute('onclick');
            if (onclickAttr) {
                const match = onclickAttr.match(/removeFieldFromForm\s*\(\s*['"]([^'"]*)['"]\s*\)/);
                if (match) {
                    return match[1];
                }
            }
        }
        
        return null;
    }

    inferFieldTypeFromContext(fieldset) {
        // Try to infer the field type from surrounding context
        // Look for any input fields inside the fieldset with data-path
        const inputsWithPath = fieldset.querySelectorAll('[data-path]');
        if (inputsWithPath.length > 0) {
            const firstPath = inputsWithPath[0].getAttribute('data-path');
            return this.getYamlKeyFromPath(firstPath);
        }
        
        // Look at parent containers for clues
        const parentContainer = fieldset.closest('.field-container');
        if (parentContainer) {
            const label = parentContainer.querySelector('label span');
            if (label) {
                const labelText = label.textContent.trim();
                return this.extractYamlKeyFromLegend(labelText);
            }
        }
        
        return null;
    }

    extractYamlKeyFromLegend(legendText) {
        if (!legendText) return null;
        
        // Common legend text patterns to YAML keys
        const legendMappings = {
            'Resources': 'resources',
            'Environment Variables': 'env',
            'Environment': 'env',
            'Commands': 'commands',
            'Ports': 'ports',
            'Volumes': 'volumes',
            'Setup': 'setup',
            'Working Directory': 'working_dir',
            'GPU': 'resources',
            'Memory': 'resources',
            'CPU': 'resources',
            'Fleet': 'fleet',
            'Backends': 'backends',
            'Regions': 'regions'
        };
        
        // Try exact match first
        if (legendMappings[legendText]) {
            return legendMappings[legendText];
        }
        
        // Try partial matches
        for (const [legend, yamlKey] of Object.entries(legendMappings)) {
            if (legendText.toLowerCase().includes(legend.toLowerCase())) {
                return yamlKey;
            }
        }
        
        // Convert to lowercase and remove spaces as fallback
        return legendText.toLowerCase().replace(/\s+/g, '_');
    }

    getYamlKeyFromPath(fieldPath) {
        // Convert data-path to top-level YAML key
        // Examples: "resources.gpu" -> "resources", "commands.0" -> "commands", "name" -> "name"
        const parts = fieldPath.split('.');
        return parts[0];
    }

    highlightYAMLSection(yamlPath) {
        console.log('🎨 highlightYAMLSection called with path:', yamlPath);
        
        // Get CodeMirror instance from window.app.yamlEditor
        if (window.app && window.app.yamlEditor && window.app.yamlEditor.getDoc) {
            console.log('✅ CodeMirror instance found');
            const doc = window.app.yamlEditor.getDoc();
            const content = doc.getValue();
            
            console.log('📄 YAML content length:', content.length);
            console.log('🔍 Searching for YAML path:', yamlPath);
            
            // Find the full range of the YAML field
            const fieldRange = this.findYAMLFieldRange(content, yamlPath);
            
            console.log('📍 Field range result:', fieldRange);
            
            if (fieldRange) {
                console.log('✅ Calling showHighlightForRange');
                this.showHighlightForRange(fieldRange);
            } else {
                console.log('❌ No field range found for path:', yamlPath);
            }
        } else {
            console.log('⚠️ No CodeMirror instance, trying textarea fallback');
            // Fallback for plain textarea
            this.highlightInTextarea(yamlPath);
        }
    }

    findYAMLFieldRange(content, yamlPath) {
        console.log('🔍 findYAMLFieldRange searching for:', yamlPath);
        const lines = content.split('\n');
        let startLine = -1;
        let endLine = -1;
        let fieldIndentation = 0;
        
        console.log('📄 Total lines in YAML:', lines.length);
        
        // Find the start line of the field
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const regex = new RegExp(`^(\\s*)${yamlPath}\\s*:`);
            const match = regex.exec(line);
            
            if (match) {
                startLine = i;
                fieldIndentation = match[1].length; // Get the indentation level
                console.log(`✅ Found field "${yamlPath}" at line ${i}, indentation: ${fieldIndentation}`);
                console.log(`📝 Line content: "${line}"`);
                break;
            }
        }
        
        if (startLine === -1) {
            console.log(`❌ Field "${yamlPath}" not found in YAML content`);
            console.log('🔍 Available fields in YAML:');
            lines.forEach((line, i) => {
                if (line.includes(':') && !line.trim().startsWith('#')) {
                    console.log(`  Line ${i}: "${line.trim()}"`);
                }
            });
            return null;
        }
        
        // Find the end line by looking for the next field at the same or lower indentation level
        endLine = startLine;
        for (let i = startLine + 1; i < lines.length; i++) {
            const line = lines[i];
            
            // Skip empty lines and comments
            if (line.trim() === '' || line.trim().startsWith('#')) {
                continue;
            }
            
            // Calculate current line's indentation
            const currentIndentation = line.length - line.trimStart().length;
            
            // If we find a line with same or less indentation that contains a key, this is the end
            if (currentIndentation <= fieldIndentation && line.includes(':')) {
                endLine = i - 1;
                console.log(`📍 Field end determined by next field at line ${i}: "${line.trim()}"`);
                break;
            }
            
            // Update endLine to include this line in the field
            endLine = i;
        }
        
        // Include any trailing empty lines that belong to this field
        while (endLine < lines.length - 1 && lines[endLine + 1].trim() === '') {
            endLine++;
        }
        
        console.log(`📍 Field range: lines ${startLine} to ${endLine}`);
        
        return {
            startLine,
            endLine,
            startCol: 0,
            endCol: lines[endLine].length
        };
    }

    showHighlightForRange(fieldRange) {
        if (!window.app || !window.app.yamlEditor) {
            console.log('❌ No CodeMirror instance for highlighting');
            return;
        }
        
        const { startLine, endLine } = fieldRange;
        
        console.log(`🎨 showHighlightForRange called for lines ${startLine} to ${endLine}`);
        
        // Auto-scroll to the highlighted area
        this.scrollToHighlightedArea(startLine, endLine);
        
        // Get coordinates for the start and end of the field (using 'page' mode for absolute positioning)
        const startCoords = window.app.yamlEditor.charCoords({line: startLine, ch: 0}, 'page');
        const endCoords = window.app.yamlEditor.charCoords({line: endLine + 1, ch: 0}, 'page');
        
        // Get the editor container and scroll info
        const editorContainer = window.app.yamlEditor.getWrapperElement();
        const scrollerElement = window.app.yamlEditor.getScrollerElement();
        const scrollInfo = window.app.yamlEditor.getScrollInfo();
        
        // Get the container bounds to calculate relative positioning
        const containerRect = editorContainer.getBoundingClientRect();
        const scrollerRect = scrollerElement.getBoundingClientRect();
        
        console.log('📐 Coordinate calculation:', {
            startCoords,
            endCoords,
            scrollInfo,
            containerRect,
            scrollerRect
        });
        
        // Calculate position relative to the YAML editor container
        const relativeTop = startCoords.top - containerRect.top;
        const height = Math.max(20, endCoords.top - startCoords.top); // Minimum height of 20px
        
        // Position the overlay relative to the container
        this.overlay.style.top = relativeTop + 'px';
        this.overlay.style.left = '0px';
        this.overlay.style.width = scrollInfo.clientWidth + 'px';
        this.overlay.style.height = height + 'px';
        this.overlay.classList.add('active');
        
        console.log(`✅ Overlay positioned: top=${relativeTop}px (relative to container), height=${height}px, width=${scrollInfo.clientWidth}px`);
    }

    scrollToHighlightedArea(startLine, endLine) {
        if (!window.app || !window.app.yamlEditor) {
            console.log('❌ No CodeMirror instance for scrolling');
            return;
        }
        
        console.log(`📜 scrollToHighlightedArea called for lines ${startLine} to ${endLine}`);
        
        // Calculate the center line of the highlighted area
        const centerLine = Math.floor((startLine + endLine) / 2);
        
        // Get editor scroll info
        const scrollInfo = window.app.yamlEditor.getScrollInfo();
        const editorHeight = scrollInfo.clientHeight;
        
        // Get line height
        const lineHeight = window.app.yamlEditor.defaultTextHeight();
        
        // Calculate visible lines
        const visibleLines = Math.floor(editorHeight / lineHeight);
        
        // Check if the highlighted area is already visible
        const topVisibleLine = Math.floor(scrollInfo.top / lineHeight);
        const bottomVisibleLine = topVisibleLine + visibleLines;
        
        console.log('📐 Scroll calculation:', {
            centerLine,
            editorHeight,
            lineHeight,
            visibleLines,
            topVisibleLine,
            bottomVisibleLine,
            currentScrollTop: scrollInfo.top
        });
        
        // Only scroll if the highlighted area is not fully visible
        if (startLine < topVisibleLine || endLine > bottomVisibleLine) {
            // Calculate target scroll position to center the highlighted area
            const targetLine = Math.max(0, centerLine - Math.floor(visibleLines / 2));
            const targetScrollTop = targetLine * lineHeight;
            
            console.log(`🎯 Auto-scrolling needed: target line ${targetLine}, scroll top ${targetScrollTop}`);
            
            // Smooth scroll to the target position
            window.app.yamlEditor.scrollTo(null, targetScrollTop);
            
            console.log(`✅ Auto-scrolling YAML editor to line ${centerLine} (scroll top: ${targetScrollTop})`);
        } else {
            console.log('✅ Highlighted area already visible, no scrolling needed');
        }
    }

    showHighlightAtLine(lineNumber, column, yamlPath) {
        // Legacy method - keeping for fallback
        if (!window.app || !window.app.yamlEditor) return;
        
        // Auto-scroll to the highlighted line
        this.scrollToHighlightedArea(lineNumber, lineNumber);
        
        // Get line coordinates from CodeMirror
        const coords = window.app.yamlEditor.charCoords({line: lineNumber, ch: column}, 'local');
        const endCoords = window.app.yamlEditor.charCoords({line: lineNumber, ch: column + yamlPath.length + 1}, 'local');
        
        // Position the overlay
        this.overlay.style.top = coords.top + 'px';
        this.overlay.style.left = coords.left + 'px';
        this.overlay.style.width = (endCoords.right - coords.left) + 'px';
        this.overlay.style.height = (coords.bottom - coords.top) + 'px';
        this.overlay.classList.add('active');
    }

    highlightInTextarea(yamlPath) {
        // Fallback method for plain textarea
        const textarea = document.querySelector('#yaml-editor-container textarea');
        if (!textarea) return;
        
        const content = textarea.value;
        const regex = new RegExp(`^\\s*${yamlPath}\\s*:`, 'm');
        const match = regex.exec(content);
        
        if (match) {
            // Simple highlight - just add a class to indicate highlighting
            this.overlay.classList.add('active');
            // Position roughly where the match would be
            this.overlay.style.top = '20px';
            this.overlay.style.left = '10px';
            this.overlay.style.width = '200px';
            this.overlay.style.height = '20px';
        }
    }

    hideHighlight() {
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }
    }

    // Method to update field mappings dynamically
    updateFieldMapping(fieldName, yamlPath) {
        this.fieldMappings.set(fieldName, yamlPath);
    }

    // Method to add data-field attributes to form elements
    addFieldAttributes() {
        document.querySelectorAll('.field-container input, .field-container select, .field-container textarea').forEach(input => {
            if (input.name && !input.getAttribute('data-field')) {
                input.setAttribute('data-field', input.name);
            }
        });
    }
}

// Initialize when DOM is ready and app is loaded
function initYamlHighlighter() {
    console.log('🚀 Attempting to initialize YAML Highlighter...');
    console.log('🔍 Checking dependencies:', {
        windowApp: !!window.app,
        yamlEditor: !!(window.app && window.app.yamlEditor),
        yamlEditorType: window.app?.yamlEditor?.constructor?.name
    });
    
    if (window.app && window.app.yamlEditor) {
        window.yamlHighlighter = new YAMLHighlighter();
        console.log('✅ YAML Highlighter initialized successfully');
    } else {
        console.log('⏳ Dependencies not ready, retrying in 100ms...');
        // Retry after a short delay
        setTimeout(initYamlHighlighter, 100);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initYamlHighlighter();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = YAMLHighlighter;
}