const db = require('../../Config/db'); // reels-ipshopy database
const dbSagar = require('../../Config/db_sagar'); // sagar database (oc_vendor table)
const {
    sendSellerApprovalNotification,
    sendSellerRejectionNotification,
    sendSellerPendingNotification
} = require('../../Services/Notifications/notificationService');

// Get all pending seller approvals
const GetPendingApprovals = async (req, res) => {
    try {
        // First, create the oc_seller_approvals table if it doesn't exist
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS oc_seller_approvals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                vendor_id INT NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL,
                mobile VARCHAR(20),
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_status (status),
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;

        db.query(createTableQuery, (createErr) => {
            if (createErr && createErr.code !== 'ER_TABLE_EXISTS_ERROR') {
                console.error('Error creating seller_approvals table:', createErr);
            }

            // Get pending sellers from oc_vendor table
            const query = `
                SELECT 
                    vendor_id,
                    email,
                    telephone as mobile,
                    display_name,
                    firstname,
                    lastname,
                    date_added,
                    approved,
                    status
                FROM oc_vendor 
                WHERE approved = 0
                ORDER BY date_added DESC
            `;

            dbSagar.query(query, (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error occurred'
                    });
                }

                res.json({
                    success: true,
                    data: results
                });
            });
        });
    } catch (error) {
        console.error('GetPendingApprovals error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Approve a seller
const ApproveSeller = async (req, res) => {
    console.log('=== APPROVE SELLER ENDPOINT CALLED ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Request method:', req.method);
    
    try {
        const { vendorId } = req.body;

        if (!vendorId) {
            return res.status(400).json({
                success: false,
                message: 'Vendor ID is required'
            });
        }

        // First, fetch seller data before updating
        const getVendorQuery = 'SELECT vendor_id, firstname, lastname, email, telephone FROM oc_vendor WHERE vendor_id = ?';
        
        dbSagar.query(getVendorQuery, [vendorId], async (fetchErr, vendorResults) => {
            if (fetchErr) {
                console.error('Error fetching seller data:', fetchErr);
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching seller information',
                    error: fetchErr.message
                });
            }

            if (vendorResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Seller not found'
                });
            }

            const sellerData = vendorResults[0];

            // Update oc_vendor table to set approved = 1
            const updateQuery = 'UPDATE oc_vendor SET approved = 1, status = 1, date_modified = CURDATE() WHERE vendor_id = ?';
            
            dbSagar.query(updateQuery, [vendorId], async (err, result) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error occurred'
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Seller not found'
                    });
                }

                // Update approval record in reels-ipshopy database
                const email = sellerData.email;
                
                // First try to update existing record
                const updateApprovalQuery = `
                    UPDATE oc_seller_approvals 
                    SET status = 'approved', email = ?, updated_at = NOW()
                    WHERE vendor_id = ?
                `;
                
                db.query(updateApprovalQuery, [email, vendorId], (updateErr, updateResult) => {
                    if (updateErr) {
                        console.error('Approval record update error:', updateErr);
                    } else {
                        // If no rows were affected, insert a new record
                        if (updateResult.affectedRows === 0) {
                            const insertApprovalQuery = `
                                INSERT INTO oc_seller_approvals (vendor_id, email, status, created_at, updated_at)
                                VALUES (?, ?, 'approved', NOW(), NOW())
                            `;
                            
                            db.query(insertApprovalQuery, [vendorId, email], (insertErr) => {
                                if (insertErr) {
                                    console.error('Approval record insert error:', insertErr);
                                }
                            });
                        }
                    }
                });

                // Send WhatsApp notification
                let notificationStatus = { sent: false, message: 'Not attempted' };
                try {
                    console.log('Sending WhatsApp approval notification to seller:', {
                        vendorId: sellerData.vendor_id,
                        name: sellerData.firstname,
                        phone: sellerData.telephone
                    });
                    const notificationResult = await sendSellerApprovalNotification(sellerData);
                    if (notificationResult.success) {
                        console.log('✅ WhatsApp approval notification sent successfully to seller:', sellerData.telephone);
                        notificationStatus = { sent: true, message: 'Notification sent successfully', data: notificationResult.data };
                    } else {
                        console.error('❌ WhatsApp approval notification failed for seller:', notificationResult.message || notificationResult.error);
                        notificationStatus = { sent: false, message: notificationResult.message || notificationResult.error };
                    }
                } catch (notificationError) {
                    // Log notification error but don't fail the request
                    console.error('❌ Error sending approval notification:', notificationError.message || notificationError);
                    notificationStatus = { sent: false, message: notificationError.message || 'Unknown error' };
                }

                res.json({
                    success: true,
                    message: 'Seller approved successfully',
                    notification: notificationStatus
                });
            });
        });
    } catch (error) {
        console.error('ApproveSeller error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Reject a seller
const RejectSeller = async (req, res) => {
    console.log('=== REJECT SELLER ENDPOINT CALLED ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Request method:', req.method);
    
    try {
        const { vendorId } = req.body;

        if (!vendorId) {
            return res.status(400).json({
                success: false,
                message: 'Vendor ID is required'
            });
        }

        // First, fetch seller data before updating
        const getVendorQuery = 'SELECT vendor_id, firstname, lastname, email, telephone FROM oc_vendor WHERE vendor_id = ?';
        
        dbSagar.query(getVendorQuery, [vendorId], async (fetchErr, vendorResults) => {
            if (fetchErr) {
                console.error('Error fetching seller data:', fetchErr);
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching seller information',
                    error: fetchErr.message
                });
            }

            if (vendorResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Seller not found'
                });
            }

            const sellerData = vendorResults[0];

            // Update approval record in reels-ipshopy database
            const email = sellerData.email;
            
            // First try to update existing record
            const updateApprovalQuery = `
                UPDATE oc_seller_approvals 
                SET status = 'rejected', email = ?, updated_at = NOW()
                WHERE vendor_id = ?
            `;
            
            db.query(updateApprovalQuery, [email, vendorId], async (updateErr, updateResult) => {
                if (updateErr) {
                    console.error('Approval record update error:', updateErr);
                } else {
                    // If no rows were affected, insert a new record
                    if (updateResult.affectedRows === 0) {
                        const insertApprovalQuery = `
                            INSERT INTO oc_seller_approvals (vendor_id, email, status, created_at, updated_at)
                            VALUES (?, ?, 'rejected', NOW(), NOW())
                        `;
                        
                        db.query(insertApprovalQuery, [vendorId, email], (insertErr) => {
                            if (insertErr) {
                                console.error('Approval record insert error:', insertErr);
                            }
                        });
                    }
                }

                // Send WhatsApp notification
                let notificationStatus = { sent: false, message: 'Not attempted' };
                try {
                    console.log('Sending WhatsApp rejection notification to seller:', {
                        vendorId: sellerData.vendor_id,
                        name: sellerData.firstname,
                        phone: sellerData.telephone
                    });
                    const notificationResult = await sendSellerRejectionNotification(sellerData);
                    if (notificationResult.success) {
                        console.log('✅ WhatsApp rejection notification sent successfully to seller:', sellerData.telephone);
                        notificationStatus = { sent: true, message: 'Notification sent successfully', data: notificationResult.data };
                    } else {
                        console.error('❌ WhatsApp rejection notification failed for seller:', notificationResult.message || notificationResult.error);
                        notificationStatus = { sent: false, message: notificationResult.message || notificationResult.error };
                    }
                } catch (notificationError) {
                    // Log notification error but don't fail the request
                    console.error('❌ Error sending rejection notification:', notificationError.message || notificationError);
                    notificationStatus = { sent: false, message: notificationError.message || 'Unknown error' };
                }

                res.json({
                    success: true,
                    message: 'Seller rejected successfully',
                    notification: notificationStatus
                });
            });
        });
    } catch (error) {
        console.error('RejectSeller error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all approved sellers
const GetApprovedSellers = async (req, res) => {
    try {
        const query = `
            SELECT 
                vendor_id,
                email,
                telephone as mobile,
                display_name,
                firstname,
                lastname,
                date_added,
                approved,
                status
            FROM oc_vendor 
            WHERE approved = 1
            ORDER BY date_added DESC
        `;

        dbSagar.query(query, (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
            }

            res.json({
                success: true,
                data: results
            });
        });
    } catch (error) {
        console.error('GetApprovedSellers error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all sellers with their approval status
const GetSellerReelApplications = async (req, res) => {
    try {
        const query = `
            SELECT 
                s.id as application_id,
                s.vendor_id,
                s.firstname,
                s.lastname,
                s.email,
                s.telephone as mobile,
                s.date_added as applied_at,
                COALESCE(sa.status, 'pending') as status,
                CASE 
                    WHEN sa.status = 'approved' THEN sa.updated_at
                    ELSE NULL
                END as approved_at,
                CASE 
                    WHEN sa.status = 'rejected' THEN sa.updated_at
                    ELSE NULL
                END as rejected_at
            FROM oc_sellers s
            LEFT JOIN (
                SELECT *
                FROM oc_seller_approvals sa1
                WHERE sa1.updated_at = (
                    SELECT MAX(sa2.updated_at)
                    FROM oc_seller_approvals sa2
                    WHERE sa2.vendor_id = sa1.vendor_id
                )
            ) sa ON s.vendor_id = sa.vendor_id
            ORDER BY s.date_added DESC
        `;

        db.query(query, (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
            }

            res.json({
                success: true,
                data: results
            });
        });
    } catch (error) {
        console.error('GetSellerReelApplications error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all approved sellers from seller_approvals table
// Added by Vaishanvi
const GetApprovedSellersFromApprovals = async (req, res) => {
    try {
        const query = `
            SELECT 
                s.vendor_id,
                s.email,
                s.telephone as mobile,
                s.firstname,
                s.lastname,
                s.date_added,
                sa.status,
                sa.updated_at as approved_at
            FROM oc_sellers s
            INNER JOIN (
                SELECT vendor_id, status, updated_at
                FROM oc_seller_approvals sa1
                WHERE sa1.status = 'approved'
                AND sa1.updated_at = (
                    SELECT MAX(sa2.updated_at)
                    FROM oc_seller_approvals sa2
                    WHERE sa2.vendor_id = sa1.vendor_id
                    AND sa2.status = 'approved'
                )
            ) sa ON s.vendor_id = sa.vendor_id
            ORDER BY sa.updated_at DESC
        `;

        db.query(query, (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
            }

            res.json({
                success: true,
                data: results
            });
        });
    } catch (error) {
        console.error('GetApprovedSellersFromApprovals error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Upload a new brand reel (fallback endpoint)
const uploadBrandReel = async (req, res) => {
    try {
        // Log the received data for debugging
        console.log('=== NEW BRAND REEL UPLOAD REQUEST (FALLBACK) ===');
        console.log('Request headers:', req.headers);
        console.log('Request content-type:', req.headers['content-type']);
        console.log('Received upload request data:', {
            body: req.body,
            files: req.files
        });

        // Log the structure of req.files if it exists
        if (req.files) {
            console.log('Files structure:', Object.keys(req.files));
            if (req.files.video) {
                console.log('Video file info:', req.files.video);
            }
            if (req.files.thumbnail) {
                console.log('Thumbnail file info:', req.files.thumbnail);
            }
        }

        // Check if any form data was received at all
        if (!req.body || Object.keys(req.body).length === 0) {
            console.log('ERROR: No form data received in request body');
            console.log('Request object keys:', Object.keys(req));
            if (req.body) {
                console.log('Request body keys:', Object.keys(req.body));
            }
            return res.status(400).json({
                success: false,
                message: 'No form data received'
            });
        }

        // Extract text fields from req.body (handling both naming conventions)
        const title = req.body.title;
        const description = req.body.description;
        const category = req.body.category || req.body.category_id;
        const brandId = req.body.brandId || req.body.brand_id;
        const productId = req.body.productId || req.body.product_id;

        // Log parsed data
        console.log('Parsed data:', {
            title,
            description,
            category,
            brandId,
            productId
        });
        
        // Log all body parameters for debugging
        console.log('All body parameters:', req.body);

        // Validation with detailed logging
        console.log('Starting validation checks...');

        if (!title) {
            console.log('Title validation failed - title is:', title);
            return res.status(400).json({
                success: false,
                message: 'Title is required'
            });
        }

        if (!category) {
            console.log('Category validation failed - category is:', category);
            return res.status(400).json({
                success: false,
                message: 'Category is required'
            });
        }

        if (!brandId) {
            console.log('Brand validation failed - brandId is:', brandId);
            return res.status(400).json({
                success: false,
                message: 'Brand is required'
            });
        }

        // Check if video file is provided
        if (!req.files || !req.files.video) {
            console.log('Video file validation failed - files:', req.files);
            return res.status(400).json({
                success: false,
                message: 'Video file is required'
            });
        }

        // Validate that the brand exists in the sagar database
        const brandCheckQuery = 'SELECT manufacturer_id FROM oc_manufacturer WHERE manufacturer_id = ?';
        
        dbSagar.query(brandCheckQuery, [brandId], (err, brandResults) => {
            if (err) {
                console.error('Database error checking brand:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error validating brand',
                    error: err.message
                });
            }
            
            if (brandResults.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid brand selected'
                });
            }
            
            // Handle file uploads
            // Save actual file paths to database
            const videoFile = req.files.video ? req.files.video[0] : null;
            const videoUrl = videoFile ?
                `/uploads/${videoFile.filename}` :
                null;

            const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;
            const thumbnailUrl = thumbnailFile ?
                `/uploads/${thumbnailFile.filename}` :
                null;

            // Log file information
            if (videoFile) {
                console.log('Video file details:', {
                    originalname: videoFile.originalname,
                    mimetype: videoFile.mimetype,
                    size: videoFile.size,
                    filename: videoFile.filename
                });
            }

            if (thumbnailFile) {
                console.log('Thumbnail file details:', {
                    originalname: thumbnailFile.originalname,
                    mimetype: thumbnailFile.mimetype,
                    size: thumbnailFile.size,
                    filename: thumbnailFile.filename
                });
            }

            // Insert the brand reel into the database
            const brandReelQuery = `
                INSERT INTO oc_brand_reels 
                (brand_id, category_id, product_id, title, description, video_url, thumbnail_url, views, likes, comments, status, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 'approved', NOW())
            `;

            const brandReelValues = [
                brandId,
                category,
                productId || null,
                title,
                description || null,
                videoUrl,
                thumbnailUrl
            ];

            console.log('Inserting brand reel with values:', brandReelValues);

            db.query(brandReelQuery, brandReelValues, (err, result) => {
                if (err) {
                    console.error('Database error inserting brand reel:', err);
                    console.error('SQL Query:', brandReelQuery);
                    console.error('Values:', brandReelValues);
                    // Check for foreign key constraint error
                    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                        return res.status(400).json({
                            success: false,
                            message: 'Invalid brand or category ID. Please select valid options.',
                            error: err.message
                        });
                    }
                    return res.status(500).json({
                        success: false,
                        message: 'Error saving brand reel',
                        error: err.message
                    });
                }

                const reelId = result.insertId;
                console.log('Brand reel inserted successfully, ID:', reelId);

                return res.status(201).json({
                    success: true,
                    message: 'Brand reel uploaded successfully',
                    data: { reelId }
                });
            });
        });
    } catch (error) {
        console.error('Error uploading brand reel:', error);
        return res.status(500).json({
            success: false,
            message: 'Error uploading brand reel',
            error: error.message
        });
    }
};

module.exports = {
    GetPendingApprovals,
    ApproveSeller,
    RejectSeller,
    GetApprovedSellers,
    GetSellerReelApplications,
    GetApprovedSellersFromApprovals,
    uploadBrandReel // Add the new brand reel function
};