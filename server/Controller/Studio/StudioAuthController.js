const bcrypt = require('bcryptjs');
const db = require('../../Config/db');
const dbSagar = require('../../Config/db_sagar');
const nodemailer = require('nodemailer');
const { generateToken, generateResetToken, verifyToken } = require('../../Utils/jwtUtils');

let mailTransporter;
const getMailTransporter = async () => {
    if (mailTransporter) return mailTransporter;
    if (process.env.MAIL_HOST) {
        mailTransporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: parseInt(process.env.MAIL_PORT || '587', 10),
            secure: process.env.MAIL_SECURE === 'true',
            auth: process.env.MAIL_USER && process.env.MAIL_PASS ? {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            } : undefined
        });
        return mailTransporter;
    }
    const account = await nodemailer.createTestAccount();
    mailTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: account.user, pass: account.pass }
    });
    return mailTransporter;
};

const sendResetEmail = async (to, link) => {
    const from = process.env.MAIL_FROM || 'no-reply@studio.local';
    const subject = 'Reset your password';
    const html = `
        <p>We received a request to reset your password.</p>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <p><a href="${link}">Reset Password</a></p>
        <p>If you did not request this, you can safely ignore this email.</p>
    `;
    const text = `Reset your password using this link (expires in 1 hour): ${link}`;
    const transporter = await getMailTransporter();
    const info = await transporter.sendMail({ from, to, subject, text, html });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    return previewUrl || null;
};

// Seller login - check if seller exists in oc_vendor table
const sellerLogin = async (req, res) => {
    const { email } = req.body;
    
    // Validation
    if (!email) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email is required' 
        });
    }
    
    try {
        // Check if seller exists in oc_vendor table i n sagar database
        const vendorQuery = `
            SELECT vendor_id, firstname, lastname, email, telephone 
            FROM oc_vendor 
            WHERE email = ? AND approved = 1
        `;
        
        dbSagar.query(vendorQuery, [email], async (err, vendorResults) => {
            if (err) {
                console.error('Error checking vendor:', err);
                console.error('Vendor query:', vendorQuery);
                console.error('Vendor query params:', [email]);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error checking vendor information',
                    error: err.message 
                });
            }
            
            // If no vendor found
            if (vendorResults.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'You are not a seller of ipshopy. First you need to register as a seller.' 
                });
            }
            
            // Vendor found, check if they already have a studio account
            const studioQuery = `
                SELECT * FROM oc_sellers 
                WHERE email = ? AND vendor_id = ?
            `;
            
            db.query(studioQuery, [email, vendorResults[0].vendor_id], async (err, studioResults) => {
                if (err) {
                    console.error('Error checking studio seller:', err);
                    console.error('Studio query:', studioQuery);
                    console.error('Studio query params:', [email, vendorResults[0].vendor_id]);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error checking studio seller information',
                        error: err.message 
                    });
                }
                
                // If seller already has studio account
                if (studioResults.length > 0) {
                    return res.status(200).json({
                        success: true,
                        message: 'Seller already registered for reels.',
                        exists: true,
                        registered: true
                    });
                } else {
                    // Seller exists in oc_vendor but not in oc_sellers
                    return res.status(200).json({
                        success: true,
                        message: 'Seller verified. You can now register for reels.',
                        exists: true,
                        registered: false
                    });
                }
            });
        });
    } catch (error) {
        console.error('Seller login error:', error);
        console.error('Stack trace:', error.stack);
        return res.status(500).json({ 
            success: false, 
            message: 'Seller login failed',
            error: error.message 
        });
    }
};

