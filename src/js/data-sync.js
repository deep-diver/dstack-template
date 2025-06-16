// Data Synchronization Module

// Helper function to dispatch YAML content change event
const dispatchYamlContentChanged = () => {
    const event = new CustomEvent('yamlContentChanged', {
        detail: {
            content: window.app?.yamlEditor?.getValue() || '',
            timestamp: new Date().toISOString()
        }
    });
    document.dispatchEvent(event);
};

// Smart YAML update that preserves comments and structure
const updateYamlEditorSmart = (changedPath, newValue) => {
    const { yamlEditor, originalContent } = window.app || {};
    if (!yamlEditor) return;
    
    // If we have original content with comments, try to preserve it
    if (originalContent && changedPath) {
        try {
            const updatedYaml = updateYamlValuePreservingComments(originalContent, changedPath, newValue);
            if (updatedYaml) {
                yamlEditor.setValue(updatedYaml);
                dispatchYamlContentChanged();
                // Re-add arrows after updating content
                setTimeout(() => {
                    if (window.yamlCollapse && window.yamlCollapse.addArrowsToContent) {
                        window.yamlCollapse.addArrowsToContent();
                    }
                }, 50);
                return;
            }
        } catch (e) {
            console.warn('Failed to preserve comments, falling back to full regeneration:', e);
        }
    }
    
    // Fallback to full YAML regeneration
    updateYamlEditorFull();
};

// Function to update a specific value while preserving comments
const updateYamlValuePreservingComments = (yamlContent, path, newValue) => {
    const pathParts = path.split('.');
    const lines = yamlContent.replace(/ [▼▶]/g, '').split('\n'); // Remove arrows first
    
    // For simple top-level string values, try direct replacement
    if (pathParts.length === 1) {
        const key = pathParts[0];
        const pattern = new RegExp(`^(\\s*${key}\\s*:\\s*)(.*)$`, 'm');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = line.match(pattern);
            if (match && !line.trim().startsWith('#')) {
                // Preserve the indentation and key, update only the value
                const formattedValue = typeof newValue === 'string' && newValue.includes(' ') ? `"${newValue}"` : newValue;
                lines[i] = match[1] + formattedValue;
                return lines.join('\n') + '\n';
            }
        }
    }
    
    return null; // Couldn't preserve, fall back to full regeneration
};

// Full YAML regeneration (fallback)
const updateYamlEditorFull = () => {
    const { isUpdating, currentData, yamlEditor } = window.app || {};
    if (!yamlEditor || isUpdating) return;
    
    window.app.isUpdating = true;
    try {
        const yamlString = jsyaml.dump(currentData, { 
            indent: 2,
            lineWidth: -1,  // Disable line wrapping
            noRefs: true    // Disable anchors and aliases
        });
        
        // Add proper spacing between top-level sections
        const lines = yamlString.split('\n');
        normalizeBlankLines(lines); // Use the same normalization function
        
        // Ensure file ends with newline
        const formattedYaml = lines.join('\n') + '\n';
        yamlEditor.setValue(formattedYaml);
        dispatchYamlContentChanged();
        
        // Re-add arrows and update line numbers after updating content
        setTimeout(() => {
            if (window.yamlCollapse && window.yamlCollapse.addArrowsToContent) {
                window.yamlCollapse.addArrowsToContent();
            }
            // Ensure line numbers are updated
            if (window.yamlCollapse && window.yamlCollapse.updateLineNumbers) {
                window.yamlCollapse.updateLineNumbers();
            }
        }, 50);
        
        // Status indicator removed
        document.getElementById('yaml-editor-container').classList.remove('border-red-500');
    } catch (e) {
        console.error("Error dumping YAML:", e);
    }
    setTimeout(() => { window.app.isUpdating = false; }, 50);
};

// Keep original function name for backward compatibility
const updateYamlEditor = updateYamlEditorFull;

