const express = require('express');
const router = express.Router();

/**
 * GET /api/templates
 * Get all community templates with pagination and filtering
 */
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            category,
            author,
            featured,
            sort = 'recent' // recent, popular, likes
        } = req.query;

        const offset = (page - 1) * limit;
        let whereClause = 'WHERE is_public = 1';
        let orderClause = 'ORDER BY created_at DESC';
        const params = [];

        // Add filters
        if (category) {
            whereClause += ' AND category = ?';
            params.push(category);
        }

        if (author) {
            whereClause += ' AND author_username = ?';
            params.push(author);
        }

        if (featured) {
            whereClause += ' AND is_featured = 1';
        }

        // Set sort order
        switch (sort) {
            case 'popular':
                orderClause = 'ORDER BY view_count DESC, created_at DESC';
                break;
            case 'likes':
                orderClause = 'ORDER BY like_count DESC, created_at DESC';
                break;
            case 'recent':
            default:
                orderClause = 'ORDER BY created_at DESC';
        }

        const sql = `
            SELECT 
                id, title, description, emoji, category, filename,
                author_name, author_username, author_avatar_url, author_profile_url,
                like_count, view_count, created_at, updated_at, is_featured
            FROM community_templates 
            ${whereClause} 
            ${orderClause} 
            LIMIT ? OFFSET ?
        `;

        params.push(parseInt(limit), parseInt(offset));

        const templates = await req.db.all(sql, params);

        // Get total count for pagination
        const countSql = `SELECT COUNT(*) as total FROM community_templates ${whereClause}`;
        const countParams = params.slice(0, -2); // Remove limit and offset
        const countResult = await req.db.get(countSql, countParams);

        res.json({
            templates,
            pagination: {
                current_page: parseInt(page),
                per_page: parseInt(limit),
                total: countResult.total,
                total_pages: Math.ceil(countResult.total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/templates/:id
 * Get a specific template with full YAML content
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const template = await req.db.get(`
            SELECT * FROM community_templates 
            WHERE id = ? AND is_public = 1
        `, [id]);

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Increment view count
        await req.db.run(`
            UPDATE community_templates 
            SET view_count = view_count + 1 
            WHERE id = ?
        `, [id]);

        // Log analytics
        await req.db.run(`
            INSERT INTO config_analytics (template_id, action, user_id, ip_address, user_agent)
            VALUES (?, 'view', ?, ?, ?)
        `, [id, req.user?.id || null, req.ip, req.get('User-Agent')]);

        res.json(template);

    } catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/templates
 * Create a new community template
 */
router.post('/', async (req, res) => {
    try {
        const {
            title,
            description,
            emoji = '📝',
            category,
            yaml_content,
            filename = 'dstack.yml',
            author
        } = req.body;
        
        console.log('🔍 DEBUG: Received request body like_count:', req.body.like_count);
        console.log('🔍 DEBUG: Received request body view_count:', req.body.view_count);

        // Validation
        if (!title || !yaml_content) {
            return res.status(400).json({ 
                error: 'Title and YAML content are required' 
            });
        }

        if (!author || !author.id) {
            return res.status(401).json({ 
                error: 'Authentication required' 
            });
        }

        // Generate content hash for duplicate detection
        const crypto = require('crypto');
        const normalizedContent = yaml_content.trim().replace(/\s+/g, ' ');
        const normalizedTitle = title.trim().toLowerCase();
        const combined = `${normalizedTitle}:${normalizedContent}`;
        const contentHash = crypto.createHash('sha256').update(combined).digest('hex');

        // Check for duplicates
        const existing = await req.db.get(`
            SELECT id, title FROM community_templates 
            WHERE content_hash = ?
        `, [contentHash]);

        if (existing) {
            return res.status(409).json({ 
                error: 'Duplicate template',
                message: `A template with the title "${existing.title}" and identical content already exists`,
                existing_id: existing.id
            });
        }

        // Insert new template
        const result = await req.db.run(`
            INSERT INTO community_templates (
                title, description, emoji, category, yaml_content, filename,
                author_id, author_name, author_username, author_avatar_url, author_profile_url,
                content_hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            title, description, emoji, category, yaml_content, filename,
            author.id, author.name, author.username, author.avatar_url, author.profile_url,
            contentHash
        ]);

        // Log analytics
        await req.db.run(`
            INSERT INTO config_analytics (template_id, action, user_id, ip_address, user_agent)
            VALUES (?, 'share', ?, ?, ?)
        `, [result.id, author.id, req.ip, req.get('User-Agent')]);

        // Return the created template
        const newTemplate = await req.db.get(`
            SELECT * FROM community_templates WHERE id = ?
        `, [result.id]);

        res.status(201).json(newTemplate);

    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/templates/:id/like
 * Like/unlike a template
 */
router.post('/:id/like', async (req, res) => {
    try {
        const { id } = req.params;
        const { user } = req.body;

        if (!user || !user.id) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Check if template exists
        const template = await req.db.get(`
            SELECT id FROM community_templates WHERE id = ? AND is_public = 1
        `, [id]);

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Check if user already liked this template
        const existingLike = await req.db.get(`
            SELECT id FROM template_likes WHERE template_id = ? AND user_id = ?
        `, [id, user.id]);

        if (existingLike) {
            // Unlike - remove the like
            await req.db.run(`
                DELETE FROM template_likes WHERE template_id = ? AND user_id = ?
            `, [id, user.id]);

            // Log analytics
            await req.db.run(`
                INSERT INTO config_analytics (template_id, action, user_id, ip_address, user_agent)
                VALUES (?, 'unlike', ?, ?, ?)
            `, [id, user.id, req.ip, req.get('User-Agent')]);

            res.json({ liked: false, message: 'Template unliked' });
        } else {
            // Like - add the like
            await req.db.run(`
                INSERT INTO template_likes (template_id, user_id, user_name, user_username)
                VALUES (?, ?, ?, ?)
            `, [id, user.id, user.name, user.username]);

            // Log analytics
            await req.db.run(`
                INSERT INTO config_analytics (template_id, action, user_id, ip_address, user_agent)
                VALUES (?, 'like', ?, ?, ?)
            `, [id, user.id, req.ip, req.get('User-Agent')]);

            res.json({ liked: true, message: 'Template liked' });
        }

    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/templates/:id/likes
 * Get like status and count for a template
 */
router.get('/:id/likes', async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.query;

        // Get like count and user's like status
        const template = await req.db.get(`
            SELECT like_count FROM community_templates WHERE id = ?
        `, [id]);

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        let isLiked = false;
        if (user_id) {
            const userLike = await req.db.get(`
                SELECT id FROM template_likes WHERE template_id = ? AND user_id = ?
            `, [id, user_id]);
            isLiked = !!userLike;
        }

        res.json({
            like_count: template.like_count,
            is_liked: isLiked
        });

    } catch (error) {
        console.error('Error fetching likes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/templates/:id
 * Delete a template (only by author or admin)
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { user } = req.body;

        if (!user || !user.id) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Check if template exists and user is the author
        const template = await req.db.get(`
            SELECT author_id FROM community_templates WHERE id = ?
        `, [id]);

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Convert both to strings for comparison (GitHub user.id is number, DB author_id is string)
        if (template.author_id !== user.id.toString()) {
            return res.status(403).json({ error: 'Not authorized to delete this template' });
        }

        // Delete the template (cascade will handle related records)
        await req.db.run(`
            DELETE FROM community_templates WHERE id = ?
        `, [id]);

        res.json({ message: 'Template deleted successfully' });

    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/templates/stats/overview
 * Get database statistics
 */
router.get('/stats/overview', async (req, res) => {
    try {
        const stats = {};

        // Total templates
        const totalResult = await req.db.get(`
            SELECT COUNT(*) as count FROM community_templates WHERE is_public = 1
        `);
        stats.total_templates = totalResult.count;

        // Total likes
        const likesResult = await req.db.get(`
            SELECT SUM(like_count) as count FROM community_templates WHERE is_public = 1
        `);
        stats.total_likes = likesResult.count || 0;

        // Total views
        const viewsResult = await req.db.get(`
            SELECT SUM(view_count) as count FROM community_templates WHERE is_public = 1
        `);
        stats.total_views = viewsResult.count || 0;

        // Templates by category
        const categoryStats = await req.db.all(`
            SELECT category, COUNT(*) as count 
            FROM community_templates 
            WHERE is_public = 1 AND category IS NOT NULL 
            GROUP BY category 
            ORDER BY count DESC
        `);
        stats.by_category = categoryStats;

        // Recent activity (last 7 days)
        const recentActivity = await req.db.get(`
            SELECT COUNT(*) as count 
            FROM community_templates 
            WHERE is_public = 1 AND created_at >= datetime('now', '-7 days')
        `);
        stats.recent_activity = recentActivity.count;

        res.json(stats);

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;