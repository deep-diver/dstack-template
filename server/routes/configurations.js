const express = require('express');
const { v4: uuidv4 } = require('uuid');
const yaml = require('js-yaml');
const router = express.Router();

// GET /api/configurations - Get all configurations
router.get('/', async (req, res) => {
    try {
        const { group_id } = req.query;
        const configurations = await req.db.getConfigurations(group_id);
        res.json(configurations);
    } catch (error) {
        console.error('Error fetching configurations:', error);
        res.status(500).json({ error: 'Failed to fetch configurations' });
    }
});

// GET /api/configurations/with-groups - Get all configurations with group info
router.get('/with-groups', async (req, res) => {
    try {
        const configurations = await req.db.getConfigurationsWithGroups();
        res.json(configurations);
    } catch (error) {
        console.error('Error fetching configurations with groups:', error);
        res.status(500).json({ error: 'Failed to fetch configurations' });
    }
});

// POST /api/configurations - Create a new configuration
router.post('/', async (req, res) => {
    try {
        const { name, group_id, yaml_content, description, is_template_copy, source_template_id } = req.body;
        
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Configuration name is required' });
        }

        if (!yaml_content || yaml_content.trim().length === 0) {
            return res.status(400).json({ error: 'YAML content is required' });
        }

        // Validate YAML content
        try {
            yaml.load(yaml_content);
        } catch (yamlError) {
            return res.status(400).json({ error: 'Invalid YAML content', details: yamlError.message });
        }

        const id = uuidv4();
        const groupId = group_id || 'default';
        
        // Check if group exists
        const group = await req.db.getGroup(groupId);
        if (!group) {
            return res.status(400).json({ error: 'Group does not exist' });
        }

        // Check if configuration name already exists in the group
        const existingConfigs = await req.db.getConfigurations(groupId);
        const nameExists = existingConfigs.some(config => config.name.toLowerCase() === name.trim().toLowerCase());
        if (nameExists) {
            return res.status(409).json({ error: 'A configuration with this name already exists in the selected group' });
        }

        await req.db.createConfiguration(
            id,
            name.trim(),
            groupId,
            yaml_content.trim(),
            description?.trim() || null,
            is_template_copy || false,
            source_template_id || null
        );
        
        const newConfiguration = await req.db.getConfiguration(id);
        res.status(201).json(newConfiguration);
    } catch (error) {
        console.error('Error creating configuration:', error);
        res.status(500).json({ error: 'Failed to create configuration' });
    }
});

// POST /api/configurations/copy-template - Copy a template to a configuration
router.post('/copy-template', async (req, res) => {
    try {
        const { name, group_id, template_id, description } = req.body;
        
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Configuration name is required' });
        }

        if (!template_id) {
            return res.status(400).json({ error: 'Template ID is required' });
        }

        // Get template
        const template = await req.db.getTemplate(template_id);
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        const id = uuidv4();
        const groupId = group_id || 'default';
        
        // Check if group exists
        const group = await req.db.getGroup(groupId);
        if (!group) {
            return res.status(400).json({ error: 'Group does not exist' });
        }

        // Check if configuration name already exists in the group
        const existingConfigs = await req.db.getConfigurations(groupId);
        const nameExists = existingConfigs.some(config => config.name.toLowerCase() === name.trim().toLowerCase());
        if (nameExists) {
            return res.status(409).json({ error: 'A configuration with this name already exists in the selected group' });
        }

        await req.db.createConfiguration(
            id,
            name.trim(),
            groupId,
            template.yaml_content,
            description?.trim() || `Copied from ${template.name} template`,
            true, // is_template_copy
            template_id
        );
        
        const newConfiguration = await req.db.getConfiguration(id);
        res.status(201).json(newConfiguration);
    } catch (error) {
        console.error('Error copying template:', error);
        res.status(500).json({ error: 'Failed to copy template' });
    }
});

// GET /api/configurations/:id - Get a specific configuration
router.get('/:id', async (req, res) => {
    try {
        const configuration = await req.db.getConfiguration(req.params.id);
        if (!configuration) {
            return res.status(404).json({ error: 'Configuration not found' });
        }
        res.json(configuration);
    } catch (error) {
        console.error('Error fetching configuration:', error);
        res.status(500).json({ error: 'Failed to fetch configuration' });
    }
});

// PUT /api/configurations/:id - Update a configuration
router.put('/:id', async (req, res) => {
    try {
        const { name, yaml_content, description } = req.body;
        
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Configuration name is required' });
        }

        if (!yaml_content || yaml_content.trim().length === 0) {
            return res.status(400).json({ error: 'YAML content is required' });
        }

        // Validate YAML content
        try {
            yaml.load(yaml_content);
        } catch (yamlError) {
            return res.status(400).json({ error: 'Invalid YAML content', details: yamlError.message });
        }

        const existingConfiguration = await req.db.getConfiguration(req.params.id);
        if (!existingConfiguration) {
            return res.status(404).json({ error: 'Configuration not found' });
        }

        await req.db.updateConfiguration(
            req.params.id,
            name.trim(),
            yaml_content.trim(),
            description?.trim() || null
        );
        
        const updatedConfiguration = await req.db.getConfiguration(req.params.id);
        res.json(updatedConfiguration);
    } catch (error) {
        console.error('Error updating configuration:', error);
        res.status(500).json({ error: 'Failed to update configuration' });
    }
});

// DELETE /api/configurations/:id - Delete a configuration
router.delete('/:id', async (req, res) => {
    try {
        const existingConfiguration = await req.db.getConfiguration(req.params.id);
        if (!existingConfiguration) {
            return res.status(404).json({ error: 'Configuration not found' });
        }

        await req.db.deleteConfiguration(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting configuration:', error);
        res.status(500).json({ error: 'Failed to delete configuration' });
    }
});

module.exports = router;