const updateFormFromYaml = () => {
    const { isUpdating, yamlEditor } = window.app || {};
    if (!yamlEditor || isUpdating) return;
    
    window.app.isUpdating = true;
    try {
        const newData = jsyaml.load(yamlEditor.getValue());
        if (JSON.stringify(newData) !== JSON.stringify(window.app.currentData)) {
           window.app.currentData = newData || {};
           const formContainer = document.getElementById('form-container');
           if (formContainer) {
               formContainer.innerHTML = ''; // Clear previous form
           }
           
           // Hide/show empty state based on content
           const emptyState = document.getElementById('empty-state');
           if (Object.keys(window.app.currentData).length === 0 || yamlEditor.getValue().trim() === '') {
               if (emptyState) emptyState.style.display = 'flex';
               if (formContainer) formContainer.style.display = 'none';
           } else {
               if (emptyState) emptyState.style.display = 'none';
               if (formContainer) formContainer.style.display = 'block';
               if (window.formRenderer && window.formRenderer.renderForm && formContainer) {
                   window.formRenderer.renderForm(window.app.currentData, formContainer);
               }
               
               // Update quick add buttons
               if (window.quickAdd && window.quickAdd.updateQuickAddButtons) {
                   window.quickAdd.updateQuickAddButtons();
               }
           }
        }
        // Status indicator removed
        const yamlContainer = document.getElementById('yaml-editor-container');
        if (yamlContainer) {
            yamlContainer.classList.remove('border-red-500');
        }
    } catch (e) {
        // Status indicator removed
        const yamlContainer = document.getElementById('yaml-editor-container');
        if (yamlContainer) {
            yamlContainer.classList.add('border-red-500');
        }
        console.warn("Invalid YAML:", e.message);
    }
    setTimeout(() => { 
        if (window.app) {
            window.app.isUpdating = false; 
        }
    }, 50);
};

const updateDataFromForm = (path, value) => {
    if (window.utils && window.utils.setNestedValue) {
        window.utils.setNestedValue(window.app.currentData, path, value);
        // Use smart update to preserve comments when possible
        updateYamlEditorSmart(path, value);
        
        // Clear template selection when manually editing
        if (window.app.selectedTemplate) {
            window.app.selectedTemplate = null;
            if (window.app.updateTemplateHighlight) {
                window.app.updateTemplateHighlight(null);
            }
        }
    }
};

// Smart function to add a field while preserving original YAML formatting
const addFieldToYaml = (fieldName, defaultValue) => {
    const { yamlEditor, originalContent } = window.app || {};
    if (!yamlEditor) return;
    
    // Get current YAML content (with arrows removed)
    const currentContent = yamlEditor.getValue().replace(/ [▼▶]/g, '');
    const lines = currentContent.split('\n');
    
    // Find the best position to insert the new field based on FIELD_ORDER
    const fieldOrder = window.quickAdd?.FIELD_ORDER || [];
    const fieldIndex = fieldOrder.indexOf(fieldName);
    
    if (fieldIndex === -1) {
        // If field not in order, append at the end
        appendFieldToEnd(lines, fieldName, defaultValue);
    } else {
        // Find the right position based on field order
        insertFieldInOrder(lines, fieldName, defaultValue, fieldIndex, fieldOrder);
    }
    
    // Update the YAML editor with the modified content
    const newContent = lines.join('\n');
    yamlEditor.setValue(newContent);
    dispatchYamlContentChanged();
    
    // Re-add arrows after updating content
    setTimeout(() => {
        if (window.yamlCollapse && window.yamlCollapse.addArrowsToContent) {
            window.yamlCollapse.addArrowsToContent();
        }
    }, 50);
    
    console.log(`Added ${fieldName} to YAML while preserving formatting`);
};

// Helper function to append field at the end
const appendFieldToEnd = (lines, fieldName, defaultValue) => {
    // Ensure there's a blank line before the new field if content exists
    if (lines.length > 0 && lines[lines.length - 1].trim() !== '') {
        lines.push('');
    }
    
    // Add the new field
    const yamlField = formatFieldAsYaml(fieldName, defaultValue);
    yamlField.split('\n').forEach(line => lines.push(line));
    
    // Add a blank line after the new field
    lines.push('');
};

