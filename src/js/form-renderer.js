// Form Rendering Module

// Get field icon SVG based on key - moved to module scope for access by all functions
const getFieldIcon = (key) => {
    const iconMap = {
        'type': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>',
        'name': '',
        'python': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>',
        'image': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>',
        'commands': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>',
        'init': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3l14 9-14 9V3z"></path></svg>',
        'ports': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path></svg>',
        'port': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 717.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path></svg>',
        'env': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>',
        'resources': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>',
        'gpu': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>',
        'memory': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>',
        'cpu': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>',
        'disk': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path></svg>',
        'shm_size': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>',
        'nodes': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>',
        'replicas': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>',
        'scaling': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>',
        'spot_policy': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>',
        'max_price': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path></svg>',
        'max_duration': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
        'idle_duration': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
        'retry_policy': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>',
        'model': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>',
        'format': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>',
        'working_dir': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path></svg>',
        'volumes': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path></svg>',
        'backends': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"></path></svg>',
        'regions': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
        'fleet': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>',
        'ide': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>',
        'value': '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>'
    };
    return iconMap[key] || '';
};

/**
 * Generates an input field based on the value type and dstack context.
 */
const createInputField = (key, value, path) => {
    const type = typeof value;
    const id = `field-${path}`;
    let inputHtml = '';
    
    // Common classes for text-based inputs with compact styling
    const inputClasses = "form-input mt-1 block w-full rounded-lg border-white/20 shadow-lg focus:border-violet-400 focus:ring-violet-400 text-sm font-medium placeholder-white/60 py-2.5";
    const selectClasses = "form-select mt-1 block w-full rounded-lg border-white/20 shadow-lg focus:border-violet-400 focus:ring-violet-400 text-sm font-medium py-2.5";

    const fieldIcon = getFieldIcon(key);
    const fieldLabel = String(key).replace(/_/g, ' ');

    // dstack-specific field handling
    if (key === 'type' && typeof value === 'string') {
        inputHtml = `
            <div class="relative">
                <select data-path="${path}" id="${id}" class="${selectClasses} appearance-none cursor-pointer">
                    <option value="task" ${value === 'task' ? 'selected' : ''}>Task</option>
                    <option value="service" ${value === 'service' ? 'selected' : ''}>Service</option>
                    <option value="dev-environment" ${value === 'dev-environment' ? 'selected' : ''}>Dev Environment</option>
                </select>
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg class="h-5 w-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </div>
            </div>`;
    } else if (key === 'python' && typeof value === 'string') {
        inputHtml = `
            <div class="relative">
                <select data-path="${path}" id="${id}" class="${selectClasses} appearance-none cursor-pointer">
                    <option value="3.8" ${value === '3.8' ? 'selected' : ''}>Python 3.8</option>
                    <option value="3.9" ${value === '3.9' ? 'selected' : ''}>Python 3.9</option>
                    <option value="3.10" ${value === '3.10' ? 'selected' : ''}>Python 3.10</option>
                    <option value="3.11" ${value === '3.11' ? 'selected' : ''}>Python 3.11</option>
                    <option value="3.12" ${value === '3.12' ? 'selected' : ''}>Python 3.12</option>
                </select>
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg class="h-5 w-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </div>
            </div>`;
    } else if (key === 'ide' && typeof value === 'string') {
        inputHtml = `
            <div class="relative">
                <select data-path="${path}" id="${id}" class="${selectClasses} appearance-none cursor-pointer">
                    <option value="vscode" ${value === 'vscode' ? 'selected' : ''}>VS Code</option>
                    <option value="jupyter" ${value === 'jupyter' ? 'selected' : ''}>Jupyter</option>
                    <option value="ssh" ${value === 'ssh' ? 'selected' : ''}>SSH</option>
                </select>
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg class="h-5 w-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </div>
            </div>`;
    } else if (key === 'spot_policy' && typeof value === 'string') {
        inputHtml = `
            <div class="relative">
                <select data-path="${path}" id="${id}" class="${selectClasses} appearance-none cursor-pointer">
                    <option value="auto" ${value === 'auto' ? 'selected' : ''}>Auto</option>
                    <option value="spot" ${value === 'spot' ? 'selected' : ''}>Spot Only</option>
                    <option value="on-demand" ${value === 'on-demand' ? 'selected' : ''}>On-Demand Only</option>
                </select>
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg class="h-5 w-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </div>
            </div>`;
    } else if (key === 'retry_policy' && typeof value === 'string') {
        inputHtml = `
            <div class="relative">
                <select data-path="${path}" id="${id}" class="${selectClasses} appearance-none cursor-pointer">
                    <option value="never" ${value === 'never' ? 'selected' : ''}>Never</option>
                    <option value="on-failure" ${value === 'on-failure' ? 'selected' : ''}>On Failure</option>
                    <option value="always" ${value === 'always' ? 'selected' : ''}>Always</option>
                </select>
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg class="h-5 w-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </div>
            </div>`;
    } else if (key === 'format' && typeof value === 'string') {
        inputHtml = `
            <div class="relative">
                <select data-path="${path}" id="${id}" class="${selectClasses} appearance-none cursor-pointer">
                    <option value="openai" ${value === 'openai' ? 'selected' : ''}>OpenAI Compatible</option>
                    <option value="tgi" ${value === 'tgi' ? 'selected' : ''}>Text Generation Inference</option>
                    <option value="vllm" ${value === 'vllm' ? 'selected' : ''}>vLLM</option>
                </select>
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg class="h-5 w-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </div>
            </div>`;
    } else if ((key === 'gpu' || key === 'memory' || key === 'disk' || key === 'cpu') && typeof value === 'string') {
        const placeholderMap = {
            'gpu': 'e.g., 24GB, 80GB:8, or A100',
            'memory': 'e.g., 8GB, 16GB, 32GB',
            'disk': 'e.g., 50GB, 100GB, 1TB',
            'cpu': 'e.g., 2, 4, 8'
        };
        inputHtml = `
            <div class="relative">
                <input data-path="${path}" type="text" id="${id}" value="${value}" placeholder="${placeholderMap[key]}" 
                       class="${inputClasses} pl-4" />
            </div>`;
    } else if ((key === 'max_price' || key === 'max_duration' || key === 'idle_duration') && typeof value === 'string') {
        const placeholderMap = {
            'max_price': 'e.g., $1.00, $5.50',
            'max_duration': 'e.g., 1h, 30m, 2d',
            'idle_duration': 'e.g., 5m, 15m, 1h'
        };
        inputHtml = `
            <div class="relative">
                <input data-path="${path}" type="text" id="${id}" value="${value}" placeholder="${placeholderMap[key]}" 
                       class="${inputClasses} pl-4" />
            </div>`;
    } else if ((key === 'port' || key === 'nodes' || key === 'replicas') && typeof value === 'number') {
        inputHtml = `
            <div class="relative">
                <input data-path="${path}" type="number" id="${id}" value="${value}" min="1" 
                       class="${inputClasses} pl-4" />
            </div>`;
    } else if (key === 'working_dir' && typeof value === 'string') {
        inputHtml = `
            <div class="relative">
                <input data-path="${path}" type="text" id="${id}" value="${value}" placeholder="/workspace" 
                       class="${inputClasses} pl-4" />
            </div>`;
    } else if (key === 'image' && typeof value === 'string') {
        inputHtml = `
            <div class="relative">
                <input data-path="${path}" type="text" id="${id}" value="${value}" placeholder="ubuntu:20.04 or dstackai/base:py3.11-0.4.2" 
                       class="${inputClasses} pl-4" />
            </div>`;
    } else if (key === 'model' && typeof value === 'string') {
        inputHtml = `
            <div class="relative">
                <input data-path="${path}" type="text" id="${id}" value="${value}" placeholder="meta-llama/Meta-Llama-3.1-8B-Instruct" 
                       class="${inputClasses} pl-4" />
            </div>`;
    } else if (key === 'shm_size' && typeof value === 'string') {
        inputHtml = `
            <div class="relative">
                <input data-path="${path}" type="text" id="${id}" value="${value}" placeholder="2GB" 
                       class="${inputClasses} pl-4" />
            </div>`;
    } else if (type === 'boolean') {
        inputHtml = `
            <div class="relative">
                <div class="flex items-center mt-3 p-4 glass rounded-xl border border-white/10 hover:border-white/20 transition-all group">
                    <div class="flex items-center">
                        <input type="checkbox" data-path="${path}" id="${id}" ${value ? 'checked' : ''} class="h-5 w-5 rounded-lg border-white/30 text-violet-600 focus:ring-violet-500 focus:ring-offset-2 transition-all">
                        <div class="ml-4 flex items-center space-x-3">
                            <div class="text-white/60">${fieldIcon}</div>
                            <label for="${id}" class="text-sm font-semibold transition-colors ${value ? 'text-green-400' : 'text-white/70'}">${value ? 'Enabled' : 'Disabled'}</label>
                        </div>
                    </div>
                    <div class="ml-auto">
                        <div class="w-6 h-6 rounded-full flex items-center justify-center ${value ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${value ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}"></path>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>`;
    } else if (type === 'number') {
        inputHtml = `
            <div class="relative">
                <input type="number" data-path="${path}" id="${id}" value="${value}" class="${inputClasses} pl-4" placeholder="Enter number...">
            </div>`;
    } else { // string or other
        let placeholder = `Enter ${fieldLabel.toLowerCase()}...`;
        if (key === 'name') placeholder = 'my-awesome-project';
        else if (key === 'image') placeholder = 'ghcr.io/huggingface/transformers';
        else if (key === 'value') placeholder = 'Enter value...';
        
        // Calculate rows based on content
        const lines = value.toString().split('\n').length;
        const rows = Math.max(1, lines);
        
        inputHtml = `
            <div class="relative">
                <textarea data-path="${path}" id="${id}" class="${inputClasses} pl-4 min-h-[2.5rem] resize-y auto-resize" placeholder="${placeholder}" rows="${rows}">${value}</textarea>
                ${fieldIcon ? `<div class="absolute top-3 left-0 pl-3 flex items-center pointer-events-none text-white/60">
                    ${fieldIcon}
                </div>` : ''}
            </div>`;
    }

    // Add helpful explanatory text for all fields
    let helpText = '';
    const helpTexts = {
        'type': {
            text: 'The type of workload: task (batch job), service (long-running), or dev-environment (interactive)',
            examples: 'e.g. task, service, dev-environment',
            gradient: 'from-blue-500/15 to-indigo-500/15'
        },
        'name': {
            text: 'A unique identifier for your configuration. Use descriptive names for easy identification',
            examples: 'e.g. my-training-job, web-api, jupyter-notebook',
            gradient: 'from-purple-500/15 to-violet-500/15'
        },
        'python': {
            text: 'Python version to use in your environment. Choose based on your dependencies',
            examples: 'e.g. 3.8, 3.9, 3.10, 3.11, 3.12',
            gradient: 'from-green-500/15 to-emerald-500/15'
        },
        'image': {
            text: 'Docker image to use as base environment. Can be from Docker Hub or custom registries',
            examples: 'e.g. ubuntu:20.04, dstackai/base:py3.11-0.4.2, nvidia/cuda:11.8-devel-ubuntu20.04',
            gradient: 'from-blue-500/15 to-indigo-500/15'
        },
        'working_dir': {
            text: 'Directory where commands will be executed. Defaults to /workspace if not specified',
            examples: 'e.g. /workspace, /app, /home/user/project',
            gradient: 'from-yellow-500/15 to-orange-500/15'
        },
        'commands': {
            text: 'List of shell commands to execute sequentially. Each command runs in the same environment',
            examples: 'e.g. pip install -r requirements.txt, python train.py, npm start',
            gradient: 'from-purple-500/15 to-pink-500/15'
        },
        'env': {
            text: 'Environment variables available to your commands. Use KEY=value format or just KEY for secrets',
            examples: 'e.g. MODEL_NAME=llama-7b, CUDA_VISIBLE_DEVICES=0,1, HF_TOKEN',
            gradient: 'from-emerald-500/15 to-green-500/15'
        },
        'ports': {
            text: 'Network ports to expose for services. Required for web applications and APIs',
            examples: 'e.g. 8000, 3000, 5000, 8080',
            gradient: 'from-cyan-500/15 to-blue-500/15'
        },
        'resources': {
            text: 'Hardware requirements for your workload. Specify GPU, memory, CPU, and disk needs',
            examples: 'Configure GPU, memory, CPU, disk, and shared memory',
            gradient: 'from-orange-500/15 to-red-500/15'
        },
        'gpu': {
            text: 'GPU memory requirement. Can specify exact amount, range, or GPU type',
            examples: 'e.g. 24GB, 80GB:8, A100, 24GB..80GB',
            gradient: 'from-orange-500/15 to-red-500/15'
        },
        'memory': {
            text: 'System RAM requirement. Higher memory needed for large datasets and models',
            examples: 'e.g. 8GB, 16GB, 32GB, 64GB',
            gradient: 'from-blue-500/15 to-purple-500/15'
        },
        'cpu': {
            text: 'Number of CPU cores. More cores help with parallel processing and data loading',
            examples: 'e.g. 2, 4, 8, 16',
            gradient: 'from-blue-500/15 to-purple-500/15'
        },
        'disk': {
            text: 'Storage space for datasets, models, and temporary files',
            examples: 'e.g. 50GB, 100GB, 500GB, 1TB',
            gradient: 'from-blue-500/15 to-purple-500/15'
        },
        'shm_size': {
            text: 'Shared memory size for data loading and inter-process communication',
            examples: 'e.g. 2GB, 4GB, 8GB',
            gradient: 'from-blue-500/15 to-purple-500/15'
        },
        'volumes': {
            text: 'Mount external storage or bind local directories. Format: source:destination:mode',
            examples: 'e.g. /data:/workspace/data:rw, ~/datasets:/mnt/data:ro',
            gradient: 'from-indigo-500/15 to-purple-500/15'
        },
        'backends': {
            text: 'Cloud providers to use for running your workload. Multiple backends provide fallback options',
            examples: 'e.g. aws, gcp, azure, lambda, runpod',
            gradient: 'from-teal-500/15 to-cyan-500/15'
        },
        'regions': {
            text: 'Specific regions within cloud providers. Closer regions reduce latency and costs',
            examples: 'e.g. us-east-1, us-west-2, eu-west-1, asia-southeast-1',
            gradient: 'from-green-500/15 to-emerald-500/15'
        },
        'nodes': {
            text: 'Number of compute nodes for distributed workloads. Use for multi-GPU training',
            examples: 'e.g. 1, 2, 4 (for distributed training)',
            gradient: 'from-lime-500/15 to-green-500/15'
        },
        'replicas': {
            text: 'Number of service replicas for load balancing. Can specify exact count or range',
            examples: 'e.g. 1, 1..4, 2..10',
            gradient: 'from-sky-500/15 to-blue-500/15'
        },
        'spot_policy': {
            text: 'Cost optimization strategy. Spot instances are cheaper but can be interrupted',
            examples: 'auto (mixed), spot (cheapest), on-demand (reliable)',
            gradient: 'from-pink-500/15 to-rose-500/15'
        },
        'retry_policy': {
            text: 'When to restart failed jobs. Useful for handling transient failures',
            examples: 'never, on-failure (recommended), always',
            gradient: 'from-violet-500/15 to-purple-500/15'
        },
        'max_price': {
            text: 'Maximum hourly cost limit. Helps control cloud spending and avoid surprises',
            examples: 'e.g. $1.00, $5.50, $10.00',
            gradient: 'from-red-500/15 to-pink-500/15'
        },
        'max_duration': {
            text: 'Maximum runtime before automatic termination. Prevents runaway jobs',
            examples: 'e.g. 1h, 6h, 1d, 2d',
            gradient: 'from-slate-500/15 to-gray-500/15'
        },
        'idle_duration': {
            text: 'Auto-terminate after period of inactivity. Saves costs on idle resources',
            examples: 'e.g. 5m, 15m, 1h, 2h',
            gradient: 'from-stone-500/15 to-neutral-500/15'
        },
        'model': {
            text: 'Pre-trained model identifier from Hugging Face or other model hubs',
            examples: 'e.g. meta-llama/Llama-2-7b, gpt2, microsoft/DialoGPT-medium',
            gradient: 'from-purple-500/15 to-violet-500/15'
        },
        'format': {
            text: 'API format for model serving. Different formats offer various features and compatibility',
            examples: 'openai (ChatGPT-like), tgi (fast inference), vllm (high throughput)',
            gradient: 'from-blue-500/15 to-indigo-500/15'
        },
        'ide': {
            text: 'Development environment for interactive work. Choose based on your workflow preferences',
            examples: 'vscode (full IDE), jupyter (notebooks), ssh (terminal access)',
            gradient: 'from-purple-500/15 to-pink-500/15'
        },
        'port': {
            text: 'Network port number for service communication. Must be unique per service',
            examples: 'e.g. 8000, 3000, 5000, 8080',
            gradient: 'from-cyan-500/15 to-blue-500/15'
        }
    };

    const helpConfig = helpTexts[key];
    if (helpConfig) {
        helpText = `<div class="help-text mt-1 p-2 bg-gradient-to-r ${helpConfig.gradient} rounded-lg border border-white/10">
            <p class="text-xs text-white/90 font-medium mb-1">${helpConfig.text}</p>
            <p class="text-xs text-white/70 font-normal">${helpConfig.examples}</p>
        </div>`;
    }

    // All fields can be removed
    const isRemovable = true;
    
    const removeButtonHtml = isRemovable ? `
        <button type="button" onclick="removeFieldFromForm('${key}')" class="remove-field-btn ml-2 p-1 text-white/40 hover:text-red-400 hover:bg-red-500/20 rounded transition-all hover:scale-110" title="Remove ${fieldLabel}">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
        </button>
    ` : '';

    return `
        <div class="field-container mb-4 group">
            <label for="${id}" class="flex items-center text-sm font-bold text-white capitalize mb-2 group-hover:text-white transition-colors">
                <div class="text-white/80 mr-2" style="text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);">${fieldIcon}</div>
                <span style="text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7); font-weight: 600;">${fieldLabel}</span>
                ${removeButtonHtml}
            </label>
            ${inputHtml}
            ${helpText}
        </div>`;
};