// Set seller password
const setSellerPassword = async (req, res) => {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email and password are required' 
        });
    }
    
    // Password validation
    if (password.length < 6) {
        return res.status(400).json({ 
            success: false, 
            message: 'Password must be at least 6 characters long' 
        });
    }
    
    try {
        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Update seller with password
        const updateQuery = `
            UPDATE oc_sellers 
            SET password_hash = ?, date_modified = NOW() 
            WHERE email = ?
        `;
        
        db.query(updateQuery, [hashedPassword, email], (err, result) => {
            if (err) {
                console.error('Error setting seller password:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error setting password',
                    error: err.message 
                });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Seller not found' 
                });
            }
            
            return res.status(200).json({
                success: true,
                message: 'Password set successfully. You can now login.'
            });
        });
    } catch (error) {
        console.error('Set password error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to set password',
            error: error.message 
        });
    }
};

// Complete seller login with password
const sellerLoginWithPassword = async (req, res) => {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email and password are required' 
        });
    }
    
    try {
        // Get seller with password
        const query = `SELECT * FROM oc_sellers WHERE email = ?`;
        
        db.query(query, [email], async (err, results) => {
            if (err) {
                console.error('Error fetching seller:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching seller information',
                    error: err.message 
                });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Seller not found' 
                });
            }
            
            const seller = results[0];
            
            // Check if password is set
            if (!seller.password_hash) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Please set your password first' 
                });
            }
            
            // Compare passwords
            const isMatch = await bcrypt.compare(password, seller.password_hash);
            
            if (!isMatch) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid password' 
                });
            }
            
            // Password matches, now check if seller is approved in seller_approvals table
            const vendorQuery = `SELECT status FROM seller_approvals WHERE vendor_id = ?`;
            db.query(vendorQuery, [seller.vendor_id], (vendorErr, vendorResults) => {
                if (vendorErr) {
                    console.error('Error checking vendor approval:', vendorErr);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error checking account approval status',
                        error: vendorErr.message 
                    });
                }
                
                // If no approval record found or status is not approved
                if (vendorResults.length === 0 || vendorResults[0].status !== 'approved') {
                    return res.status(403).json({ 
                        success: false, 
                        message: 'your account is on review please wait for the admin approval' 
                    });
                }
                
                // Seller is approved, login successful
                const sellerData = {
                    id: seller.id,
                    vendor_id: seller.vendor_id,
                    firstname: seller.firstname,
                    lastname: seller.lastname,
                    email: seller.email,
                    telephone: seller.telephone,
                    image: seller.profile_image || null,
                    role: 'seller'
                };
                
                // Generate JWT token
                const token = generateToken({
                    id: seller.id,
                    email: seller.email,
                    role: 'seller'
                });
                
                return res.status(200).json({
                    success: true,
                    message: 'Login successful',
                    token: token,
                    data: sellerData
                });
            });
        });
    } catch (error) {
        console.error('Seller login error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Login failed',
            error: error.message 
        });
    }
};

// Influencer application
const applyForInfluencer = async (req, res) => {
    const { 
        firstName, 
        lastName, 
        email, 
        mobile, 
        platform, 
        accountLink, 
        password 
    } = req.body;
    
    // Validation
    if (!firstName || !lastName || !email || !mobile || !platform || !accountLink || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields are required' 
        });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Please enter a valid email address' 
        });
    }
    
    // Password validation
    if (password.length < 6) {
        return res.status(400).json({ 
            success: false, 
            message: 'Password must be at least 6 characters long' 
        });
    }
    
    try {
        // Check if influencer already exists
        const checkQuery = `
            SELECT email, account_link FROM oc_influencers 
            WHERE email = ? OR account_link = ?
        `;
        
        db.query(checkQuery, [email, accountLink], async (err, results) => {
            if (err) {
                console.error('Error checking influencer:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error checking influencer information',
                    error: err.message 
                });
            }
            
            if (results.length > 0) {
                const emailExists = results.some(r => (r.email || '').toLowerCase() === (email || '').toLowerCase());
                const linkExists = results.some(r => (r.account_link || '').toLowerCase() === (accountLink || '').toLowerCase());
                if (linkExists && !emailExists) {
                    return res.status(400).json({ success: false, message: 'An account with this link already exists' });
                }
                if (emailExists && !linkExists) {
                    return res.status(400).json({ success: false, message: 'An account with this email already exists' });
                }
                return res.status(400).json({ success: false, message: 'An account with this email and link already exists' });
            }
            
            // Hash password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            
            // Insert new influencer
            const insertQuery = `
                INSERT INTO oc_influencers 
                (firstname, lastname, email, telephone, platform, account_link, password_hash, status, date_added) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())
            `;
            
            db.query(insertQuery, [
                firstName,
                lastName,
                email,
                mobile,
                platform,
                accountLink,
                hashedPassword
            ], (err, result) => {
                if (err) {
                    console.error('Error creating influencer:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error creating influencer account',
                        error: err.message 
                    });
                }
                
                const influencerData = {
                    id: result.insertId,
                    firstname: firstName,
                    lastname: lastName,
                    email: email,
                    telephone: mobile,
                    platform: platform,
                    account_link: accountLink,
                    role: 'influencer'
                };
                
                return res.status(201).json({
                    success: true,
                    message: 'Influencer application submitted successfully',
                    data: influencerData
                });
            });
        });
    } catch (error) {
        console.error('Influencer application error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Application failed',
            error: error.message 
        });
    }
};

