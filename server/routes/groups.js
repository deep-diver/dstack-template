const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// GET /api/groups - Get all groups
router.get('/', async (req, res) => {
    try {
        const groups = await req.db.getGroups();
        res.json(groups);
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

// POST /api/groups - Create a new group
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Group name is required' });
        }

        const id = name.toLowerCase().replace(/\s+/g, '-');
        
        // Check if group already exists
        const existingGroup = await req.db.getGroup(id);
        if (existingGroup) {
            return res.status(409).json({ error: 'A group with this name already exists' });
        }

        await req.db.createGroup(id, name.trim(), description?.trim() || null);
        
        const newGroup = await req.db.getGroup(id);
        res.status(201).json(newGroup);
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ error: 'Failed to create group' });
    }
});

// GET /api/groups/:id - Get a specific group
router.get('/:id', async (req, res) => {
    try {
        const group = await req.db.getGroup(req.params.id);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        res.json(group);
    } catch (error) {
        console.error('Error fetching group:', error);
        res.status(500).json({ error: 'Failed to fetch group' });
    }
});

// PUT /api/groups/:id - Update a group
router.put('/:id', async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Group name is required' });
        }

        const existingGroup = await req.db.getGroup(req.params.id);
        if (!existingGroup) {
            return res.status(404).json({ error: 'Group not found' });
        }

        await req.db.updateGroup(req.params.id, name.trim(), description?.trim() || null);
        
        const updatedGroup = await req.db.getGroup(req.params.id);
        res.json(updatedGroup);
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({ error: 'Failed to update group' });
    }
});

// DELETE /api/groups/:id - Delete a group
router.delete('/:id', async (req, res) => {
    try {
        if (req.params.id === 'default') {
            return res.status(400).json({ error: 'Cannot delete the default group' });
        }

        const existingGroup = await req.db.getGroup(req.params.id);
        if (!existingGroup) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Move all configurations from this group to the default group
        await req.db.run(
            'UPDATE configurations SET group_id = ? WHERE group_id = ?',
            ['default', req.params.id]
        );

        // Delete the group
        await req.db.deleteGroup(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ error: 'Failed to delete group' });
    }
});

module.exports = router;