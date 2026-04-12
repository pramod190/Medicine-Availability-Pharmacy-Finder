const router = require('express').Router();
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { auth } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only images and PDFs allowed'));
  },
});

// ── Upload prescription (mock OCR extraction) ─────────────────────────────────
router.post('/upload', auth, upload.single('prescription'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // In production, integrate with Google Vision API or AWS Textract
    // For demo purposes, returning mock extracted medicines
    const mockExtracted = [
      { name: 'Paracetamol 500mg', dosage: '1 tablet thrice daily', duration: '5 days' },
      { name: 'Azithromycin 500mg', dosage: '1 tablet once daily', duration: '3 days' },
      { name: 'Vitamin C 1000mg', dosage: '1 tablet daily', duration: '7 days' },
    ];

    res.json({
      file: req.file.filename,
      fileUrl: `/uploads/${req.file.filename}`,
      extractedMedicines: mockExtracted,
      message: 'Prescription processed successfully',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
