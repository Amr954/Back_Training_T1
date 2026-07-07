const multer = require('multer')

// memory storage: keeps the file as a buffer in RAM, never touches disk
const storage = multer.memoryStorage()

const imageUpload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5 MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/png", "image/jpg", "image/jpeg"]
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error("Only .png, .jpg, and .jpeg formats are allowed"), false)
        }
    }
})

module.exports = imageUpload