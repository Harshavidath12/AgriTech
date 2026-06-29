const express = require('express');
const upload = require('../config/cloudinary');

const router = express.Router();

/**
 * @desc    Upload multiple images
 * @route   POST /api/upload
 * @access  Public (in production, should be protected if only users can upload)
 */
router.post('/', upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    // Construct the URLs for the uploaded files from Cloudinary
    const fileUrls = req.files.map(file => {
      return file.path; // Cloudinary HTTPS URL is in req.files[x].path
    });

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      urls: fileUrls
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, message: 'Server error during upload' });
  }
});

module.exports = router;
