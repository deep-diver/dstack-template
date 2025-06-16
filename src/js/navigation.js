// Left Navigation Module

let isNavExpanded = false; // Start with navigation collapsed by default

const toggleNavigation = () => {
    console.log('🔍 [DEBUG] toggleNavigation called');
    const leftNav = document.getElementById('left-nav');
    const toggleBtn = document.getElementById('nav-toggle');
    const toggleIcon = document.getElementById('nav-toggle-icon');
    const body = document.body;
    
    console.log('🔍 [DEBUG] Navigation elements:', {
        leftNav: !!leftNav,
        toggleBtn: !!toggleBtn,
        toggleIcon: !!toggleIcon,
        leftNavPointerEvents: leftNav ? getComputedStyle(leftNav).pointerEvents : 'N/A',
        toggleBtnPointerEvents: toggleBtn ? getComputedStyle(toggleBtn).pointerEvents : 'N/A'
    });
    
    if (!leftNav || !toggleBtn || !toggleIcon) {
        console.warn('Navigation elements not found');
        return;
    }
    
    isNavExpanded = !isNavExpanded;
    
    if (isNavExpanded) {
        // Show navigation
        leftNav.classList.remove('collapsed');
        toggleIcon.classList.add('rotated');
        body.classList.remove('nav-collapsed');
        body.classList.add('nav-expanded');
        
        // Update toggle button position
        setTimeout(() => {
            toggleBtn.style.left = 'calc(280px + 1rem)';
        }, 150);
        
        console.log('Navigation expanded');
    } else {
        // Hide navigation
        leftNav.classList.add('collapsed');
        toggleIcon.classList.remove('rotated');
        body.classList.remove('nav-expanded');
        body.classList.add('nav-collapsed');
        
        // Update toggle button position
        toggleBtn.style.left = '1rem';
        
        console.log('Navigation collapsed');
    }
    
    // Store state in localStorage
    localStorage.setItem('navExpanded', isNavExpanded.toString());
};

const initNavigation = () => {
    console.log('🔍 [DEBUG] initNavigation called');
    const toggleBtn = document.getElementById('nav-toggle');
    const leftNav = document.getElementById('left-nav');
    
    console.log('🔍 [DEBUG] Navigation init elements:', {
        toggleBtn: !!toggleBtn,
        leftNav: !!leftNav,
        toggleBtnPointerEvents: toggleBtn ? getComputedStyle(toggleBtn).pointerEvents : 'N/A',
        leftNavPointerEvents: leftNav ? getComputedStyle(leftNav).pointerEvents : 'N/A'
    });
    
    if (!toggleBtn || !leftNav) {
        console.warn('Navigation elements not found during initialization');
        return;
    }
    
    // Set initial state (collapsed by default)
    leftNav.classList.add('collapsed');
    document.body.classList.add('nav-collapsed');
    
    // Restore saved state from localStorage
    const savedState = localStorage.getItem('navExpanded');
    if (savedState === 'true') {
        // If previously expanded, expand it
        setTimeout(() => {
            toggleNavigation();
        }, 100);
    }
    
    // Add click event listener with debug
    toggleBtn.addEventListener('click', (e) => {
        console.log('🔍 [DEBUG] Toggle button clicked!', {
            event: e,
            currentPointerEvents: getComputedStyle(toggleBtn).pointerEvents,
            target: e.target
        });
        toggleNavigation();
    });
    
    // Add keyboard shortcut (Ctrl+B / Cmd+B)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            console.log('🔍 [DEBUG] Keyboard shortcut triggered (Ctrl+B / Cmd+B)');
            toggleNavigation();
        }
    });
    
    console.log('🔍 [DEBUG] Navigation initialized with keyboard shortcut (Ctrl+B / Cmd+B)');
};

// Handle window resize for responsive behavior
const handleResize = () => {
    const isMobile = window.innerWidth <= 768;
    const leftNav = document.getElementById('left-nav');
    const toggleBtn = document.getElementById('nav-toggle');
    
    if (isMobile && leftNav && toggleBtn) {
        // On mobile, always reset toggle button position
        toggleBtn.style.left = '1rem';
    } else if (!isMobile && isNavExpanded && toggleBtn) {
        // On desktop, maintain proper positioning
        toggleBtn.style.left = 'calc(280px + 1rem)';
    }
};

// Initialize resize handler
window.addEventListener('resize', handleResize);