// Influencer login
const influencerLogin = async (req, res) => {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email and password are required' 
        });
    }
    
    try {
        // Get influencer with password
        const query = `
            SELECT * FROM oc_influencers 
            WHERE email = ?
        `;
        
        db.query(query, [email], async (err, results) => {
            if (err) {
                console.error('Error fetching influencer:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching influencer information',
                    error: err.message 
                });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'first you need to apply for the Reel Studio' 
                });
            }
            
            const influencer = results[0];
            
            // Check if account is approved
            if (influencer.status !== 1) {
                let message = 'Your account is not approved yet';
                if (influencer.status === 0) {
                    message = 'Your account is pending approval';
                } else if (influencer.status === 2) {
                    message = 'Your account has been rejected';
                }
                return res.status(403).json({ 
                    success: false, 
                    message: message
                });
            }
            
            // Compare passwords
            const isMatch = await bcrypt.compare(password, influencer.password_hash);
            
            if (!isMatch) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid password' 
                });
            }
            
            // Password matches, login successful
            const influencerData = {
                id: influencer.id,
                firstname: influencer.firstname,
                lastname: influencer.lastname,
                email: influencer.email,
                telephone: influencer.telephone,
                platform: influencer.platform,
                account_link: influencer.account_link,
                image: influencer.profile_image, // Add profile image to the response
                role: 'influencer'
            };
            
            // Generate JWT token
            const token = generateToken({
                id: influencer.id,
                email: influencer.email,
                role: 'influencer'
            });
            
            return res.status(200).json({
                success: true,
                message: 'Login successful',
                token: token,
                data: influencerData
            });
        });
    } catch (error) {
        console.error('Influencer login error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Login failed',
            error: error.message 
        });
    }
};

// Request password reset - Seller
const requestSellerPasswordReset = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }
    try {
        const query = `SELECT id, email FROM oc_sellers WHERE email = ?`;
        db.query(query, [email], async (err, results) => {
            if (err) {
                console.error('Seller reset lookup error:', err);
                return res.status(500).json({ success: false, message: 'Error processing request', error: err.message });
            }
            if (results.length === 0) {
                // Do not reveal account existence
                return res.status(200).json({ success: true, message: 'If an account exists, a reset email has been sent' });
            }
            const seller = results[0];
            const token = generateResetToken({ id: seller.id, role: 'seller', type: 'password_reset' }, '1h');
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const link = `${baseUrl}/studio/reset-password?role=seller&token=${encodeURIComponent(token)}`;
            try {
                const previewUrl = await sendResetEmail(seller.email, link);
                return res.status(200).json({ success: true, message: 'Reset email sent', previewUrl });
            } catch (mailErr) {
                console.error('Mail send error:', mailErr);
                return res.status(200).json({ success: true, message: 'If an account exists, a reset email has been sent' });
            }
        });
    } catch (error) {
        console.error('Request seller reset error:', error);
        return res.status(500).json({ success: false, message: 'Error processing request', error: error.message });
    }
};

