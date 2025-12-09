const db = require('../Config/db');

// Check if oc_reel_category table exists
const checkTable = (tableName) => {
    return new Promise((resolve, reject) => {
        const query = `SHOW TABLES LIKE '${tableName}'`;
        db.query(query, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results.length > 0);
            }
        });
    });
};

// Check table structure
const describeTable = (tableName) => {
    return new Promise((resolve, reject) => {
        const query = `DESCRIBE ${tableName}`;
        db.query(query, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

// Run the checks
async function run() {
    try {
        console.log('Checking database tables...');
        
        const ocReelCategoryExists = await checkTable('oc_reel_category');
        console.log('oc_reel_category table exists:', ocReelCategoryExists);
        
        const categoriesExists = await checkTable('categories');
        console.log('categories table exists:', categoriesExists);
        
        if (ocReelCategoryExists) {
            console.log('\n--- oc_reel_category table structure ---');
            const ocReelCategoryStructure = await describeTable('oc_reel_category');
            console.table(ocReelCategoryStructure);
        }
        
        if (categoriesExists) {
            console.log('\n--- categories table structure ---');
            const categoriesStructure = await describeTable('categories');
            console.table(categoriesStructure);
        }
        
        db.end();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        db.end();
        process.exit(1);
    }
}

run();