// Update navigation template highlighting
const updateNavTemplateHighlight = (selectedTemplate) => {
    // Remove selected class from all nav template items
    document.querySelectorAll('.nav-template-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Add selected class to the current template
    if (selectedTemplate) {
        const navItem = document.getElementById(`nav-template-${selectedTemplate}`);
        if (navItem) {
            navItem.classList.add('selected');
        }
    }
};

// Initialize navigation template functionality
const initNavTemplates = () => {
    // Add click handler for Open-R1 template in navigation
    const navOpenR1 = document.getElementById('nav-template-open-r1');
    if (navOpenR1) {
        navOpenR1.addEventListener('click', async () => {
            try {
                console.log('Open-R1 template selected from navigation');
                
                // Use static template data instead of API
                const template = {
                    name: 'Open-R1 Fine-tuning',
                    yaml_content: `type: task
name: open-r1-finetune

python: "3.11"

image: dstackai/base:py3.11-0.4.2

commands:
  - pip install transformers accelerate datasets
  - python finetune_open_r1.py

env:
  - HF_TOKEN
  - WANDB_API_KEY
  - TARGET_BASE_MODEL=microsoft/Phi-3-mini-4k-instruct
  - TARGET_YAML=open_r1_config.yaml

resources:
  gpu: 80GB
  memory: 32GB
  cpu: 8

replicas: 1

spot_policy: auto`
                };
                
                if (template && window.app && window.app.yamlEditor) {
                    // Update filename editor for template
                    if (window.filenameEditor) {
                        window.filenameEditor.updateCurrentConfig(null, template.name, true);
                    }
                    
                    // Set template content
                    window.app.yamlEditor.setValue(template.yaml_content);
                    
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
                                
                                // Update highlighting and copy button
                                setTimeout(() => {
                                    updateNavTemplateHighlight('open-r1');
                                    
                                    // Update app's selected template reference
                                    if (window.app) {
                                        window.app.selectedTemplate = 'open-r1';
                                    }
                                    
                                    // Clear template deleter data for built-in templates
                                    if (window.templateDeleter) {
                                        window.templateDeleter.clearTemplateData();
                                    }
                                    
                                    // Clear community template tracking for likes
                                    if (window.yamlLiker) {
                                        window.yamlLiker.clearCommunityTemplateTracking();
                                    }
                                    
                                    // Update copy template button visibility
                                    if (window.copyTemplateModule && window.copyTemplateModule.updateCopyTemplateButtonVisibility) {
                                        window.copyTemplateModule.updateCopyTemplateButtonVisibility();
                                    }
                                    
                                    // Update quick add buttons visibility (hide for templates)
                                    if (window.quickAdd && window.quickAdd.updateQuickAddButtons) {
                                        window.quickAdd.updateQuickAddButtons();
                                    }
                                }, 50);
                            }, 100);
                        }, 100);
                    }, 50);
                }
            } catch (error) {
                console.error('Error loading Open-R1 template:', error);
            }
        });
    }
    
    // Add click handler for dstack.ai Complete template in navigation
    const navDstackComplete = document.getElementById('nav-template-dstack-complete');
    if (navDstackComplete) {
        navDstackComplete.addEventListener('click', async () => {
            try {
                console.log('dstack.ai Complete template selected from navigation');
                
                // Use static template data instead of API
                const template = {
                    name: 'dstack Complete',
                    yaml_content: `type: task
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

idle_duration: 10m`
                };
                
                if (template && window.app && window.app.yamlEditor) {
                    // Update filename editor for template
                    if (window.filenameEditor) {
                        window.filenameEditor.updateCurrentConfig(null, template.name, true);
                    }
                    
                    // Set template content
                    window.app.yamlEditor.setValue(template.yaml_content);
                    
                    // Set the title section to show template name instead of auto-generated title
                    if (window.configTitleEditor) {
                        window.configTitleEditor.setConfigData({
                            title: template.name,
                            description: 'Complete dstack configuration with all supported fields',
                            emoji: '⚡',
                            category: 'ml-training'
                        });
                    }
                    
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
                                
                                // Update highlighting and copy button
                                setTimeout(() => {
                                    updateNavTemplateHighlight('dstack-complete');
                                    
                                    // Update app's selected template reference
                                    if (window.app) {
                                        window.app.selectedTemplate = 'dstack-complete';
                                    }
                                    
                                    // Clear template deleter data for built-in templates
                                    if (window.templateDeleter) {
                                        window.templateDeleter.clearTemplateData();
                                    }
                                    
                                    // Clear community template tracking for likes
                                    if (window.yamlLiker) {
                                        window.yamlLiker.clearCommunityTemplateTracking();
                                    }
                                    
                                    // Update copy template button visibility
                                    if (window.copyTemplateModule && window.copyTemplateModule.updateCopyTemplateButtonVisibility) {
                                        window.copyTemplateModule.updateCopyTemplateButtonVisibility();
                                    }
                                    
                                    // Update quick add buttons visibility (hide for templates)
                                    if (window.quickAdd && window.quickAdd.updateQuickAddButtons) {
                                        window.quickAdd.updateQuickAddButtons();
                                    }
                                }, 50);
                            }, 100);
                        }, 100);
                    }, 50);
                }
            } catch (error) {
                console.error('Error loading dstack.ai Complete template:', error);
            }
        });
    }
    
    // Add click handler for Axolotl template in navigation
    const navAxolotl = document.getElementById('nav-template-axolotl');
    if (navAxolotl) {
        navAxolotl.addEventListener('click', async () => {
            try {
                console.log('Axolotl template selected from navigation');
                
                // Use static template data
                const template = {
                    name: 'Axolotl Fine-tuning',
                    yaml_content: `type: task
name: axolotl-finetune

python: "3.11"

image: dstackai/axolotl:py3.11-0.4.1

working_dir: /workspace

commands:
  - accelerate launch -m axolotl.cli.train axolotl_config.yaml

env:
  - HF_TOKEN
  - WANDB_API_KEY

resources:
  gpu: 80GB
  memory: 24GB
  cpu: 8

backends:
  - aws
  - gcp
  - azure

spot_policy: auto

max_duration: 12h`
                };
                
                if (template && window.app && window.app.yamlEditor) {
                    // Update filename editor for template
                    if (window.filenameEditor) {
                        window.filenameEditor.updateCurrentConfig(null, template.name, true);
                    }
                    
                    // Set template content
                    window.app.yamlEditor.setValue(template.yaml_content);
                    
                    // Set the title section to show template name
                    if (window.configTitleEditor) {
                        window.configTitleEditor.setConfigData({
                            title: template.name,
                            description: 'Fine-tune large language models with Axolotl framework',
                            emoji: '🦎',
                            category: 'ml-training'
                        });
                    }
                    
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
                            
                            // Update highlighting and copy button
                            setTimeout(() => {
                                updateNavTemplateHighlight('axolotl');
                                
                                // Update app's selected template reference
                                if (window.app) {
                                    window.app.selectedTemplate = 'axolotl';
                                }
                                
                                // Clear template deleter data for built-in templates
                                if (window.templateDeleter) {
                                    window.templateDeleter.clearTemplateData();
                                }
                                
                                // Clear community template tracking for likes
                                if (window.yamlLiker) {
                                    window.yamlLiker.clearCommunityTemplateTracking();
                                }
                                
                                // Update copy template button visibility
                                if (window.copyTemplateModule && window.copyTemplateModule.updateCopyTemplateButtonVisibility) {
                                    window.copyTemplateModule.updateCopyTemplateButtonVisibility();
                                }
                                
                                // Update quick add buttons visibility (hide for templates)
                                if (window.quickAdd && window.quickAdd.updateQuickAddButtons) {
                                    window.quickAdd.updateQuickAddButtons();
                                }
                            }, 50);
                        }, 100);
                    }, 50);
                }
            } catch (error) {
                console.error('Error loading Axolotl template:', error);
            }
        });
    }
    
    // Add click handler for vLLM template in navigation
    const navVLLM = document.getElementById('nav-template-vllm');
    if (navVLLM) {
        navVLLM.addEventListener('click', async () => {
            try {
                console.log('vLLM template selected from navigation');
                
                // Use static template data for vLLM deployment
                const template = {
                    name: 'vLLM Deployment',
                    yaml_content: `type: service
name: vllm-deployment

python: "3.11"

image: vllm/vllm-openai:latest

port: 8000

commands:
  - python -m vllm.entrypoints.openai.api_server --model $MODEL_NAME --host 0.0.0.0

env:
  - HF_TOKEN
  - MODEL_NAME=meta-llama/Meta-Llama-3.1-8B-Instruct

resources:
  gpu: 80GB
  memory: 24GB
  cpu: 8

backends:
  - aws
  - gcp
  - azure

spot_policy: on-demand

max_duration: 24h`
                };
                
                if (template && window.app && window.app.yamlEditor) {
                    // Update filename editor for template
                    if (window.filenameEditor) {
                        window.filenameEditor.updateCurrentConfig(null, template.name, true);
                    }
                    
                    // Set template content
                    window.app.yamlEditor.setValue(template.yaml_content);
                    
                    // Set the title section to show template name
                    if (window.configTitleEditor) {
                        window.configTitleEditor.setConfigData({
                            title: template.name,
                            description: 'Deploy high-performance LLM inference with vLLM',
                            emoji: '🚄',
                            category: 'inference'
                        });
                    }
                    
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
                            
                            // Update highlighting and copy button
                            setTimeout(() => {
                                updateNavTemplateHighlight('vllm');
                                
                                // Update app's selected template reference
                                if (window.app) {
                                    window.app.selectedTemplate = 'vllm';
                                }
                                
                                // Clear template deleter data for built-in templates
                                if (window.templateDeleter) {
                                    window.templateDeleter.clearTemplateData();
                                }
                                
                                // Clear community template tracking for likes
                                if (window.yamlLiker) {
                                    window.yamlLiker.clearCommunityTemplateTracking();
                                }
                                
                                // Update copy template button visibility
                                if (window.copyTemplateModule && window.copyTemplateModule.updateCopyTemplateButtonVisibility) {
                                    window.copyTemplateModule.updateCopyTemplateButtonVisibility();
                                }
                                
                                // Update quick add buttons visibility (hide for templates)
                                if (window.quickAdd && window.quickAdd.updateQuickAddButtons) {
                                    window.quickAdd.updateQuickAddButtons();
                                }
                            }, 50);
                        }, 100);
                    }, 50);
                }
            } catch (error) {
                console.error('Error loading vLLM template:', error);
            }
        });
    }
    
    // Add click handler for TRL template in navigation
    const navTRL = document.getElementById('nav-template-trl');
    if (navTRL) {
        navTRL.addEventListener('click', async () => {
            try {
                console.log('TRL template selected from navigation');
                
                // Use static template data for TRL training
                const template = {
                    name: 'TRL Training',
                    yaml_content: `type: task
name: trl-train

python: "3.12"
# Ensure nvcc is installed (req. for Flash Attention) 
nvcc: true

env:
  - HF_TOKEN
  - WANDB_API_KEY
  - HUB_MODEL_ID

commands:
  # Pin torch==2.6.0 to avoid building Flash Attention from source.
  # Prebuilt Flash Attention wheels are not available for the latest torch==2.7.0.
  - uv pip install torch==2.6.0
  - uv pip install transformers bitsandbytes peft wandb
  - uv pip install flash_attn --no-build-isolation
  - git clone https://github.com/huggingface/trl
  - cd trl
  - uv pip install .
  - |
    accelerate launch \\
      --config_file=examples/accelerate_configs/multi_gpu.yaml \\
      --num_processes $DSTACK_GPUS_PER_NODE \\
      trl/scripts/sft.py \\
      --model_name meta-llama/Meta-Llama-3.1-8B \\
      --dataset_name OpenAssistant/oasst_top1_2023-08-25 \\
      --dataset_text_field="text" \\
      --per_device_train_batch_size 1 \\
      --per_device_eval_batch_size 1 \\
      --gradient_accumulation_steps 4 \\
      --learning_rate 2e-4 \\
      --report_to wandb \\
      --bf16 \\
      --max_seq_length 1024 \\
      --lora_r 16 \\
      --lora_alpha 32 \\
      --lora_target_modules q_proj k_proj v_proj o_proj \\
      --load_in_4bit \\
      --use_peft \\
      --attn_implementation "flash_attention_2" \\
      --logging_steps=10 \\
      --output_dir models/llama31 \\
      --hub_model_id $HUB_MODEL_ID

resources:
  gpu:
    # 24GB or more VRAM
    memory: 24GB..
    # One or more GPU
    count: 1..
  # Shared memory (for multi-gpu)
  shm_size: 24GB`
                };
                
                if (template && window.app && window.app.yamlEditor) {
                    // Update filename editor for template
                    if (window.filenameEditor) {
                        window.filenameEditor.updateCurrentConfig(null, template.name, true);
                    }
                    
                    // Set template content
                    window.app.yamlEditor.setValue(template.yaml_content);
                    
                    // Set the title section to show template name
                    if (window.configTitleEditor) {
                        window.configTitleEditor.setConfigData({
                            title: template.name,
                            description: 'Train language models with reinforcement learning from human feedback',
                            emoji: '🎯',
                            category: 'ml-training'
                        });
                    }
                    
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
                            
                            // Update highlighting and copy button
                            setTimeout(() => {
                                updateNavTemplateHighlight('trl');
                                
                                // Update app's selected template reference
                                if (window.app) {
                                    window.app.selectedTemplate = 'trl';
                                }
                                
                                // Clear template deleter data for built-in templates
                                if (window.templateDeleter) {
                                    window.templateDeleter.clearTemplateData();
                                }
                                
                                // Clear community template tracking for likes
                                if (window.yamlLiker) {
                                    window.yamlLiker.clearCommunityTemplateTracking();
                                }
                                
                                // Update copy template button visibility
                                if (window.copyTemplateModule && window.copyTemplateModule.updateCopyTemplateButtonVisibility) {
                                    window.copyTemplateModule.updateCopyTemplateButtonVisibility();
                                }
                                
                                // Update quick add buttons visibility (hide for templates)
                                if (window.quickAdd && window.quickAdd.updateQuickAddButtons) {
                                    window.quickAdd.updateQuickAddButtons();
                                }
                            }, 50);
                        }, 100);
                    }, 50);
                }
            } catch (error) {
                console.error('Error loading TRL template:', error);
            }
        });
    }
    
    console.log('Navigation templates initialized');
};

