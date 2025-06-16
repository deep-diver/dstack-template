-- dstack Configuration Database Schema

-- Groups table for organizing configurations
CREATE TABLE groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Templates table for predefined configurations
CREATE TABLE templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'template',
    yaml_content TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User configurations table
CREATE TABLE configurations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    group_id TEXT,
    yaml_content TEXT NOT NULL,
    description TEXT,
    is_template_copy BOOLEAN DEFAULT FALSE,
    source_template_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL,
    FOREIGN KEY (source_template_id) REFERENCES templates(id) ON DELETE SET NULL,
    UNIQUE(name, group_id)
);

-- Insert default group
INSERT INTO groups (id, name, description) VALUES 
('default', 'Default', 'Default group for configurations');

-- Insert Open-R1 template
INSERT INTO templates (id, name, type, yaml_content, description, is_default) VALUES 
(
    'open-r1',
    'Open-R1',
    'template',
    'type: task
name: open-r1-training
python: "3.11"

# Advanced ML training configuration for Open-R1 model
commands:
  - echo "Starting Open-R1 training..."
  - pip install transformers torch accelerate
  - python train_open_r1.py --config configs/open_r1_config.yaml
  - echo "Training completed successfully!"

resources:
  gpu: 4
  memory: 32GB
  disk: 100GB
  
ports:
  - 8080
  - 6006

env:
  - CUDA_VISIBLE_DEVICES=0,1,2,3
  - TRANSFORMERS_CACHE=/tmp/transformers_cache
  - WANDB_PROJECT=open-r1-training

volumes:
  - /data:/workspace/data
  - /models:/workspace/models

working_dir: /workspace',
    'Advanced ML training configuration for Open-R1 model',
    TRUE
);

-- Insert comprehensive dstack.ai template with all supported fields
INSERT INTO templates (id, name, type, yaml_content, description, is_default) VALUES 
(
    'dstack-full',
    'dstack.ai Complete',
    'template',
    'type: task
name: my-dstack-config
python: "3.11"
image: dstackai/base:py3.11-0.4.2

commands:
  - pip install -r requirements.txt
  - python main.py

resources:
  gpu: 24GB
  memory: 16GB
  cpu: 4
  disk: 50GB
  shm_size: 2GB

# dstack.ai advanced configuration
spot_policy: auto
retry_policy: on-failure
max_price: $2.50
max_duration: 6h
idle_duration: 10m

# Infrastructure
nodes: 1
replicas: 1
backends:
  - aws
  - gcp
regions:
  - us-east-1
  - us-west-2

# Environment and networking
env:
  - MODEL_NAME=meta-llama/Llama-2-7b
  - CUDA_VISIBLE_DEVICES=0
  
ports:
  - 8000
  - 8080

# Storage
volumes:
  - /data:/workspace/data:rw
  - /models:/workspace/models:ro

working_dir: /workspace',
    'Complete dstack.ai configuration with all supported fields',
    FALSE
);

-- Create indexes for better performance
CREATE INDEX idx_configurations_group_id ON configurations(group_id);
CREATE INDEX idx_configurations_name ON configurations(name);
CREATE INDEX idx_groups_name ON groups(name);
CREATE INDEX idx_templates_name ON templates(name);