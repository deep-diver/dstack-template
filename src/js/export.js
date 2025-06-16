// Export functionality module

const exportYamlFile = () => {
    const { yamlEditor } = window.app || {};
    if (!yamlEditor) {
        console.warn('YAML editor not available');
        return;
    }

    try {
        // Get the current YAML content
        const yamlContent = yamlEditor.getValue();
        
        if (!yamlContent.trim()) {
            alert('No configuration to export. Please create a configuration first.');
            return;
        }

        // Generate filename based on configuration name or use default
        let filename = 'dstack.yml';
        try {
            const data = jsyaml.load(yamlContent);
            if (data && data.name) {
                filename = `${data.name}.yml`;
            }
        } catch (e) {
            console.warn('Could not parse YAML for filename, using default');
        }

        // Create blob and download
        const blob = new Blob([yamlContent], { type: 'application/x-yaml' });
        const url = URL.createObjectURL(blob);
        
        // Create temporary download link
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = filename;
        downloadLink.style.display = 'none';
        
        // Trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up object URL
        URL.revokeObjectURL(url);
        
        console.log(`YAML configuration exported as ${filename}`);
        
        // Show success feedback
        showExportFeedback('success', `Exported as ${filename}`);
        
    } catch (error) {
        console.error('Export failed:', error);
        showExportFeedback('error', 'Export failed');
    }
};

const showExportFeedback = (type, message) => {
    const exportBtn = document.getElementById('export-yaml-btn');
    if (!exportBtn) return;
    
    const originalContent = exportBtn.innerHTML;
    const originalClasses = exportBtn.className;
    
    if (type === 'success') {
        exportBtn.innerHTML = `
            <div class="flex items-center space-x-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Exported!</span>
            </div>`;
        exportBtn.className = exportBtn.className.replace('from-blue-500 to-indigo-500', 'from-green-500 to-emerald-500');
    } else {
        exportBtn.innerHTML = `
            <div class="flex items-center space-x-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <span>Failed</span>
            </div>`;
        exportBtn.className = exportBtn.className.replace('from-blue-500 to-indigo-500', 'from-red-500 to-pink-500');
    }
    
    // Reset after 2 seconds
    setTimeout(() => {
        exportBtn.innerHTML = originalContent;
        exportBtn.className = originalClasses;
    }, 2000);
};

// Initialize export functionality
const initExport = () => {
    const exportBtn = document.getElementById('export-yaml-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportYamlFile);
        console.log('Export functionality initialized');
    }
    
    // Add keyboard shortcut (Ctrl+S / Cmd+S)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault(); // Prevent browser save dialog
            exportYamlFile();
        }
    });
    
    console.log('Export keyboard shortcut (Ctrl+S / Cmd+S) initialized');
};

// Export functions
window.exportModule = {
    exportYamlFile,
    initExport
};