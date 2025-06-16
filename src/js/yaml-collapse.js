// YAML Collapsible Sections Module

// Get collapsible YAML sections
const getCollapsibleSections = () => {
    const { yamlEditor } = window.app || {};
    if (!yamlEditor) return [];
    
    const content = yamlEditor.getValue();
    const lines = content.split('\n');
    const sections = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // Check if this is a YAML key that can be collapsed
        if (trimmed.endsWith(':') && !trimmed.startsWith('-') && !trimmed.startsWith('#')) {
            const currentIndent = line.length - line.trimStart().length;
            const childLines = [];
            
            // Find child lines
            for (let j = i + 1; j < lines.length; j++) {
                const nextLine = lines[j];
                if (!nextLine || nextLine.trim() === '') continue;
                
                const nextIndent = nextLine.length - nextLine.trimStart().length;
                if (nextIndent > currentIndent) {
                    childLines.push(j);
                } else {
                    break;
                }
            }
            
            if (childLines.length > 0) {
                sections.push({
                    headerLine: i,
                    childLines: childLines,
                    key: trimmed.replace(':', '')
                });
            }
        }
    }
    return sections;
};

// Add arrows to YAML content without modifying the original
const addArrowsToContent = () => {
    const { yamlEditor, isUpdatingDisplay, collapsedSections } = window.app || {};
    if (!yamlEditor || isUpdatingDisplay) return;
    
    window.app.isUpdatingDisplay = true;
    
    const content = yamlEditor.getValue();
    console.log('Current content:', content);
    
    if (content.includes(' ▼') || content.includes(' ▶')) {
        console.log('Already has arrows, skipping');
        window.app.isUpdatingDisplay = false;
        return; // Already has arrows
    }
    
    // Store original content and sections for later use
    window.app.originalContent = content;
    window.app.originalSections = getCollapsibleSections();
    console.log('Stored original content and sections:', window.app.originalSections.length);
    
    const lines = content.split('\n');
    const sections = window.app.originalSections;
    
    console.log('Found sections:', sections);
    
    sections.forEach(section => {
        const isCollapsed = collapsedSections.has(section.key);
        const arrow = isCollapsed ? ' ▶' : ' ▼';
        console.log(`Adding ${arrow} to line ${section.headerLine}: "${lines[section.headerLine]}"`);
        lines[section.headerLine] += arrow;
    });
    
    const newContent = lines.join('\n');
    console.log('New content with arrows:', newContent);
    
    if (newContent !== content) {
        // Temporarily disable change events
        yamlEditor.off('change');
        yamlEditor.setValue(newContent);
        
        // Note: YAML editor is read-only, no change events needed
        setTimeout(() => {
            window.app.isUpdatingDisplay = false;
        }, 50);
    } else {
        window.app.isUpdatingDisplay = false;
    }
    
    // Line numbers are now handled by CodeMirror's built-in line numbers
    console.log(`Content updated with ${yamlEditor.lineCount()} lines`);
};

// Toggle collapse and update arrows
const toggleSection = (sectionKey) => {
    console.log('Toggling section:', sectionKey);
    const { collapsedSections } = window.app || {};
    
    if (collapsedSections.has(sectionKey)) {
        collapsedSections.delete(sectionKey);
    } else {
        collapsedSections.add(sectionKey);
    }
    
    // Update the display with collapsed content
    updateCollapsedDisplay();
};

// Update display with collapsed content
const updateCollapsedDisplay = () => {
    const { yamlEditor, isUpdatingDisplay, collapsedSections, originalContent, originalSections } = window.app || {};
    if (!yamlEditor || isUpdatingDisplay) return;
    
    window.app.isUpdatingDisplay = true;
    
    console.log('=== UPDATE COLLAPSED DISPLAY ===');
    // Use original content for expansion, current content for initial parsing
    const content = originalContent || yamlEditor.getValue();
    const lines = content.split('\n');
    const sections = originalSections.length > 0 ? originalSections : getCollapsibleSections();
    const displayLines = [];
    
    console.log('Current collapsed sections:', Array.from(collapsedSections));
    console.log('Available sections:', sections.map(s => s.key));
    console.log('Using original content:', !!originalContent);
    
    for (let i = 0; i < lines.length; i++) {
        const section = sections.find(s => s.headerLine === i);
        
        if (section) {
            // This is a collapsible section header
            const isCollapsed = collapsedSections.has(section.key);
            const arrow = isCollapsed ? ' ▶' : ' ▼';
            
            console.log(`Section ${section.key} at line ${i}: isCollapsed=${isCollapsed}, childLines=${JSON.stringify(section.childLines)}`);
            
            // Always show the header with appropriate arrow
            const cleanLine = lines[i].replace(/ [▼▶]/g, '');
            displayLines.push(cleanLine + arrow);
            
            // Add child lines only if not collapsed
            if (!isCollapsed) {
                console.log(`Adding child lines for ${section.key}:`, section.childLines);
                section.childLines.forEach(childLineIndex => {
                    if (lines[childLineIndex]) {
                        console.log(`  Adding child line ${childLineIndex}: ${lines[childLineIndex]}`);
                        displayLines.push(lines[childLineIndex]);
                    }
                });
            } else {
                console.log(`Skipping child lines for collapsed section ${section.key}`);
            }
            
            // Skip the child lines in the main loop
            i = section.childLines.length > 0 ? Math.max(...section.childLines) : i;
        } else {
            // Regular line - check if it's a child of a collapsed section
            const parentSection = sections.find(s => s.childLines.includes(i));
            if (!parentSection || !collapsedSections.has(parentSection.key)) {
                displayLines.push(lines[i]);
            }
        }
    }
    
    const newContent = displayLines.join('\n');
    const cursor = yamlEditor.getCursor();
    
    console.log('Final display lines:', displayLines);
    console.log('New content length:', newContent.length);
    
    // Prevent triggering change events during update
    yamlEditor.off('change');
    yamlEditor.setValue(newContent);
    yamlEditor.setCursor(Math.min(cursor.line, displayLines.length - 1), cursor.ch);
    
    // Note: YAML editor is read-only, no change events needed
    setTimeout(() => {
        window.app.isUpdatingDisplay = false;
    }, 50);
    
    // Line numbers are now handled by CodeMirror's built-in line numbers
    console.log(`Collapsed view updated with ${displayLines.length} lines`);
};

// Auto-collapse all sections by default
const autoCollapseAll = () => {
    const sections = getCollapsibleSections();
    const { collapsedSections } = window.app || {};
    sections.forEach(section => {
        collapsedSections.add(section.key);
    });
    updateCollapsedDisplay();
};

// Function to refresh CodeMirror (line numbers are built-in now)
const updateLineNumbers = () => {
    const { yamlEditor } = window.app || {};
    if (!yamlEditor) {
        console.warn('YAML editor not available for refresh');
        return;
    }
    
    // Refresh CodeMirror to ensure line numbers are properly displayed
    setTimeout(() => {
        yamlEditor.refresh();
        console.log(`CodeMirror refreshed with ${yamlEditor.lineCount()} lines`);
    }, 10);
};

// Export functions
window.yamlCollapse = {
    getCollapsibleSections,
    addArrowsToContent,
    updateCollapsedDisplay,
    toggleSection,
    autoCollapseAll,
    updateLineNumbers
};