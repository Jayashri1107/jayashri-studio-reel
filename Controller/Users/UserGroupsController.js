const db = require("../../Config/db");

// Add a new user group
const AddUserGroup = async (req, res) => {
    try {
        const { name, access_permissions, modification_permissions, is_active } = req.body;

        // Validation
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Group name is required'
            });
        }

        // Check if user group already exists
        const checkQuery = 'SELECT user_group_id FROM oc_user_groups WHERE name = ?';
        db.query(checkQuery, [name], async (err, results) => {
            try {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        success: false,
                        message: `Database error occurred: ${err.message}`
                    });
                }

                if (results.length > 0) {
                    return res.status(409).json({
                        success: false,
                        message: 'A user group with this name already exists.'
                    });
                }

                // Insert user group
                const insertQuery = `
                    INSERT INTO oc_user_groups (name, access_permissions, modification_permissions, is_active, created_at)
                    VALUES (?, ?, ?, ?, NOW())
                `;

                db.query(
                    insertQuery,
                    [name, access_permissions, modification_permissions, is_active],
                    (err, result) => {
                        if (err) {
                            console.error('Database insert error:', err);
                            return res.status(500).json({
                                success: false,
                                message: `Failed to create user group: ${err.message}`
                            });
                        }

                        const userGroupId = result.insertId;

                        // Return success response
                        res.status(201).json({
                            success: true,
                            message: 'User group created successfully',
                            data: {
                                user_group_id: userGroupId,
                                name,
                                access_permissions,
                                modification_permissions,
                                is_active
                            }
                        });
                    }
                );
            } catch (error) {
                console.error('Error in AddUserGroup:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        });
    } catch (error) {
        console.error('Error in AddUserGroup:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get all user groups
const GetUserGroups = async (req, res) => {
    try {
        // Query to get user groups with user count from oc_admin_user
        const query = `
            SELECT 
                ug.*,
                COALESCE(user_counts.user_count, 0) as users
            FROM oc_user_groups ug
            LEFT JOIN (
                SELECT 
                    user_group_id,
                    COUNT(*) as user_count
                FROM oc_admin_user
                GROUP BY user_group_id
            ) as user_counts ON ug.user_group_id = user_counts.user_group_id
            ORDER BY ug.name
        `;
        
        db.query(query, (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: `Database error occurred: ${err.message}`
                });
            }

            res.status(200).json({
                success: true,
                message: 'User groups retrieved successfully',
                data: results
            });
        });
    } catch (error) {
        console.error('Error in GetUserGroups:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get a single user group by ID
const GetUserGroupById = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'User group ID is required'
            });
        }
        
        // Since we're doing hard deletes now, we don't need to filter by is_active
        const query = 'SELECT * FROM oc_user_groups WHERE user_group_id = ?';
        
        db.query(query, [id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: `Database error occurred: ${err.message}`
                });
            }
            
            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User group not found'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'User group retrieved successfully',
                data: results[0]
            });
        });
    } catch (error) {
        console.error('Error in GetUserGroupById:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Update a user group
const UpdateUserGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, access_permissions, modification_permissions, is_active } = req.body;
        
        // Validation
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'User group ID is required'
            });
        }
        
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Group name is required'
            });
        }
        
        // Check if user group exists
        const checkQuery = 'SELECT user_group_id FROM oc_user_groups WHERE user_group_id = ?';
        db.query(checkQuery, [id], async (err, results) => {
            try {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        success: false,
                        message: `Database error occurred: ${err.message}`
                    });
                }
                
                if (results.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'User group not found'
                    });
                }
                
                // Update user group
                const updateQuery = `
                    UPDATE oc_user_groups 
                    SET name = ?, access_permissions = ?, modification_permissions = ?, is_active = ?
                    WHERE user_group_id = ?
                `;
                
                db.query(
                    updateQuery,
                    [name, access_permissions, modification_permissions, is_active, id],
                    (err, result) => {
                        if (err) {
                            console.error('Database update error:', err);
                            return res.status(500).json({
                                success: false,
                                message: `Failed to update user group: ${err.message}`
                            });
                        }
                        
                        // Return success response
                        res.status(200).json({
                            success: true,
                            message: 'User group updated successfully',
                            data: {
                                user_group_id: id,
                                name,
                                access_permissions,
                                modification_permissions,
                                is_active
                            }
                        });
                    }
                );
            } catch (error) {
                console.error('Error in UpdateUserGroup:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        });
    } catch (error) {
        console.error('Error in UpdateUserGroup:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Delete a user group (hard delete - remove from database)
const DeleteUserGroup = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validation
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'User group ID is required'
            });
        }
        
        // Check if user group exists
        const checkQuery = 'SELECT user_group_id FROM oc_user_groups WHERE user_group_id = ?';
        db.query(checkQuery, [id], async (err, results) => {
            try {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        success: false,
                        message: `Database error occurred: ${err.message}`
                    });
                }
                
                if (results.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'User group not found'
                    });
                }
                
                // Hard delete user group (remove from database)
                const deleteQuery = 'DELETE FROM oc_user_groups WHERE user_group_id = ?';
                
                db.query(deleteQuery, [id], (err, result) => {
                    if (err) {
                        console.error('Database delete error:', err);
                        return res.status(500).json({
                            success: false,
                            message: `Failed to delete user group: ${err.message}`
                        });
                    }
                    
                    // Return success response
                    res.status(200).json({
                        success: true,
                        message: 'User group deleted successfully'
                    });
                });
            } catch (error) {
                console.error('Error in DeleteUserGroup:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        });
    } catch (error) {
        console.error('Error in DeleteUserGroup:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Delete multiple user groups (hard delete - remove from database)
const DeleteUserGroups = async (req, res) => {
    try {
        const { user_group_ids } = req.body;
        
        console.log('DeleteUserGroups called with IDs:', user_group_ids);
        
        // Validation
        if (!user_group_ids || !Array.isArray(user_group_ids) || user_group_ids.length === 0) {
            console.log('Validation failed: No user_group_ids provided or invalid format');
            return res.status(400).json({
                success: false,
                message: 'User group IDs are required'
            });
        }
        
        // Convert IDs to numbers and filter out invalid ones
        const ids = user_group_ids.map(id => parseInt(id)).filter(id => !isNaN(id));
        
        if (ids.length === 0) {
            console.log('Validation failed: No valid user_group_ids after parsing');
            return res.status(400).json({
                success: false,
                message: 'Invalid user group IDs provided'
            });
        }
        
        console.log('Valid IDs to delete:', ids);
        
        // Create placeholders for the query
        const placeholders = ids.map(() => '?').join(',');
        const query = `DELETE FROM oc_user_groups WHERE user_group_id IN (${placeholders})`;
        
        console.log('Executing query:', query, 'with params:', ids);
        
        db.query(query, ids, (err, result) => {
            if (err) {
                console.error('Database delete error:', err);
                return res.status(500).json({
                    success: false,
                    message: `Failed to delete user groups: ${err.message}`
                });
            }
            
            console.log('Delete query result:', result);
            
            // Return success response
            res.status(200).json({
                success: true,
                message: `${result.affectedRows} user group(s) deleted successfully`
            });
        });
    } catch (error) {
        console.error('Error in DeleteUserGroups:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    AddUserGroup,
    GetUserGroups,
    GetUserGroupById,
    UpdateUserGroup,
    DeleteUserGroup,
    DeleteUserGroups
};