// Request password reset - Influencer
const requestInfluencerPasswordReset = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }
    try {
        const query = `SELECT id, email FROM oc_influencers WHERE email = ?`;
        db.query(query, [email], async (err, results) => {
            if (err) {
                console.error('Influencer reset lookup error:', err);
                return res.status(500).json({ success: false, message: 'Error processing request', error: err.message });
            }
            if (results.length === 0) {
                // Do not reveal account existence
                return res.status(200).json({ success: true, message: 'If an account exists, a reset email has been sent' });
            }
            const influencer = results[0];
            const token = generateResetToken({ id: influencer.id, role: 'influencer', type: 'password_reset' }, '1h');
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const link = `${baseUrl}/studio/reset-password?role=influencer&token=${encodeURIComponent(token)}`;
            try {
                const previewUrl = await sendResetEmail(influencer.email, link);
                return res.status(200).json({ success: true, message: 'Reset email sent', previewUrl });
            } catch (mailErr) {
                console.error('Mail send error:', mailErr);
                return res.status(200).json({ success: true, message: 'If an account exists, a reset email has been sent' });
            }
        });
    } catch (error) {
        console.error('Request influencer reset error:', error);
        return res.status(500).json({ success: false, message: 'Error processing request', error: error.message });
    }
};

// Reset password - Seller
const resetSellerPassword = async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
        return res.status(400).json({ success: false, message: 'Token and password are required' });
    }
    // Strong password validation
    const strongPwd = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPwd.test(password)) {
        return res.status(400).json({ success: false, message: 'Password must be 8+ chars with uppercase, number, and special character' });
    }
    try {
        let payload;
        try {
            payload = verifyToken(token);
        } catch (e) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        }
        if (payload.role !== 'seller' || payload.type !== 'password_reset') {
            return res.status(400).json({ success: false, message: 'Invalid token' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const updateQuery = `UPDATE oc_sellers SET password_hash = ?, date_modified = NOW() WHERE id = ?`;
        db.query(updateQuery, [hashedPassword, payload.id], (err, result) => {
            if (err) {
                console.error('Seller reset update error:', err);
                return res.status(500).json({ success: false, message: 'Error resetting password', error: err.message });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Account not found' });
            }
            return res.status(200).json({ success: true, message: 'Password reset successful' });
        });
    } catch (error) {
        console.error('Seller reset error:', error);
        return res.status(500).json({ success: false, message: 'Error resetting password', error: error.message });
    }
};

// Reset password - Influencer
const resetInfluencerPassword = async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
        return res.status(400).json({ success: false, message: 'Token and password are required' });
    }
    // Strong password validation
    const strongPwd = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPwd.test(password)) {
        return res.status(400).json({ success: false, message: 'Password must be 8+ chars with uppercase, number, and special character' });
    }
    try {
        let payload;
        try {
            payload = verifyToken(token);
        } catch (e) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        }
        if (payload.role !== 'influencer' || payload.type !== 'password_reset') {
            return res.status(400).json({ success: false, message: 'Invalid token' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const updateQuery = `UPDATE oc_influencers SET password_hash = ?, date_modified = NOW() WHERE id = ?`;
        db.query(updateQuery, [hashedPassword, payload.id], (err, result) => {
            if (err) {
                console.error('Influencer reset update error:', err);
                return res.status(500).json({ success: false, message: 'Error resetting password', error: err.message });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Account not found' });
            }
            return res.status(200).json({ success: true, message: 'Password reset successful' });
        });
    } catch (error) {
        console.error('Influencer reset error:', error);
        return res.status(500).json({ success: false, message: 'Error resetting password', error: error.message });
    }
};

// Influencer application for reels
const applyForInfluencerReels = async (req, res) => {
    const { 
        firstName, 
        lastName, 
        email, 
        mobile, 
        platform, 
        profileUrl,
        password,
        platforms
    } = req.body;
    
    const normalizedPlatforms = Array.isArray(platforms) ? platforms : [];
    const primaryPlatform = normalizedPlatforms[0]?.platform || platform || '';
    const primaryLink = (normalizedPlatforms[0]?.links || [])[0] || profileUrl || '';
    const allPlatforms = normalizedPlatforms
        .map(p => String(p.platform || '').trim())
        .filter(p => p.length > 0);
    const allLinks = normalizedPlatforms
        .flatMap(p => Array.isArray(p.links) ? p.links : [])
        .map(l => String(l || '').trim())
        .filter(l => l.length > 0);
    const platformsJoined = allPlatforms.join(',');
    const linksJoined = allLinks.join(',');
    
    // Validation
    if (!firstName || !lastName || !email || !mobile || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'First name, last name, email, mobile, and password are required' 
        });
    }
    if (!primaryPlatform || !primaryLink) {
        return res.status(400).json({ 
            success: false, 
            message: 'At least one platform and profile link is required' 
        });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Please enter a valid email address' 
        });
    }
    
    // Password validation
    if (password.length < 6) {
        return res.status(400).json({ 
            success: false, 
            message: 'Password must be at least 6 characters long' 
        });
    }
    
    try {
        // Check if influencer already exists
        const checkQuery = `
            SELECT * FROM oc_influencers 
            WHERE email = ? OR account_link = ?
        `;
        
        db.query(checkQuery, [email, primaryLink], async (err, results) => {
            if (err) {
                console.error('Error checking influencer:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error checking influencer information',
                    error: err.message 
                });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'An account with this email or account link already exists' 
                });
            }
            
            // Hash password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            
            // Insert new influencer with status 0 (pending)
            const insertQuery = `
                INSERT INTO oc_influencers 
                (firstname, lastname, email, telephone, platform, account_link, password_hash, status, date_added) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW())
            `;
            
            db.query(insertQuery, [
                firstName,
                lastName,
                email,
                mobile,
                platformsJoined || primaryPlatform,
                linksJoined || primaryLink,
                hashedPassword
            ], (err, result) => {
                if (err) {
                    console.error('Error creating influencer:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error creating influencer account',
                        error: err.message 
                    });
                }
                
                const influencerId = result.insertId;
                const inserts = [];
                for (const p of normalizedPlatforms) {
                    const pl = String(p.platform || '').trim();
                    const links = Array.isArray(p.links) ? p.links : [];
                    for (const link of links) {
                        const l = String(link || '').trim();
                        if (pl && l) {
                            inserts.push([influencerId, pl, l]);
                        }
                    }
                }
                if (inserts.length > 0) {
                    const multiInsert = `
                        INSERT INTO influencer_platform_links (influencer_id, platform, account_link, date_added)
                        VALUES ${inserts.map(() => '(?, ?, ?, NOW())').join(',')}
                    `;
                    db.query(multiInsert, inserts.flat(), (e) => {
                        if (e) {
                            console.error('Error saving influencer platform links:', e);
                        }
                    });
                }
                
                const influencerData = {
                    id: influencerId,
                    firstname: firstName,
                    lastname: lastName,
                    email: email,
                    telephone: mobile,
                    platform: primaryPlatform,
                    account_link: primaryLink,
                    role: 'influencer'
                };
                
                return res.status(201).json({
                    success: true,
                    message: 'Influencer application submitted successfully',
                    data: influencerData
                });
            });
        });
    } catch (error) {
        console.error('Influencer application error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Application failed',
            error: error.message 
        });
    }
};

