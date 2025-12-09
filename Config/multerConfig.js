const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        try {
            // Check for custom filename in header or query parameter
            let customFilename = req.headers['x-filename'] || req.query.filename;
            
            if (customFilename) {
                // Ensure the filename has the correct extension
                const ext = file.originalname ? path.extname(file.originalname) : '.mp4';
                if (!customFilename.endsWith(ext)) {
                    customFilename += ext;
                }
                cb(null, customFilename);
            } else {
                // Generate unique filename if no custom filename provided
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = file.originalname ? path.extname(file.originalname) : '.mp4';
                cb(null, file.fieldname + '-' + uniqueSuffix + ext);
            }
        } catch (error) {
            // Fallback to default naming if there's an error
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = file.originalname ? path.extname(file.originalname) : '.mp4';
            cb(null, file.fieldname + '-' + uniqueSuffix + ext);
        }
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 500 * 1024 * 1024, // Increase limit to 500MB for large video files
        files: 5, // Allow up to 5 files
        fieldSize: 10 * 1024 * 1024 // Increase field size limit
    },
    fileFilter: (req, file, cb) => {
        // Allow video files
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else if (file.mimetype.startsWith('image/')) {
            // Allow image files for thumbnails
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only video and image files are allowed.'));
        }
    }
});

module.exports = upload;