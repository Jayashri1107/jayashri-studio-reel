const mysql = require('mysql2');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Database connection without specifying database (to create it)
const connectionConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASS || '',
    multipleStatements: true
};

const dbName = process.env.MYSQL_DB || 'ipshopy_reels';
const sqlFile = path.join(__dirname, 'reels-ipshopy.sql');

console.log('🚀 Starting database setup...');
console.log(`📁 SQL File: ${sqlFile}`);
console.log(`💾 Database: ${dbName}`);

// Create connection
const connection = mysql.createConnection(connectionConfig);

connection.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to MySQL:', err.message);
        console.log('\n💡 Make sure:');
        console.log('   1. XAMPP MySQL is running');
        console.log('   2. MySQL service is started in XAMPP Control Panel');
        console.log('   3. Default credentials are correct (root with no password)');
        process.exit(1);
    }

    console.log('✅ Connected to MySQL server');

    // Read SQL file
    console.log('📖 Reading SQL file...');
    fs.readFile(sqlFile, 'utf8', (err, sql) => {
        if (err) {
            console.error('❌ Error reading SQL file:', err.message);
            connection.end();
            process.exit(1);
        }

        console.log('✅ SQL file read successfully');
        
        // Process SQL to handle DELIMITER statements (mysql2 doesn't support DELIMITER)
        // Remove DELIMITER statements and replace // with ; for triggers
        let processedSql = sql
            .replace(/DELIMITER \/\/\s*/g, '')
            .replace(/DELIMITER ;\s*/g, '')
            .replace(/END\/\/\s*/g, 'END;')
            .replace(/\/\/\s*/g, ';');
        
        // Replace the database name in the SQL file
        processedSql = processedSql.replace(/`reels_management`/g, `\`${dbName}\``);

        console.log('🔧 Executing SQL statements...');

        // Execute SQL
        connection.query(processedSql, (err, results) => {
            if (err) {
                console.error('❌ Error executing SQL:', err.message);
                console.error('   Error code:', err.code);
                connection.end();
                process.exit(1);
            }

            console.log('✅ Database setup completed successfully!');
            console.log('\n📊 Summary:');
            console.log(`   ✅ Database '${dbName}' created`);
            console.log('   ✅ All tables created');
            console.log('   ✅ Seed data imported');
            console.log('\n🎉 You can now start your server!');
            console.log('   Run: npm start');
            console.log('\n🔐 Default Admin Login:');
            console.log('   Email: admin@reelsmanagement.com');
            console.log('   Password: Admin@123');
            
            connection.end();
            process.exit(0);
        });
    });
});