/**
 * Ensures that the access token has the specified delegated permissions.
 * @param {Object} accessTokenPayload: Parsed access token payload
 * @param {Array} requiredPermission: list of required permissions
 * @returns {boolean}
 */
const hasRequiredDelegatedPermissions = (accessTokenPayload, requiredPermission) => { 
    try {
        if (accessTokenPayload.hasOwnProperty('permissions')) {
            // Normalize the requiredPermission to ensure consistent comparison
            const normalizedRequiredPermission = requiredPermission.toUpperCase();
          
            // Check if the requiredPermission is included in the accessTokenPayload's permissions
            return accessTokenPayload.permissions.includes(normalizedRequiredPermission);
        }
    
        return false;
        
    } catch (error) {
        
        console.log(error)
        throw error 
    }

    
   
};

module.exports = {
    hasRequiredDelegatedPermissions
}; 