-- Script to manually create an admin user in the database
-- Run this SQL script in your MySQL database: ipshopy_reels

-- IMPORTANT: Replace the values below with your desired admin credentials
-- After running this, you can login with these credentials on the admin panel

INSERT INTO users (
    email, 
    password_hash, 
    role, 
    first_name, 
    last_name, 
    phone, 
    is_active, 
    created_at
) 
VALUES (
    'admin@example.com',  -- CHANGE THIS to your admin email
    '$2b$10$YourHashedPasswordHere',  -- CHANGE THIS: Hash your password using bcrypt
    'admin',
    'Admin',
    'User',
    NULL,
    1,
    NOW()
);

-- Note: To hash a password, you can use Node.js:
-- const bcrypt = require('bcrypt');
-- const hash = await bcrypt.hash('yourpassword', 10);
-- console.log(hash);

-- Or use an online bcrypt generator and replace the password_hash above