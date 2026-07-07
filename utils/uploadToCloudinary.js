const cloudinary = require('../.config/cloudinary')
const streamifier = require('streamifier')

const uploadToCloudinary = (fileBuffer, folder = 'uploads') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (result) resolve(result)
                else reject(error)
            }
        )
        streamifier.createReadStream(fileBuffer).pipe(uploadStream)
    })
}

module.exports = uploadToCloudinary