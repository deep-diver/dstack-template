// Utility Functions Module

/**
 * Sets a value in a nested object based on a path string.
 */
const setNestedValue = (obj, path, value) => {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const nextKey = keys[i + 1];
        if (!isNaN(parseInt(nextKey, 10)) && !Array.isArray(current[key])) {
             current[key] = [];
        } else if (isNaN(parseInt(nextKey, 10)) && typeof current[key] !== 'object') {
             current[key] = {};
        }
        current = current[key];
    }
    current[keys[keys.length - 1]] = value;
};

 /**
 * Deletes a key or an array element from a nested object.
 */
const deleteNestedValue = (obj, path) => {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
    }
    const finalKey = keys[keys.length - 1];
    if (Array.isArray(current)) {
        current.splice(parseInt(finalKey, 10), 1);
    } else {
        delete current[finalKey];
    }
};

// Export functions
window.utils = {
    setNestedValue,
    deleteNestedValue
};