const dbSagar = require('../../Config/db_sagar'); // sagar database (oc_vendor table)
const db = require('../../Config/db'); // reels-ipshopy database for pending approvals

// Submit seller registration for approval
const SubmitRegistration = async (req, res) => {
    try {
        console.log('Seller registration request received:', req.body);
        const { firstName, lastName, email, mobile } = req.body;

        // Validation
        if (!email || !mobile || !firstName || !lastName) {
            console.log('Validation failed - missing fields');
            return res.status(400).json({
                success: false,
                message: 'First name, last name, email, and mobile number are required'
            });
        }

        // Check if seller already exists in oc_vendor table
        const checkVendorQuery = 'SELECT vendor_id, email, approved, firstname, lastname FROM oc_vendor WHERE email = ?';
        console.log('Checking vendor with email:', email);
        dbSagar.query(checkVendorQuery, [email], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                console.error('Error code:', err.code);
                console.error('Error message:', err.message);
                return res.status(500).json({
                    success: false,
                    message: `Database error occurred: ${err.message}`
                });
            }
            
            console.log('Vendor query results:', results);

            if (results.length > 0) {
                const existingSeller = results[0];
                
                // Check if seller has already completed registration
                if (existingSeller.firstname && existingSeller.lastname && 
                    existingSeller.firstname.trim() !== '' && existingSeller.lastname.trim() !== '') {
                    if (existingSeller.approved === 1) {
                        return res.status(409).json({
                            success: false,
                            message: 'A seller account with this email already exists and is approved. Please login instead.'
                        });
                    } else {
                        return res.status(409).json({
                            success: false,
                            message: 'A seller account with this email already exists and is pending approval.'
                        });
                    }
                } else {
                    // Seller exists but hasn't completed registration - update their info
                    // Note: We don't update password - seller uses existing credentials from oc_vendor
                    const displayName = `${firstName} ${lastName}`.trim() || email.split('@')[0];
                    
                    const updateQuery = `
                        UPDATE oc_vendor 
                        SET firstname = ?, lastname = ?, display_name = ?, telephone = ?, 
                            date_modified = CURDATE()
                        WHERE vendor_id = ?
                    `;
                    
                    dbSagar.query(
                        updateQuery,
                        [firstName, lastName, displayName, mobile, existingSeller.vendor_id],
                        (updateErr, updateResult) => {
                            if (updateErr) {
                                console.error('Database update error:', updateErr);
                                return res.status(500).json({
                                    success: false,
                                    message: `Failed to update seller account: ${updateErr.message}`
                                });
                            }
                            
                            // Create/update approval record in reels-ipshopy database
                            const approvalQuery = `
                                INSERT INTO oc_seller_approvals (
                                    vendor_id, email, mobile, status, created_at
                                ) VALUES (?, ?, ?, 'pending', NOW())
                                ON DUPLICATE KEY UPDATE status = 'pending', updated_at = NOW()
                            `;
                            
                            db.query(
                                approvalQuery,
                                [existingSeller.vendor_id, email, mobile],
                                (approvalErr) => {
                                    if (approvalErr) {
                                        console.error('Approval record creation error:', approvalErr);
                                        // Continue even if approval record creation fails
                                    }
                                }
                            );
                            
                            res.status(200).json({
                                success: true,
                                message: 'Seller registration submitted successfully. Please wait for admin approval.',
                                vendorId: existingSeller.vendor_id
                            });
                        }
                    );
                    return; // Exit early
                }
            }

            // Seller doesn't exist - create new record in oc_vendor
            // Note: Password will be set when seller logs in (using existing credentials from oc_vendor)
            const displayName = `${firstName} ${lastName}`.trim() || email.split('@')[0];
            
            const insertQuery = `
                INSERT INTO oc_vendor (
                    firstname, lastname, display_name, email, telephone, 
                    salt, password, approved, status, date_added, date_modified
                ) VALUES (?, ?, ?, ?, ?, '', '', 0, 0, CURDATE(), CURDATE())
            `;

            dbSagar.query(
                insertQuery,
                [firstName, lastName, displayName, email, mobile],
                (err, result) => {
                    if (err) {
                        console.error('Database insert error:', err);
                        return res.status(500).json({
                            success: false,
                            message: `Failed to create seller account: ${err.message}`
                        });
                    }

                    // Create approval record in reels-ipshopy database
                    const approvalQuery = `
                        INSERT INTO oc_seller_approvals (
                            vendor_id, email, mobile, status, created_at
                        ) VALUES (?, ?, ?, 'pending', NOW())
                    `;

                    db.query(
                        approvalQuery,
                        [result.insertId, email, mobile],
                        (approvalErr) => {
                            if (approvalErr) {
                                console.error('Approval record creation error:', approvalErr);
                                // Continue even if approval record creation fails
                            }
                        }
                    );

                    res.status(201).json({
                        success: true,
                        message: 'Seller registration submitted successfully. Please wait for admin approval.',
                        vendorId: result.insertId
                    });
                }
            );
        });
    } catch (error) {
        console.error('SubmitRegistration error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    SubmitRegistration
};

