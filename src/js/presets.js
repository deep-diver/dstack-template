// Preset Templates Module

// --- dstack Templates ---
const dstackTemplates = {
    task: `type: task
name: my-task
python: "3.11"
commands:
  - pip install -r requirements.txt
  - python train.py
resources:
  gpu: 24GB
  memory: 32GB
ports:
  - 8080
env:
  - MODEL_NAME=llama2
  - BATCH_SIZE=32`,

    service: `type: service
name: my-service
image: ghcr.io/huggingface/text-generation-inference:latest
env:
  - MODEL_ID=microsoft/DialoGPT-medium
commands:
  - text-generation-launcher --port 8000 --trust-remote-code
port: 8000
resources:
  gpu: 80GB
  memory: 64GB
model:
  type: chat
  name: microsoft/DialoGPT-medium
  format: tgi
replicas: 1..4
rate_limits:
  - prefix: /api/
    rps: 10
    burst: 20`,

    'dev-environment': `type: dev-environment
name: my-dev-env
python: "3.11"
ide: vscode
commands:
  - pip install -r requirements.txt
  - pip install jupyter
resources:
  gpu: 24GB
  memory: 32GB
  cpu: 8
  disk: 100GB
ports:
  - 8888
env:
  - JUPYTER_TOKEN=my-secret-token`
};

// --- Preset Configurations ---
const presetConfigs = {
    'open-r1': `type: task
name: open-r1
python: "3.11"
env:
  - HF_TOKEN
  - HUGGINGFACE_TOKEN
  - WANDB_API_KEY
  - E2B_API_KEY
  - TARGET_BASE_MODEL
  - TARGET_YAML
  - TARGET_REWARD
commands:
  - apt-get update && apt-get install -y wget gnupg
  - wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/cuda-keyring_1.1-1_all.deb
  - dpkg -i cuda-keyring_1.1-1_all.deb
  - rm -f /etc/apt/sources.list.d/cuda*.list
  - wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/cuda-ubuntu2004.pin
  - mv cuda-ubuntu2004.pin /etc/apt/preferences.d/cuda-repository-pin-600
  - wget https://developer.download.nvidia.com/compute/cuda/12.4.0/local_installers/cuda-repo-ubuntu2004-12-4-local_12.4.0-550.54.14-1_amd64.deb
  - dpkg -i cuda-repo-ubuntu2004-12-4-local_12.4.0-550.54.14-1_amd64.deb
  - cp /var/cuda-repo-ubuntu2004-12-4-local/cuda-*-keyring.gpg /usr/share/keyrings/
  - apt-get update
  - apt-get install -y cuda-toolkit-12-4
  - echo 'export PATH=/usr/local/cuda-12.4/bin:$PATH' >> ~/.bashrc
  - echo 'export LD_LIBRARY_PATH=/usr/local/cuda-12.4/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
  - source ~/.bashrc
  - nvcc --version
  - curl -LsSf https://astral.sh/uv/install.sh | sh
  - source ~/.bashrc
  - uv venv openr1 --python 3.11 && source openr1/bin/activate && uv pip install --upgrade pip
  - uv pip install vllm==0.8.4
  - uv pip install setuptools && uv pip install flash-attn --no-build-isolation
  - git clone https://github.com/deep-diver/open-r1.git
  - cp $TARGET_YAML open-r1/recipes/custom.yaml
  - cat open-r1/recipes/custom.yaml
  - cp $TARGET_REWARD open-r1/src/open_r1/code_rewards.py
  - cat open-r1/src/open_r1/code_rewards.py
  - cd open-r1
  - echo "E2B_API_KEY=$E2B_API_KEY" >> ".env"
  - cat .env
  - GIT_LFS_SKIP_SMUDGE=1 uv pip install -e ".[dev]"
  - git clone https://github.com/deep-diver/trl.git
  - cd trl
  - uv pip install .
  - nohup bash -c 'CUDA_VISIBLE_DEVICES=0 trl vllm-serve --model "$TARGET_BASE_MODEL"' > vllm.log 2>&1 &
  - sleep 420
  - cd ..
  - CUDA_VISIBLE_DEVICES=1,2,3,4,5,6,7 ACCELERATE_LOG_LEVEL=info accelerate launch --config_file recipes/accelerate_configs/zero2.yaml --num_processes=7 src/open_r1/grpo.py --config recipes/custom.yaml
  - pkill -f 'trl vllm-serve'
resources:
  gpu: 80GB:8
  disk: 600GB
  shm_size: 2GB`
};

const loadPresetConfig = (presetType) => {
    const { yamlEditor } = window.app || {};
    if (!yamlEditor) return;
    
    if (presetConfigs[presetType]) {
        if (yamlEditor.getValue().trim() === '' || confirm('This will replace the current content. Are you sure?')) {
            yamlEditor.setValue(presetConfigs[presetType]);
            
            // Update selected template and highlighting
            window.app.selectedTemplate = presetType;
            if (window.app.updateTemplateHighlight) {
                window.app.updateTemplateHighlight(presetType);
            }
            
            if (window.dataSync && window.dataSync.updateFormFromYaml) {
                window.dataSync.updateFormFromYaml();
            }
            // Auto-fold after preset load (disabled)
            // setTimeout(() => {
            //     if (window.yamlCollapse && window.yamlCollapse.autoCollapseAll) {
            //         window.yamlCollapse.autoCollapseAll();
            //     }
            // }, 150);
        }
    }
};

// Export
window.presets = {
    dstackTemplates,
    presetConfigs,
    loadPresetConfig
};