const generateSummary = (data, path) => {
    if (Array.isArray(data)) {
        if (data.length === 0) return "Empty";
        return `${data.length} item${data.length > 1 ? 's' : ''}`;
    } else if (typeof data === 'object' && data !== null) {
        const keys = Object.keys(data);
        if (keys.length === 0) return "Empty";
        return `${keys.length} field${keys.length > 1 ? 's' : ''}: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`;
    }
    return '';
};

/**
 * Recursively builds the form UI from a JavaScript object.
 */
const renderForm = (data, parentElement, parentPath = '') => {
    if (Array.isArray(data)) {
        // --- Render Array ---
        const arrayContainer = document.createElement('div');
        data.forEach((item, index) => {
            const itemPath = parentPath ? `${parentPath}.${index}` : String(index);
            const fieldset = document.createElement('fieldset');
            fieldset.className = "glass border border-white/30 rounded-xl p-4 mb-4 relative group hover:glow transition-all duration-500 fieldset-enter";
            const summaryText = generateSummary(item, itemPath);
            fieldset.innerHTML = `
                <legend class="text-sm font-bold px-3 py-1.5 text-white bg-gradient-to-r from-violet-500/90 to-purple-500/90 rounded-lg shadow-lg backdrop-blur-md border border-white/30 cursor-pointer hover:from-violet-500 hover:to-purple-500 transition-all" style="text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);" onclick="toggleFieldset(this)">
                    <div class="flex items-center justify-between w-full">
                        <div class="flex items-center space-x-2">
                            <span>Item ${index + 1}</span>
                            <svg class="w-4 h-4 collapse-arrow expanded" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="summary-preview" style="text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);">${summaryText}</div>
                </legend>
                <button data-path="${itemPath}" class="remove-btn absolute top-2 right-2 p-1.5 text-white/60 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                </button>
                <div class="fieldset-content expanded mt-3">
                </div>
            `;
            
            // Handle primitive values in arrays (like strings in commands array)
            const contentDiv = fieldset.querySelector('.fieldset-content');
            if (typeof item !== 'object' || item === null) {
                contentDiv.innerHTML = createInputField('value', item, itemPath);
            } else {
                renderForm(item, contentDiv, itemPath);
            }
            arrayContainer.appendChild(fieldset);
        });
         
        // Smart default for array items based on parent context
        let addButtonText = 'Add Item';
        let newItemTemplate = "new_item";
        
        if (parentPath === 'commands') {
            addButtonText = 'Add Command';
            newItemTemplate = 'python script.py';
        } else if (parentPath === 'env') {
            addButtonText = 'Add Environment Variable';
            newItemTemplate = 'KEY=value';
        } else if (parentPath === 'ports') {
            addButtonText = 'Add Port';
            newItemTemplate = 8080;
        } else if (parentPath === 'rate_limits') {
            addButtonText = 'Add Rate Limit';
            newItemTemplate = { prefix: "/api/", rps: 10 };
        }
        
        arrayContainer.innerHTML += `<button data-path="${parentPath}" data-template='${JSON.stringify(newItemTemplate)}' class="add-btn mt-3 w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-white/30 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-violet-500/20 to-purple-500/20 hover:from-violet-500/30 hover:to-purple-500/30 transition-all hover:scale-105 hover:shadow-lg backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-white/80" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" /></svg>${addButtonText}</button>`;
        parentElement.appendChild(arrayContainer);
    } else if (typeof data === 'object' && data !== null) {
        // --- Render Object ---
        Object.entries(data).forEach(([key, value]) => {
            const currentPath = parentPath ? `${parentPath}.${key}` : key;
            if (typeof value === 'object' && value !== null) {
                // ALL object/array sections now get edit buttons
                const summaryContainer = document.createElement('div');
                summaryContainer.className = "field-container mb-4 group";
                const summaryText = generateSummary(value, currentPath);
                
                // All fields can be removed
                const isRemovable = true;
                
                const removeButtonHtml = isRemovable ? `
                    <button type="button" onclick="removeFieldFromForm('${key}')" class="remove-field-btn ml-2 p-1 text-white/40 hover:text-red-400 hover:bg-red-500/20 rounded transition-all hover:scale-110" title="Remove ${key.replace(/_/g, ' ')}">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                ` : '';

                const editButtonHtml = `
                    <button class="edit-button" onclick="openDrawer('${currentPath}', '${key}')">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                        </svg>
                        Edit
                    </button>
                `;
                
                const fieldIcon = getFieldIcon(key);
                
                // Get help text for grouped fields
                const groupedFieldHelpTexts = {
                    'resources': {
                        text: 'Hardware requirements for your workload. Configure GPU, memory, CPU, disk, and shared memory based on your computational needs.',
                        examples: 'Specify GPU memory, RAM, CPU cores, storage, and shared memory',
                        gradient: 'from-orange-500/15 to-red-500/15'
                    },
                    'env': {
                        text: 'Environment variables for your application. Use KEY=value format for values or just KEY for secrets from your environment.',
                        examples: 'e.g. MODEL_NAME=llama-7b, CUDA_VISIBLE_DEVICES=0,1, HF_TOKEN (secret)',
                        gradient: 'from-emerald-500/15 to-green-500/15'
                    },
                    'commands': {
                        text: 'Sequential shell commands to execute. Each command runs in order, and failures stop execution.',
                        examples: 'e.g. pip install requirements, python train.py, npm start',
                        gradient: 'from-purple-500/15 to-pink-500/15'
                    },
                    'ports': {
                        text: 'Network ports to expose for services. Required for web applications, APIs, and any network communication.',
                        examples: 'e.g. 8000 (web server), 3000 (React app), 5000 (Flask API)',
                        gradient: 'from-cyan-500/15 to-blue-500/15'
                    },
                    'volumes': {
                        text: 'Mount external storage or bind directories. Format: source:destination:mode (rw=read-write, ro=read-only).',
                        examples: 'e.g. /data:/workspace/data:rw, ~/models:/app/models:ro',
                        gradient: 'from-indigo-500/15 to-purple-500/15'
                    },
                    'backends': {
                        text: 'Cloud providers to run your workload. Multiple backends provide fallback options and cost optimization.',
                        examples: 'e.g. aws, gcp, azure, lambda, runpod, vastai',
                        gradient: 'from-teal-500/15 to-cyan-500/15'
                    },
                    'regions': {
                        text: 'Specific geographical regions within cloud providers. Choose regions closer to your data or users.',
                        examples: 'e.g. us-east-1, us-west-2, eu-west-1, asia-southeast-1',
                        gradient: 'from-green-500/15 to-emerald-500/15'
                    },
                    'scaling': {
                        text: 'Auto-scaling configuration for services. Define minimum, maximum replicas and scaling metrics.',
                        examples: 'Configure min/max replicas, CPU/memory thresholds, scaling policies',
                        gradient: 'from-blue-500/15 to-indigo-500/15'
                    },
                    'fleet': {
                        text: 'Fleet configuration for managing multiple instances with shared settings and policies.',
                        examples: 'Define instance policies, networking, and shared configurations',
                        gradient: 'from-violet-500/15 to-purple-500/15'
                    }
                };
                
                const groupHelpConfig = groupedFieldHelpTexts[key];
                let groupHelpText = '';
                if (groupHelpConfig) {
                    groupHelpText = `<div class="help-text mt-2 p-2 bg-gradient-to-r ${groupHelpConfig.gradient} rounded-lg border border-white/10">
                        <p class="text-xs text-white/90 font-medium mb-1">${groupHelpConfig.text}</p>
                        <p class="text-xs text-white/70 font-normal">${groupHelpConfig.examples}</p>
                    </div>`;
                }
                
                summaryContainer.innerHTML = `
                    <div class="flex items-center justify-between mb-2">
                        <label class="flex items-center text-sm font-bold text-white capitalize">
                            <div class="text-white/80 mr-2" style="text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);">
                                ${fieldIcon}
                            </div>
                            <span style="text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7); font-weight: 600;">${key.replace(/_/g, ' ')}</span>
                            ${removeButtonHtml}
                        </label>
                        ${editButtonHtml}
                    </div>
                    <div class="glass border border-white/30 rounded-xl p-4">
                        <div class="text-sm text-white/70" style="text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);">
                            ${summaryText || 'Click Edit to configure'}
                        </div>
                    </div>
                    ${groupHelpText}
                `;
                parentElement.appendChild(summaryContainer);
            } else {
                parentElement.innerHTML += createInputField(key, value, currentPath);
            }
        });
    }
};

// --- Fast Collapsible Section Function ---
window.toggleFieldset = function(headerElement) {
    const groupContainer = headerElement.closest('.group');
    const content = groupContainer.querySelector('.fieldset-content');
    const arrow = headerElement.querySelector('.collapse-arrow');
    const summary = groupContainer.querySelector('.summary-preview');
    const isExpanded = content.classList.contains('expanded');
    
    if (isExpanded) {
        // Collapse - show summary, hide container
        content.classList.remove('expanded');
        content.classList.add('collapsed');
        arrow.classList.remove('expanded');
        arrow.classList.add('collapsed');
        if (summary) summary.style.display = 'block';
    } else {
        // Expand - hide summary, show container
        content.classList.remove('collapsed');
        content.classList.add('expanded');
        arrow.classList.remove('collapsed');
        arrow.classList.add('expanded');
        if (summary) summary.style.display = 'none';
    }
};

// Global function to remove field from form (called by onclick)
window.removeFieldFromForm = function(fieldName) {
    if (window.quickAdd && window.quickAdd.removeDstackField) {
        window.quickAdd.removeDstackField(fieldName);
    }
};

// Export functions
window.formRenderer = {
    createInputField,
    renderForm,
    generateSummary
};