// Helper function to insert field in the correct order
const insertFieldInOrder = (lines, fieldName, defaultValue, fieldIndex, fieldOrder) => {
    let insertIndex = 0;
    
    // Find where to insert based on existing fields
    for (let i = 0; i < fieldIndex; i++) {
        const precedingField = fieldOrder[i];
        const fieldLineIndex = lines.findIndex(line => 
            line.trim().startsWith(precedingField + ':') && !line.trim().startsWith('#')
        );
        
        if (fieldLineIndex !== -1) {
            // Find the end of this field (next top-level field or end of file)
            insertIndex = findEndOfField(lines, fieldLineIndex);
        }
    }
    
    // Ensure proper spacing
    if (insertIndex > 0 && lines[insertIndex - 1].trim() !== '') {
        lines.splice(insertIndex, 0, '');
        insertIndex++;
    }
    
    // Insert the new field
    const yamlField = formatFieldAsYaml(fieldName, defaultValue);
    const fieldLines = yamlField.split('\n');
    
    fieldLines.forEach((line, index) => {
        lines.splice(insertIndex + index, 0, line);
    });
    
    // Add a blank line after the new field
    lines.splice(insertIndex + fieldLines.length, 0, '');
};

// Helper function to find the end of a field
const findEndOfField = (lines, startIndex) => {
    for (let i = startIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        // If we hit another top-level field (no indentation and has colon)
        if (line.trim() && !line.startsWith(' ') && !line.startsWith('#') && line.includes(':')) {
            return i;
        }
    }
    return lines.length; // End of file
};

// Helper function to format a field as YAML
const formatFieldAsYaml = (fieldName, defaultValue) => {
    if (Array.isArray(defaultValue)) {
        const items = defaultValue.map(item => `  - ${item}`).join('\n');
        return `${fieldName}:\n${items}`;
    } else if (typeof defaultValue === 'object' && defaultValue !== null) {
        const items = Object.entries(defaultValue)
            .map(([key, value]) => `  ${key}: ${value}`)
            .join('\n');
        return `${fieldName}:\n${items}`;
    } else {
        // Handle string values that might need quotes
        const formattedValue = typeof defaultValue === 'string' && 
            (defaultValue.includes(' ') || defaultValue.includes(':')) 
            ? `"${defaultValue}"` 
            : defaultValue;
        return `${fieldName}: ${formattedValue}`;
    }
};

// Smart function to remove a field while preserving original YAML formatting
const removeFieldFromYaml = (fieldName) => {
    const { yamlEditor } = window.app || {};
    if (!yamlEditor) return;
    
    // Get current YAML content (with arrows removed)
    const currentContent = yamlEditor.getValue().replace(/ [▼▶]/g, '');
    const lines = currentContent.split('\n');
    
    console.log('Before removal:', lines.map((line, i) => `${i}: "${line}"`));
    
    // Find the field to remove
    const fieldLineIndex = lines.findIndex(line => 
        line.trim().startsWith(fieldName + ':') && !line.trim().startsWith('#')
    );
    
    if (fieldLineIndex === -1) {
        console.warn(`Field ${fieldName} not found in YAML`);
        return;
    }
    
    console.log(`Found ${fieldName} at line ${fieldLineIndex}: "${lines[fieldLineIndex]}"`);
    
    // Find all lines that belong to this field (field line + indented content)
    let endIndex = fieldLineIndex;
    
    // Find all indented lines that belong to this field
    for (let i = fieldLineIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith(' ')) {
            // This line is indented, belongs to the field
            endIndex = i;
        } else {
            // Hit a non-indented line, stop here
            break;
        }
    }
    
    console.log(`Removing lines ${fieldLineIndex} to ${endIndex}`);
    
    // Remove the field and its indented content
    lines.splice(fieldLineIndex, endIndex - fieldLineIndex + 1);
    
    console.log('After field removal, before normalization:', lines.map((line, i) => `${i}: "${line}"`));
    
    // Normalize spacing to ensure exactly one blank line between top-level fields
    normalizeBlankLines(lines);
    
    console.log('After normalization:', lines.map((line, i) => `${i}: "${line}"`));
    
    // Update the YAML editor with the modified content
    const newContent = lines.join('\n');
    yamlEditor.setValue(newContent);
    dispatchYamlContentChanged();
    
    // Re-add arrows after updating content
    setTimeout(() => {
        if (window.yamlCollapse && window.yamlCollapse.addArrowsToContent) {
            window.yamlCollapse.addArrowsToContent();
        }
    }, 50);
    
    console.log(`Removed ${fieldName} from YAML while preserving formatting`);
};

