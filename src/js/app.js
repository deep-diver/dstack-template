document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - App starting...');
    
    // --- DOM Element References ---
    const formContainer = document.getElementById('form-container');
    const yamlEditorContainer = document.getElementById('yaml-editor-container');
    
    console.log('Elements found:', {
        formContainer: !!formContainer,
        yamlEditorContainer: !!yamlEditorContainer
    });
    
    // --- Initialize CodeMirror ---
    const lineNumbersDiv = document.getElementById('line-numbers');
    const yamlEditor = CodeMirror(yamlEditorContainer, {
        mode: 'yaml',
        theme: 'material-darker',
        lineNumbers: true, // Enable built-in line numbers
        lineWrapping: true,
        indentUnit: 2,
        tabSize: 2,
        autoCloseBrackets: true,
        matchBrackets: true,
        showCursorWhenSelecting: true,
        styleActiveLine: true,
        readOnly: true, // Make editor read-only
        value: '',
        placeholder: '# dstack configuration\ntype: task\nname: my-awesome-task\npython: "3.11"\ncommands:\n  - pip install requirements.txt\n  - python main.py',
        extraKeys: {
            "Enter": function(cm) {
                // Check if current line has an arrow
                const cursor = cm.getCursor();
                const line = cm.getLine(cursor.line);
                
                if (line && (line.includes(' ▼') || line.includes(' ▶'))) {
                    // Toggle section instead of adding new line
                    const cleanLine = line.replace(/ [▼▶]/g, '').trim();
                    const sectionKey = cleanLine.replace(':', '');
                    
                    if (collapsedSections.has(sectionKey)) {
                        collapsedSections.delete(sectionKey);
                    } else {
                        collapsedSections.add(sectionKey);
                    }
                    
                    displayCollapsedYaml();
                    return false; // Prevent default behavior
                }
                
                return CodeMirror.Pass; // Allow normal Enter behavior
            }
        }
    });
    
    // Simple collapsing state
    let collapsedSections = new Set();
    let isUpdatingDisplay = false;
    let originalContent = '';
    let originalSections = [];
    
    // Initial State & Data
    let currentData = {}; // Holds the parsed YAML as a JS object
    let isUpdating = false; // Prevents infinite update loops

    // Function to initialize the application with default template
    const initializeApp = () => {
        console.log('Initializing application...');
        console.log('Available modules:', {
            dataSync: !!window.dataSync,
            yamlCollapse: !!window.yamlCollapse,
            formRenderer: !!window.formRenderer,
            eventHandlers: !!window.eventHandlers,
            presets: !!window.presets,
            utils: !!window.utils
        });
        
        // Load dstack Complete template as default
        const defaultTemplate = `type: task
name: my-dstack-task

python: "3.11"

# Enable NVIDIA CUDA Compiler (for GPU-accelerated code compilation)
nvcc: true

image: dstackai/base:py3.11-0.4.2

working_dir: /workspace

commands:
  - pip install -r requirements.txt
  - python train.py

env:
  - HF_TOKEN
  - WANDB_API_KEY
  - MODEL_NAME=meta-llama/Llama-3-8B

ports:
  - 8000

resources:
  gpu: 24GB
  memory: 16GB
  cpu: 4

volumes:
  - /data:/workspace/data:rw

backends:
  - aws
  - gcp

regions:
  - us-east-1
  - us-west-2

nodes: 1

replicas: 1

spot_policy: auto

retry_policy: on-failure

max_price: $2.50

max_duration: 6h

idle_duration: 10m`;

        // Mark dstack Complete template as selected
        window.app.selectedTemplate = 'dstack-complete';

        console.log('Setting YAML editor value...');
        yamlEditor.setValue(defaultTemplate);
        
        // Set the title section to show dstack Complete template info
        setTimeout(() => {
            if (window.configTitleEditor) {
                window.configTitleEditor.setConfigData({
                    title: 'dstack Complete',
                    description: 'Complete dstack configuration with all supported fields',
                    emoji: '⚡',
                    category: 'ml-training'
                });
                // Mark this as a template to prevent auto-generation
                window.configTitleEditor.isTemplate = true;
            }
        }, 200);
        
        // Dispatch YAML content change event
        setTimeout(() => {
            const event = new CustomEvent('yamlContentChanged', {
                detail: {
                    content: defaultTemplate,
                    timestamp: new Date().toISOString()
                }
            });
            document.dispatchEvent(event);
        }, 100);
        
        // Update form from YAML
        setTimeout(() => {
            console.log('Updating form from YAML...');
            if (window.dataSync && window.dataSync.updateFormFromYaml) {
                window.dataSync.updateFormFromYaml();
                console.log('Form updated successfully');
            } else {
                console.warn('dataSync module not available');
            }
            
            // Add arrows and auto-collapse after template is loaded
            setTimeout(() => {
                console.log('Template loaded, now adding arrows...');
                if (window.yamlCollapse && window.yamlCollapse.addArrowsToContent) {
                    window.yamlCollapse.addArrowsToContent();
                } else {
                    console.warn('yamlCollapse module not available');
                }
                
                setTimeout(() => {
                    console.log('Auto-collapsing all sections (disabled)...');
                    // if (window.yamlCollapse && window.yamlCollapse.autoCollapseAll) {
                    //     window.yamlCollapse.autoCollapseAll();
                    // }
                    
                    // Update template highlighting after everything is loaded
                    setTimeout(() => {
                        updateTemplateHighlight(window.app.selectedTemplate);
                        
                        // Update copy template button visibility
                        if (window.copyTemplateModule && window.copyTemplateModule.updateCopyTemplateButtonVisibility) {
                            window.copyTemplateModule.updateCopyTemplateButtonVisibility();
                        }
                        
                        // Update navigation template highlighting
                        setTimeout(() => {
                            if (window.navigationModule && window.navigationModule.updateNavTemplateHighlight) {
                                window.navigationModule.updateNavTemplateHighlight('dstack-complete');
                            }
                            
                            // Clear template deleter data for built-in template
                            if (window.templateDeleter) {
                                window.templateDeleter.clearTemplateData();
                            }
                            
                            // Clear community template tracking for likes
                            if (window.yamlLiker) {
                                window.yamlLiker.clearCommunityTemplateTracking();
                            }
                            
                            // Initialize top templates
                            if (window.navigationModule && window.navigationModule.initTopTemplates) {
                                window.navigationModule.initTopTemplates();
                            }
                            
                            // Dispatch app initialization complete event
                            setTimeout(() => {
                                const event = new CustomEvent('appInitialized', {
                                    detail: { timestamp: new Date().toISOString() }
                                });
                                document.dispatchEvent(event);
                                console.log('App initialization complete - event dispatched');
                            }, 50);
                        }, 50);
                    }, 50);
                }, 100);
            }, 100);
        }, 50);
    };

    // Initialize event handlers first
    setTimeout(async () => {
        if (window.eventHandlers && window.eventHandlers.initEventHandlers) {
            window.eventHandlers.initEventHandlers();
        }
        
        // Then initialize the app with default content
        initializeApp();
        
        // Initialize navigation with server data
        if (window.navigationLoader) {
            await window.navigationLoader.init();
        }
    }, 100);

    // Function to update template highlighting (now only navigation)
    const updateTemplateHighlight = (selectedTemplate) => {
        // Update navigation highlighting only (no main preset buttons anymore)
        if (window.navigationModule && window.navigationModule.updateNavTemplateHighlight) {
            window.navigationModule.updateNavTemplateHighlight(selectedTemplate);
        }
        
        // Update copy template button visibility
        if (window.copyTemplateModule && window.copyTemplateModule.updateCopyTemplateButtonVisibility) {
            window.copyTemplateModule.updateCopyTemplateButtonVisibility();
        }
    };

    // Export for use in other modules
    window.app = {
        yamlEditor,
        formContainer,
        currentData,
        isUpdating,
        collapsedSections,
        isUpdatingDisplay,
        originalContent,
        originalSections,
        initializeApp,
        selectedTemplate: null,
        updateTemplateHighlight
    };
});