// Check if seller exists in oc_vendor table with additional details
const checkSellerDetails = async (req, res) => {
    const { email, mobile, firstName, lastName } = req.body;
    
    // Validation
    if (!email || !mobile || !firstName || !lastName) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email, mobile, first name, and last name are required' 
        });
    }
    
    try {
        // Check if seller exists in oc_vendor table in sagar database
        const vendorQuery = `
            SELECT vendor_id, firstname, lastname, email, telephone 
            FROM oc_vendor 
            WHERE email = ? AND telephone = ? AND firstname = ? AND lastname = ? AND approved = 1
        `;
        
        dbSagar.query(vendorQuery, [email, mobile, firstName, lastName], async (err, vendorResults) => {
            if (err) {
                console.error('Error checking vendor:', err);
                console.error('Vendor query:', vendorQuery);
                console.error('Vendor query params:', [email, mobile, firstName, lastName]);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error checking vendor information',
                    error: err.message 
                });
            }
            
            // If no vendor found
            if (vendorResults.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'You are not a seller of ipshopy. First you need to register as a seller in ipshopy.',
                    exists: false
                });
            }
            
            // Vendor found, check if they already have a studio account
            const studioQuery = `
                SELECT * FROM oc_sellers 
                WHERE email = ? AND vendor_id = ?
            `;
            
            db.query(studioQuery, [email, vendorResults[0].vendor_id], async (err, studioResults) => {
                if (err) {
                    console.error('Error checking studio seller:', err);
                    console.error('Studio query:', studioQuery);
                    console.error('Studio query params:', [email, vendorResults[0].vendor_id]);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error checking studio seller information',
                        error: err.message 
                    });
                }
                
                // If seller already has studio account
                if (studioResults.length > 0) {
                    return res.status(200).json({
                        success: true,
                        message: 'Seller already registered for reels.',
                        exists: true,
                        registered: true
                    });
                } else {
                    // Seller exists in oc_vendor but not in oc_sellers
                    return res.status(200).json({
                        success: true,
                        message: 'Seller verified. You can now register for reels.',
                        exists: true,
                        registered: false
                    });
                }
            });
        });
    } catch (error) {
        console.error('Seller check error:', error);
        console.error('Stack trace:', error.stack);
        return res.status(500).json({ 
            success: false, 
            message: 'Seller check failed',
            error: error.message 
        });
    }
};