// Helper function to find the complete range of a field (including all sub-content)
const findFieldRange = (lines, fieldLineIndex, fieldName) => {
    let startIndex = fieldLineIndex;
    let endIndex = fieldLineIndex;
    
    // Never include preceding blank lines - they serve as separators for the previous field
    // The field range starts exactly at the field declaration line
    
    // Find all lines that belong to this field (only indented content)
    for (let i = fieldLineIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        
        // If we hit another top-level field, stop completely
        if (line.trim() && !line.startsWith(' ') && !line.startsWith('#') && line.includes(':')) {
            break;
        }
        
        // If the line is indented, it definitely belongs to this field
        if (line.startsWith(' ')) {
            endIndex = i;
        } 
        // If it's a blank line, we need to be very careful
        else if (line.trim() === '') {
            // Look ahead to see what comes next
            let nextNonEmptyIndex = -1;
            for (let j = i + 1; j < lines.length; j++) {
                if (lines[j].trim() !== '') {
                    nextNonEmptyIndex = j;
                    break;
                }
            }
            
            if (nextNonEmptyIndex === -1) {
                // No more content after this blank line, it belongs to this field
                endIndex = i;
            } else {
                const nextNonEmptyLine = lines[nextNonEmptyIndex];
                if (nextNonEmptyLine.startsWith(' ')) {
                    // Next non-empty line is indented, so this blank line belongs to current field
                    endIndex = i;
                } else if (nextNonEmptyLine.includes(':')) {
                    // Next non-empty line is a field, so this blank line is a separator - don't include it
                    break;
                } else {
                    // Next non-empty line is something else, include this blank line
                    endIndex = i;
                }
            }
        } 
        // Non-indented, non-empty line that's not a field - stop here
        else if (line.trim() !== '') {
            break;
        }
    }
    
    return { startIndex, endIndex };
};

// Helper function to normalize blank lines throughout the document
const normalizeBlankLines = (lines) => {
    console.log('Normalizing blank lines. Input:', lines.map((line, i) => `${i}: "${line}"`));
    
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isBlankLine = line.trim() === '';
        const isTopLevelField = !isBlankLine && !line.startsWith(' ') && !line.startsWith('#') && line.includes(':');
        
        if (isBlankLine) {
            // Skip blank lines - we'll add them back strategically
            continue;
        }
        
        // Add the line
        result.push(line);
        
        // If this is a top-level field, check if we need a blank line after its content
        if (isTopLevelField) {
            // Find the end of this field's content
            let endOfField = i;
            for (let j = i + 1; j < lines.length; j++) {
                if (lines[j].trim() === '') {
                    continue; // Skip blank lines when finding end
                }
                if (lines[j].startsWith(' ')) {
                    // This is indented content belonging to the field
                    endOfField = j;
                } else {
                    // Hit another top-level field
                    break;
                }
            }
            
            // Add all indented content
            for (let j = i + 1; j <= endOfField; j++) {
                if (lines[j].trim() !== '' && lines[j].startsWith(' ')) {
                    result.push(lines[j]);
                }
            }
            
            // Look ahead to see if there's another top-level field coming
            let hasNextField = false;
            for (let j = endOfField + 1; j < lines.length; j++) {
                if (lines[j].trim() === '') continue;
                if (!lines[j].startsWith(' ') && !lines[j].startsWith('#') && lines[j].includes(':')) {
                    hasNextField = true;
                    break;
                }
            }
            
            // Add exactly one blank line if there's another field coming
            if (hasNextField) {
                result.push('');
            }
            
            // Skip ahead past the content we just processed
            i = endOfField;
        }
    }
    
    console.log('Normalization result:', result.map((line, i) => `${i}: "${line}"`));
    
    // Replace original lines array with normalized version
    lines.length = 0;
    lines.push(...result);
};

// Export functions
window.dataSync = {
    updateYamlEditor,
    updateYamlEditorSmart,
    updateYamlEditorFull,
    updateFormFromYaml,
    updateDataFromForm,
    addFieldToYaml,
    removeFieldFromYaml
};