// API Module for backend communication

const API_BASE_URL = window.location.origin + '/api';

class ApiClient {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options,
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            // Handle 204 No Content responses
            if (response.status === 204) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error(`API request failed: ${config.method || 'GET'} ${url}`, error);
            throw error;
        }
    }

    // Groups API
    async getGroups() {
        return await this.request('/groups');
    }

    async createGroup(groupData) {
        return await this.request('/groups', {
            method: 'POST',
            body: groupData,
        });
    }

    async getGroup(id) {
        return await this.request(`/groups/${id}`);
    }

    async updateGroup(id, groupData) {
        return await this.request(`/groups/${id}`, {
            method: 'PUT',
            body: groupData,
        });
    }

    async deleteGroup(id) {
        return await this.request(`/groups/${id}`, {
            method: 'DELETE',
        });
    }

    // Templates API
    async getTemplates() {
        return await this.request('/templates');
    }

    async getTemplate(id) {
        return await this.request(`/templates/${id}`);
    }

    // Configurations API
    async getConfigurations(groupId = null) {
        const query = groupId ? `?group_id=${groupId}` : '';
        return await this.request(`/configurations${query}`);
    }

    async getConfigurationsWithGroups() {
        return await this.request('/configurations/with-groups');
    }

    async createConfiguration(configData) {
        return await this.request('/configurations', {
            method: 'POST',
            body: configData,
        });
    }

    async copyTemplate(copyData) {
        return await this.request('/configurations/copy-template', {
            method: 'POST',
            body: copyData,
        });
    }

    async getConfiguration(id) {
        return await this.request(`/configurations/${id}`);
    }

    async updateConfiguration(id, configData) {
        return await this.request(`/configurations/${id}`, {
            method: 'PUT',
            body: configData,
        });
    }

    async deleteConfiguration(id) {
        return await this.request(`/configurations/${id}`, {
            method: 'DELETE',
        });
    }

    // System API
    async getHealth() {
        return await this.request('/health');
    }
}

// Create global API client instance
window.apiClient = new ApiClient();

// Export for module use
window.api = {
    client: window.apiClient,
    // Convenience methods
    groups: {
        getAll: () => window.apiClient.getGroups(),
        create: (data) => window.apiClient.createGroup(data),
        get: (id) => window.apiClient.getGroup(id),
        update: (id, data) => window.apiClient.updateGroup(id, data),
        delete: (id) => window.apiClient.deleteGroup(id),
    },
    templates: {
        getAll: () => window.apiClient.getTemplates(),
        get: (id) => window.apiClient.getTemplate(id),
    },
    configurations: {
        getAll: (groupId) => window.apiClient.getConfigurations(groupId),
        getAllWithGroups: () => window.apiClient.getConfigurationsWithGroups(),
        create: (data) => window.apiClient.createConfiguration(data),
        copyTemplate: (data) => window.apiClient.copyTemplate(data),
        get: (id) => window.apiClient.getConfiguration(id),
        update: (id, data) => window.apiClient.updateConfiguration(id, data),
        delete: (id) => window.apiClient.deleteConfiguration(id),
    },
    system: {
        health: () => window.apiClient.getHealth(),
    },
};

console.log('API client initialized');