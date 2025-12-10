/**
 * Script to create an admin user
 * Run this script with: node Scripts/create-admin.js
 * 
 * Usage: node Scripts/create-admin.js <email> <password> <firstName> <lastName>
 * Example: node Scripts/create-admin.js admin@example.com admin123 Admin User
 * 
 * IMPORTANT: Make sure your .env file is configured correctly or the database config has correct defaults
 */

const bcrypt = require('bcrypt');
const db = require('../Config/db');

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 4) {
    console.log('Usage: node Scripts/create-admin.js <email> <password> <firstName> <lastName>');
    console.log('Example: node Scripts/create-admin.js admin@example.com mypassword123 Admin User');
    process.exit(1);
}

const [email, password, firstName, lastName] = args;

async function createAdmin() {
    try {
        // Check if user already exists
        const checkQuery = 'SELECT id, role FROM users WHERE email = ?';
        db.query(checkQuery, [email], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                process.exit(1);
            }

            if (results.length > 0) {
                console.log(`Error: User with email ${email} already exists with role: ${results[0].role}`);
                process.exit(1);
            }

            // Hash password
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Insert admin user
            const insertQuery = `
                INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_active, created_at)
                VALUES (?, ?, 'admin', ?, ?, NULL, 1, NOW())
            `;

            db.query(
                insertQuery,
                [email, passwordHash, firstName, lastName],
                (err, result) => {
                    if (err) {
                        console.error('Error creating admin user:', err);
                        process.exit(1);
                    }

                    console.log('\n✅ Admin user created successfully!');
                    console.log(`Email: ${email}`);
                    console.log(`Role: admin`);
                    console.log(`Name: ${firstName} ${lastName}`);
                    console.log('\nYou can now login to the admin panel with these credentials.\n');
                    process.exit(0);
                }
            );
        });
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createAdmin();

