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
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
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