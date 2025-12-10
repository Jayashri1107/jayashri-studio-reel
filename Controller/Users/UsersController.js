const db = require('../../Config/db');

// Get all users
const GetAllUsers = async (req, res) => {
    try {
        const query = 'SELECT user_id, username, firstname, lastname, email, telephone, status, date_added, user_group_id FROM oc_admin_user ORDER BY date_added DESC';
        
        db.query(query, (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Users retrieved successfully',
                data: results
            });
        });
    } catch (error) {
        console.error('Error in GetAllUsers:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Add a new user
const AddUser = async (req, res) => {
    try {
        const { username, firstname, lastname, email, telephone, password, user_group_id } = req.body;

        // Validation
        if (!username || !firstname || !lastname || !email || !password || !user_group_id) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if user already exists
        const checkQuery = 'SELECT user_id FROM oc_admin_user WHERE email = ? OR username = ?';
        db.query(checkQuery, [email, username], async (err, results) => {
            try {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error occurred'
                    });
                }

                if (results.length > 0) {
                    return res.status(409).json({
                        success: false,
                        message: 'A user with this email or username already exists.'
                    });
                }

                // TODO: Hash password before storing
                // For now, we'll store it as-is (this should be improved for security)
                const insertQuery = `
                    INSERT INTO oc_admin_user (username, firstname, lastname, email, telephone, password, salt, status, date_added, user_group_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), ?)
                `;

                // Generate a random salt for the user
                const salt = Math.random().toString(36).substring(2, 12);

                db.query(
                    insertQuery,
                    [username, firstname, lastname, email, telephone || null, password, salt, user_group_id],
                    (err, result) => {
                        if (err) {
                            console.error('Database insert error:', err);
                            return res.status(500).json({
                                success: false,
                                message: `Failed to create user: ${err.message}`
                            });
                        }

                        const userId = result.insertId;

                        // Return success response
                        res.status(201).json({
                            success: true,
                            message: 'User created successfully',
                            data: {
                                user_id: userId,
                                username,
                                firstname,
                                lastname,
                                email,
                                telephone,
                                user_group_id
                            }
                        });
                    }
                );
            } catch (error) {
                console.error('Error in AddUser:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        });
    } catch (error) {
        console.error('Error in AddUser:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get user by ID
const GetUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        const query = 'SELECT user_id, username, firstname, lastname, email, telephone, status, date_added, user_group_id FROM oc_admin_user WHERE user_id = ?';
        
        db.query(query, [id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
            }
            
            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'User retrieved successfully',
                data: results[0]
            });
        });
    } catch (error) {
        console.error('Error in GetUserById:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Update user
const UpdateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, firstname, lastname, email, telephone, user_group_id, status } = req.body;
        
        // Validation
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        // Check if user exists
        const checkQuery = 'SELECT user_id FROM oc_admin_user WHERE user_id = ?';
        db.query(checkQuery, [id], async (err, results) => {
            try {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error occurred'
                    });
                }
                
                if (results.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'User not found'
                    });
                }
                
                // Update user
                const updateQuery = `
                    UPDATE oc_admin_user 
                    SET username = ?, firstname = ?, lastname = ?, email = ?, telephone = ?, user_group_id = ?, status = ?
                    WHERE user_id = ?
                `;
                
                db.query(
                    updateQuery,
                    [username, firstname, lastname, email, telephone || null, user_group_id, status, id],
                    (err, result) => {
                        if (err) {
                            console.error('Database update error:', err);
                            return res.status(500).json({
                                success: false,
                                message: `Failed to update user: ${err.message}`
                            });
                        }

                        // Return success response
                        res.status(200).json({
                            success: true,
                            message: 'User updated successfully',
                            data: {
                                user_id: id,
                                username,
                                firstname,
                                lastname,
                                email,
                                telephone,
                                user_group_id,
                                status
                            }
                        });
                    }
                );
            } catch (error) {
                console.error('Error in UpdateUser:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error'
                });
            }
        });
    } catch (error) {
        console.error('Error in UpdateUser:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get user group permissions
const GetUserGroupPermissions = async (req, res) => {
    try {
        const { groupId } = req.params;
        
        if (!groupId) {
            return res.status(400).json({
                success: false,
                message: 'Group ID is required'
            });
        }
        
        // Convert groupId to integer if it's a string
        const groupIdInt = parseInt(groupId, 10);
        if (isNaN(groupIdInt)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Group ID format'
            });
        }

        const query = 'SELECT * FROM oc_user_groups WHERE user_group_id = ?';

        db.query(query, [groupIdInt], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred: ' + err.message
                });
            }
            
            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User group not found'
                });
            }
            
            const group = results[0];
            
            // Parse JSON strings to arrays with error handling
            let accessPermissions = [];
            let modificationPermissions = [];
            
            try {
                accessPermissions = JSON.parse(group.access_permissions || '[]');
            } catch (parseError) {
                console.error('Error parsing access_permissions:', parseError);
                accessPermissions = [];
            }
            
            try {
                modificationPermissions = JSON.parse(group.modification_permissions || '[]');
            } catch (parseError) {
                console.error('Error parsing modification_permissions:', parseError);
                modificationPermissions = [];
            }
            
            res.json({
                success: true,
                group: {
                    id: group.user_group_id,
                    name: group.name,
                    accessPermissions,
                    modificationPermissions,
                    isActive: group.is_active
                }
            });
        });
    } catch (error) {
        console.error('GetUserGroupPermissions error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    GetAllUsers,
    AddUser,
    GetUserById,
    UpdateUser,
    GetUserGroupPermissions
};
