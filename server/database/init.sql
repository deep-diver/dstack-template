-- Initialize SQLite database for dstack configuration templates

-- Community templates table
CREATE TABLE IF NOT EXISTS community_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    emoji VARCHAR(10) DEFAULT '📝',
    category VARCHAR(100),
    yaml_content TEXT NOT NULL,
    filename VARCHAR(255) DEFAULT 'dstack.yml',
    author_id VARCHAR(255),
    author_name VARCHAR(255),
    author_username VARCHAR(255),
    author_avatar_url TEXT,
    author_profile_url TEXT,
    like_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    content_hash VARCHAR(64) NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    tags TEXT, -- JSON array of tags
    UNIQUE(title, content_hash) -- Prevent exact duplicates
);

-- Template likes table (for tracking individual likes)
CREATE TABLE IF NOT EXISTS template_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    user_username VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES community_templates(id) ON DELETE CASCADE,
    UNIQUE(template_id, user_id) -- One like per user per template
);

-- User configurations metadata table
CREATE TABLE IF NOT EXISTS user_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_hash VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    emoji VARCHAR(10) DEFAULT '📝',
    category VARCHAR(100),
    user_id VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Configuration usage analytics
CREATE TABLE IF NOT EXISTS config_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER,
    config_hash VARCHAR(64),
    action VARCHAR(50) NOT NULL, -- 'view', 'copy', 'download', 'like', 'share'
    user_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES community_templates(id) ON DELETE SET NULL
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_templates_category ON community_templates(category);
CREATE INDEX IF NOT EXISTS idx_community_templates_author ON community_templates(author_id);
CREATE INDEX IF NOT EXISTS idx_community_templates_created ON community_templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_templates_likes ON community_templates(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_community_templates_featured ON community_templates(is_featured, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_template_likes_template ON template_likes(template_id);
CREATE INDEX IF NOT EXISTS idx_template_likes_user ON template_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_configs_hash ON user_configs(config_hash);
CREATE INDEX IF NOT EXISTS idx_user_configs_user ON user_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_template ON config_analytics(template_id);
CREATE INDEX IF NOT EXISTS idx_analytics_action ON config_analytics(action);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON config_analytics(created_at DESC);

-- Triggers to update like_count automatically
CREATE TRIGGER IF NOT EXISTS update_like_count_on_insert
AFTER INSERT ON template_likes
BEGIN
    UPDATE community_templates 
    SET like_count = (
        SELECT COUNT(*) FROM template_likes WHERE template_id = NEW.template_id
    )
    WHERE id = NEW.template_id;
END;

CREATE TRIGGER IF NOT EXISTS update_like_count_on_delete
AFTER DELETE ON template_likes
BEGIN
    UPDATE community_templates 
    SET like_count = (
        SELECT COUNT(*) FROM template_likes WHERE template_id = OLD.template_id
    )
    WHERE id = OLD.template_id;
END;

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_community_templates_timestamp
AFTER UPDATE ON community_templates
BEGIN
    UPDATE community_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_user_configs_timestamp
AFTER UPDATE ON user_configs
BEGIN
    UPDATE user_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;