// Register seller for reels
const registerSellerForReels = async (req, res) => {
    const { 
        firstName, 
        lastName, 
        email, 
        mobile, 
        password
    } = req.body;
    
    // Validation
    if (!firstName || !lastName || !email || !mobile || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'First name, last name, email, mobile, and password are required' 
        });
    }
    
    // Password validation
    if (password.length < 6) {
        return res.status(400).json({ 
            success: false, 
            message: 'Password must be at least 6 characters long' 
        });
    }
    
    try {
        // Check if seller exists in oc_vendor table
        const vendorQuery = `
            SELECT vendor_id, firstname, lastname, email, telephone 
            FROM oc_vendor 
            WHERE email = ? AND telephone = ? AND firstname = ? AND lastname = ? AND approved = 1
        `;
        
        dbSagar.query(vendorQuery, [email, mobile, firstName, lastName], async (err, vendorResults) => {
            if (err) {
                console.error('Error checking vendor:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error checking vendor information',
                    error: err.message 
                });
            }
            
            // If no vendor found
            if (vendorResults.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'You are not a seller of ipshopy. First you need to register as a seller.' 
                });
            }
            
            // Hash password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            
            // Insert new seller into oc_sellers table
            const insertQuery = `
                INSERT INTO oc_sellers 
                (vendor_id, firstname, lastname, email, telephone, password_hash, date_added) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `;
            
            db.query(insertQuery, [
                vendorResults[0].vendor_id,
                firstName,
                lastName,
                email,
                mobile,
                hashedPassword
            ], (err, result) => {
                if (err) {
                    console.error('Error creating studio seller:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error creating studio seller account',
                        error: err.message 
                    });
                }
                
                const sellerData = {
                    id: result.insertId,
                    vendor_id: vendorResults[0].vendor_id,
                    firstname: firstName,
                    lastname: lastName,
                    email: email,
                    telephone: mobile
                };
                
                return res.status(201).json({
                    success: true,
                    message: 'Seller registered for reels successfully',
                    data: sellerData
                });
            });

        });
    } catch (error) {
        console.error('Seller registration error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Registration failed',
            error: error.message 
        });
    }
};