// Load template function for external use
const loadTemplate = (templateId) => {
    if (templateId === 'dstack-complete') {
        const navDstackComplete = document.getElementById('nav-template-dstack-complete');
        if (navDstackComplete) {
            navDstackComplete.click();
        }
    } else if (templateId === 'axolotl') {
        const navAxolotl = document.getElementById('nav-template-axolotl');
        if (navAxolotl) {
            navAxolotl.click();
        }
    } else if (templateId === 'vllm') {
        const navVLLM = document.getElementById('nav-template-vllm');
        if (navVLLM) {
            navVLLM.click();
        }
    } else if (templateId === 'trl') {
        const navTRL = document.getElementById('nav-template-trl');
        if (navTRL) {
            navTRL.click();
        }
    }
};

// Load top 5 liked templates for sidebar
const loadTopTemplates = async () => {
    try {
        const response = await fetch('/api/templates?limit=5&sort=likes');
        const data = await response.json();
        const container = document.getElementById('top-templates-container');
        
        if (!container) return;
        
        if (data.templates && data.templates.length > 0) {
            // Clear loading message
            container.innerHTML = '';
            
            data.templates.forEach(template => {
                const templateCard = document.createElement('div');
                templateCard.className = 'top-template-item p-3 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer group';
                templateCard.setAttribute('data-template-id', template.id);
                templateCard.innerHTML = `
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 flex items-center justify-center group-hover:from-yellow-500/30 group-hover:to-orange-500/30 transition-all">
                            <span class="text-lg">${template.emoji || '⭐'}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="text-white font-medium text-sm line-clamp-1">${template.title || template.name || 'Untitled'}</div>
                            <div class="text-white/60 text-xs flex items-center space-x-2">
                                <span class="truncate">${template.author_name || 'Anonymous'}</span>
                                <span>•</span>
                                <span class="flex items-center space-x-1">
                                    <span>❤️</span>
                                    <span>${template.like_count || 0}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add click handler to load template
                templateCard.addEventListener('click', async () => {
                    try {
                        // Fetch full template data including yaml_content
                        const templateResponse = await fetch(`/api/templates/${template.id}`);
                        const fullTemplate = await templateResponse.json();
                        
                        if (fullTemplate.yaml_content && window.app && window.app.yamlEditor) {
                            // Update filename editor for template
                            if (window.filenameEditor) {
                                window.filenameEditor.updateCurrentConfig(null, fullTemplate.title || fullTemplate.name, true);
                            }
                            
                            // Set template content (remove arrows from yaml content)
                            const cleanYamlContent = fullTemplate.yaml_content.replace(/ [▼▶]/g, '');
                            window.app.yamlEditor.setValue(cleanYamlContent);
                            
                            // Set the title section
                            if (window.configTitleEditor) {
                                window.configTitleEditor.setConfigData({
                                    title: fullTemplate.title || fullTemplate.name,
                                    description: fullTemplate.description || 'Community template',
                                    emoji: fullTemplate.emoji || '⭐',
                                    category: fullTemplate.category || 'community'
                                });
                            }
                            
                            // Update form from YAML
                            setTimeout(() => {
                                if (window.dataSync && window.dataSync.updateFormFromYaml) {
                                    window.dataSync.updateFormFromYaml();
                                }
                                
                                // Add arrows and update highlighting
                                setTimeout(() => {
                                    if (window.yamlCollapse && window.yamlCollapse.addArrowsToContent) {
                                        window.yamlCollapse.addArrowsToContent();
                                    }
                                    
                                    // Set the correct like count from database
                                    if (window.yamlLiker && window.yamlLiker.setCommunityTemplateLikeCount) {
                                        window.yamlLiker.setCommunityTemplateLikeCount(fullTemplate.like_count || 0);
                                    }
                                    
                                    // Dispatch community template loaded event for delete button
                                    const templateLoadedEvent = new CustomEvent('communityTemplateLoaded', {
                                        detail: fullTemplate
                                    });
                                    document.dispatchEvent(templateLoadedEvent);
                                    
                                    // Clear template selection since this is community content
                                    if (window.app) {
                                        window.app.selectedTemplate = null;
                                    }
                                    updateNavTemplateHighlight(null);
                                    
                                    // Update copy template button visibility
                                    if (window.copyTemplateModule && window.copyTemplateModule.updateCopyTemplateButtonVisibility) {
                                        window.copyTemplateModule.updateCopyTemplateButtonVisibility();
                                    }
                                    
                                    // Update quick add buttons visibility
                                    if (window.quickAdd && window.quickAdd.updateQuickAddButtons) {
                                        window.quickAdd.updateQuickAddButtons();
                                    }
                                }, 50);
                            }, 50);
                        }
                    } catch (error) {
                        console.error('Error loading top template:', error);
                    }
                });
                
                container.appendChild(templateCard);
            });
        } else {
            container.innerHTML = `
                <div class="text-white/40 text-xs text-center py-4">
                    No templates available
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading top templates:', error);
        const container = document.getElementById('top-templates-container');
        if (container) {
            container.innerHTML = `
                <div class="text-white/40 text-xs text-center py-4">
                    Failed to load templates
                </div>
            `;
        }
    }
};

// Initialize top templates when navigation loads
const initTopTemplates = () => {
    // Load top templates immediately
    loadTopTemplates();
    
    // Refresh every 5 minutes to get updated like counts
    setInterval(loadTopTemplates, 5 * 60 * 1000);
    
    // Listen for like changes to update template counts immediately
    document.addEventListener('templateLikeChanged', (event) => {
        console.log('Top templates received like change event:', event.detail);
        updateTopTemplateInSidebar(event.detail.templateId);
    });
};

// Update a specific template's like count in the sidebar
const updateTopTemplateInSidebar = async (templateId) => {
    try {
        // Fetch updated template data
        const response = await fetch(`/api/templates/${templateId}`);
        if (!response.ok) {
            console.error('Failed to fetch updated template data');
            return;
        }
        
        const updatedTemplate = await response.json();
        
        // Find the template card in the sidebar and update its like count
        const container = document.getElementById('top-templates-container');
        if (!container) return;
        
        // Find the template card by ID
        const templateCard = container.querySelector(`[data-template-id="${templateId}"]`);
        if (templateCard) {
            // Update the like count in this specific card
            const likeCountElement = templateCard.querySelector('.flex.items-center.space-x-1 span:last-child');
            if (likeCountElement) {
                likeCountElement.textContent = updatedTemplate.like_count || 0;
                console.log('Updated like count in sidebar for template ID:', templateId, 'new count:', updatedTemplate.like_count);
            }
        } else {
            console.log('Template card not found in sidebar for ID:', templateId);
        }
        
    } catch (error) {
        console.error('Error updating template in sidebar:', error);
    }
};

// Export functions
window.navigationModule = {
    toggleNavigation,
    initNavigation,
    initNavTemplates,
    updateNavTemplateHighlight,
    loadTemplate,
    loadTopTemplates,
    initTopTemplates,
    updateTopTemplateInSidebar,
    isNavExpanded: () => isNavExpanded
};