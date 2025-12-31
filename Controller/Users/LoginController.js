const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../Config/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../Config/globle');

// Login function
const Login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email/Username and password are required'
            });
        }

        // Query user from database - Check for both email and username (status checked later)
        const query = 'SELECT * FROM oc_admin_user WHERE (email = ? OR username = ?)';
        db.query(query, [identifier, identifier], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found. Please check your email/username.'
                });
            }

            const user = results[0];

            // Check inactive status explicitly
            if (!user.status || Number(user.status) !== 1) {
                return res.status(403).json({
                    success: false,
                    message: 'You are inactive'
                });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid password. Please check your password.'
                });
            }

            // Update last login
            db.query('UPDATE oc_admin_user SET date_added = NOW() WHERE user_id = ?', [user.user_id]);

            // Generate JWT token with user's role
            const token = jwt.sign(
                {
                    id: user.user_id,
                    email: user.email,
                    role: user.user_group_id,
                    firstName: user.firstname,
                    lastName: user.lastname
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            // Return user data (without password)
            res.json({
                success: true,
                message: 'Login successful',
                token: token,
                user: {
                    id: user.user_id,
                    email: user.email,
                    role: user.user_group_id,
                    firstName: user.firstname,
                    lastName: user.lastname,
                    phone: user.telephone
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Signup function
const Signup = async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, phone } = req.body;

        // Validation
        if (!username || !email || !password || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'Username, email, password, first name, and last name are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Check if user already exists
        const checkQuery = 'SELECT user_id as id, user_group_id as role FROM oc_admin_user WHERE email = ? OR username = ?';
        db.query(checkQuery, [email, username], async (err, results) => {
            try {
                if (err) {
                    console.error('Database error:', err);
                    console.error('Error code:', err.code);
                    console.error('Error SQL:', err.sql);
                    return res.status(500).json({
                        success: false,
                        message: err.code === 'ER_NO_SUCH_TABLE' 
                            ? 'Database table not found. Please ensure the oc_admin_user table exists.'
                            : `Database error occurred: ${err.message}`
                    });
                }

                if (results.length > 0) {
                    return res.status(409).json({
                        success: false,
                        message: 'An account with this email or username already exists. Please login instead.'
                    });
                }

                // Hash password
                const saltRounds = 10;
                const passwordHash = await bcrypt.hash(password, saltRounds);

                // Insert user with ADMIN role only
                const role = 1; // Assuming 1 is the admin user group ID
                const insertQuery = `
                    INSERT INTO oc_admin_user (username, firstname, lastname, email, telephone, password, salt, status, date_added, user_group_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
                `;

                // Generate a random salt for the user
                const salt = Math.random().toString(36).substring(2, 12);

                db.query(
                    insertQuery,
                    [username, firstName, lastName, email, phone || null, passwordHash, salt, 1, role],
                    (err, result) => {
                        if (err) {
                            console.error('Database insert error:', err);
                            console.error('Error code:', err.code);
                            console.error('Error SQL:', err.sql);
                            return res.status(500).json({
                                success: false,
                                message: err.code === 'ER_NO_SUCH_TABLE' 
                                    ? 'Database table not found. Please ensure the oc_admin_user table exists.'
                                    : err.code === 'ER_DUP_ENTRY'
                                    ? 'An account with this email already exists.'
                                    : `Failed to create user account: ${err.message}`
                            });
                        }

                        const userId = result.insertId;

                        // Generate JWT token
                        const token = jwt.sign(
                            {
                                id: userId,
                                email: email,
                                role: role,
                                firstName: firstName,
                                lastName: lastName
                            },
                            JWT_SECRET,
                            { expiresIn: JWT_EXPIRES_IN }
                        );

                        // Return success response
                        res.status(201).json({
                            success: true,
                            message: 'Account created successfully',
                            token: token,
                            user: {
                                id: userId,
                                email: email,
                                role: role,
                                firstName: firstName,
                                lastName: lastName,
                                phone: phone || null
                            }
                        });
                    }
                );
            } catch (error) {
                console.error('Signup callback error:', error);
                return res.status(500).json({
                    success: false,
                    message: `Signup error: ${error.message}`
                });
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Logout function
const Logout = async (req, res) => {
    try {
        // In a stateless JWT system, logout is handled client-side by removing the token
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get current user info
const GetCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id;

        const ensureImageColumn = `SHOW COLUMNS FROM oc_admin_user LIKE 'image'`;
        db.query(ensureImageColumn, [], (colErr, colRes) => {
            if (colErr) {
                console.error('Error checking image column:', colErr);
                return res.status(500).json({ success: false, message: 'Database error occurred' });
            }
            const hasImage = Array.isArray(colRes) && colRes.length > 0;
            const addColumnIfMissing = hasImage
                ? Promise.resolve()
                : new Promise((resolve, reject) => {
                    const alter = `ALTER TABLE oc_admin_user ADD COLUMN image VARCHAR(255) NULL`;
                    db.query(alter, [], (alterErr) => {
                        if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') {
                            console.error('Error adding image column:', alterErr);
                            reject(alterErr);
                        } else {
                            resolve();
                        }
                    });
                });
            
            addColumnIfMissing.then(() => {
                const query = `
                    SELECT u.user_id as id, u.email, u.user_group_id as role, u.firstname as first_name, u.lastname as last_name, u.telephone as phone, u.status as is_active, u.image, u.username
                    FROM oc_admin_user u
                    WHERE u.user_id = ?
                `;
                db.query(query, [userId], (err, results) => {
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
                    
                    const user = results[0];
                    res.json({
                        success: true,
                        user: {
                            id: user.id,
                            email: user.email,
                            role: user.role,
                            firstName: user.first_name,
                            lastName: user.last_name,
                            username: user.username,
                            phone: user.phone,
                            isActive: user.is_active,
                            image: user.image || null
                        }
                    });
                });
            }).catch(() => {
                return res.status(500).json({ success: false, message: 'Database error occurred' });
            });
        });
    } catch (error) {
        console.error('GetCurrentUser error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update current user's profile
const UpdateMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { firstName, lastName, email, mobile } = req.body;

        const fields = [];
        const params = [];
        if (firstName !== undefined) { fields.push('firstname = ?'); params.push(firstName); }
        if (lastName !== undefined) { fields.push('lastname = ?'); params.push(lastName); }
        if (email !== undefined) { fields.push('email = ?'); params.push(email); }
        if (mobile !== undefined) { fields.push('telephone = ?'); params.push(mobile); }

        if (fields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }
        const query = `UPDATE oc_admin_user SET ${fields.join(', ')} WHERE user_id = ?`;
        params.push(userId);
        db.query(query, params, (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Database error: ' + err.message });
            }
            return res.json({ success: true, message: 'Profile updated' });
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Change password with current password verification
const ChangePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
        }
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
        if (!strongRegex.test(newPassword)) {
            return res.status(400).json({ success: false, message: 'Password must be 8+ chars and include upper, lower, number, special character' });
        }
        const q = 'SELECT password FROM oc_admin_user WHERE user_id = ?';
        db.query(q, [userId], async (err, results) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Database error: ' + err.message });
            }
            if (!results.length) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            const storedHash = results[0].password;
            const match = await bcrypt.compare(currentPassword, storedHash);
            if (!match) {
                return res.status(401).json({ success: false, message: 'Current password is incorrect' });
            }
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(newPassword, saltRounds);
            const salt = Math.random().toString(36).substring(2, 12);
            const uq = 'UPDATE oc_admin_user SET password = ?, salt = ? WHERE user_id = ?';
            db.query(uq, [passwordHash, salt, userId], (uErr) => {
                if (uErr) {
                    return res.status(500).json({ success: false, message: 'Failed to update password: ' + uErr.message });
                }
                return res.json({ success: true, message: 'Password updated successfully' });
            });
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Add new user function
const AddUser = async (req, res) => {
    try {
        const { username, userGroup, firstName, lastName, email, mobile, password, status } = req.body;

        // Validation
        if (!username || !userGroup || !firstName || !lastName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, user group, first name, last name, email, and password are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
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
                        message: `Database error occurred: ${err.message}`
                    });
                }

                if (results.length > 0) {
                    return res.status(409).json({
                        success: false,
                        message: 'A user with this email or username already exists.'
                    });
                }

                // Hash password
                const saltRounds = 10;
                const passwordHash = await bcrypt.hash(password, saltRounds);
                
                // Generate a random salt for the user
                const salt = Math.random().toString(36).substring(2, 12);

                // Insert user - matching the actual table structure
                const isActive = status === 'Active' ? 1 : 0;
                const insertQuery = `
                    INSERT INTO oc_admin_user (username, firstname, lastname, email, telephone, password, salt, status, date_added, user_group_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
                `;

                db.query(
                    insertQuery,
                    [username, firstName, lastName, email, mobile || null, passwordHash, salt, isActive, userGroup],
                    (err, result) => {
                        if (err) {
                            console.error('Database insert error:', err);
                            return res.status(500).json({
                                success: false,
                                message: `Failed to create user account: ${err.message}`
                            });
                        }

                        const userId = result.insertId;

                        // Return success response
                        res.status(201).json({
                            success: true,
                            message: 'User created successfully',
                            user: {
                                id: userId,
                                username: username,
                                email: email,
                                firstName: firstName,
                                lastName: lastName,
                                phone: mobile || null,
                                isActive: isActive
                            }
                        });
                    }
                );
            } catch (error) {
                console.error('AddUser callback error:', error);
                return res.status(500).json({
                    success: false,
                    message: `Add user error: ${error.message}`
                });
            }
        });
    } catch (error) {
        console.error('AddUser error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all users
const GetAllUsers = async (req, res) => {
    try {
        console.log('GetAllUsers called');
        
        const query = `
            SELECT user_id, username, email, firstname, lastname, telephone, status, user_group_id
            FROM oc_admin_user
            ORDER BY user_id DESC
        `;

        console.log('Executing query:', query);
        
        db.query(query, (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred: ' + err.message
                });
            }
            
            console.log('Query results:', results.length, 'users found');
            
            res.json({
                success: true,
                users: results
            });
        });
    } catch (error) {
        console.error('GetAllUsers error:', error);
        res.status(500).json({
            success: false,
            message: error.message
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

        const query = `
            SELECT user_id, username, email, firstname, lastname, telephone, status, user_group_id
            FROM oc_admin_user
            WHERE user_id = ?
        `;

        db.query(query, [id], (err, results) => {
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
                    message: 'User not found'
                });
            }
            
            res.json({
                success: true,
                user: results[0]
            });
        });
    } catch (error) {
        console.error('GetUserById error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update user
const UpdateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, userGroup, firstName, lastName, email, mobile, status, password } = req.body;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        // Build update query dynamically
        let query = 'UPDATE oc_admin_user SET ';
        const queryParams = [];
        const fieldsToUpdate = [];
        
        // Add fields to update if they are provided
        if (username !== undefined) {
            fieldsToUpdate.push('username = ?');
            queryParams.push(username);
        }
        
        if (userGroup !== undefined) {
            fieldsToUpdate.push('user_group_id = ?');
            queryParams.push(userGroup);
        }
        
        if (firstName !== undefined) {
            fieldsToUpdate.push('firstname = ?');
            queryParams.push(firstName);
        }
        
        if (lastName !== undefined) {
            fieldsToUpdate.push('lastname = ?');
            queryParams.push(lastName);
        }
        
        if (email !== undefined) {
            fieldsToUpdate.push('email = ?');
            queryParams.push(email);
        }
        
        if (mobile !== undefined) {
            fieldsToUpdate.push('telephone = ?');
            queryParams.push(mobile);
        }
        
        if (status !== undefined) {
            fieldsToUpdate.push('status = ?');
            queryParams.push(status === 'Active' ? 1 : 0);
        }
        
        // Handle password update
        if (password) {
            const bcrypt = require('bcrypt');
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);
            
            fieldsToUpdate.push('password = ?');
            queryParams.push(passwordHash);
            
            // Also update the salt
            const salt = Math.random().toString(36).substring(2, 12);
            fieldsToUpdate.push('salt = ?');
            queryParams.push(salt);
        }
        
        // If no fields to update
        if (fieldsToUpdate.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }
        
        // Complete the query
        query += fieldsToUpdate.join(', ') + ' WHERE user_id = ?';
        queryParams.push(id);
        
        console.log('Update query:', query);
        console.log('Query params:', queryParams);
        
        db.query(query, queryParams, (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred: ' + err.message
                });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            res.json({
                success: true,
                message: 'User updated successfully'
            });
        });
    } catch (error) {
        console.error('UpdateUser error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



module.exports = {
    Login,
    Signup,
    Logout,
    GetCurrentUser,
    AddUser,
    GetAllUsers,
    GetUserById,
    UpdateUser,
    UpdateMyProfile,
    ChangePassword
};