// Get all influencers who applied for reels
const getAllInfluencerApplications = async (req, res) => {
    try {
        // Query to fetch all influencers with their application details from ipshopy_reels database
        const query = `
            SELECT 
                id,
                firstname,
                lastname,
                email,
                telephone,
                platform,
                account_link,
                status,
                date_added,
                approved_at,
                rejected_at
            FROM oc_influencers
            ORDER BY date_added DESC
        `;
        
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching influencer applications:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching influencer applications',
                    error: err.message 
                });
            }
            
            return res.status(200).json({
                success: true,
                data: results
            });
        });
    } catch (error) {
        console.error('Get influencer applications error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch influencer applications',
            error: error.message 
        });
    }
};

// Approve an influencer application
const approveInfluencer = async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json({ 
            success: false, 
            message: 'Influencer ID is required' 
        });
    }
    
    try {
        const query = `
            UPDATE oc_influencers 
            SET status = 1, approved_at = NOW()
            WHERE id = ?
        `;
        
        db.query(query, [id], (err, result) => {
            if (err) {
                console.error('Error approving influencer:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error approving influencer',
                    error: err.message 
                });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Influencer not found' 
                });
            }
            
            return res.status(200).json({
                success: true,
                message: 'Influencer approved successfully'
            });
        });
    } catch (error) {
        console.error('Approve influencer error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to approve influencer',
            error: error.message 
        });
    }
};

// Reject an influencer application
const rejectInfluencer = async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json({ 
            success: false, 
            message: 'Influencer ID is required' 
        });
    }
    
    try {
        const query = `
            UPDATE oc_influencers 
            SET status = 2, rejected_at = NOW()
            WHERE id = ?
        `;
        
        db.query(query, [id], (err, result) => {
            if (err) {
                console.error('Error rejecting influencer:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error rejecting influencer',
                    error: err.message 
                });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Influencer not found' 
                });
            }
            
            return res.status(200).json({
                success: true,
                message: 'Influencer rejected successfully'
            });
        });
    } catch (error) {
        console.error('Reject influencer error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to reject influencer',
            error: error.message 
        });
    }
};

// Check if seller exists by email only
const checkSellerEmail = async (req, res) => {
    const { email } = req.body;
    
    // Validation
    if (!email) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email is required' 
        });
    }
    
    try {
        // Check if seller exists in oc_sellers table
        const query = `
            SELECT * FROM oc_sellers 
            WHERE email = ?
        `;
        
        db.query(query, [email], async (err, results) => {
            if (err) {
                console.error('Error checking seller:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error checking seller information',
                    error: err.message 
                });
            }
            
            if (results.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'first you need to apply for the reel studio',
                    exists: false
                });
            }
            
            const seller = results[0];
            return res.status(200).json({
                success: true,
                message: 'Seller found',
                exists: true,
                seller: {
                    id: seller.id,
                    vendor_id: seller.vendor_id,
                    firstname: seller.firstname,
                    lastname: seller.lastname,
                    email: seller.email,
                    telephone: seller.telephone,
                    image: seller.profile_image || null
                }
            });
        });
    } catch (error) {
        console.error('Seller email check error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Seller check failed',
            error: error.message 
        });
    }
};

module.exports = {
    sellerLogin,
    setSellerPassword,
    sellerLoginWithPassword,
    applyForInfluencer,
    influencerLogin,
    checkSellerDetails,
    registerSellerForReels,
    checkSellerEmail,
    applyForInfluencerReels,
    getAllInfluencerApplications,
    approveInfluencer,
    rejectInfluencer,
    // New: password reset endpoints
    requestSellerPasswordReset,
    requestInfluencerPasswordReset,
    resetSellerPassword,
    resetInfluencerPassword
};
