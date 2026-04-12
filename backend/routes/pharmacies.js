const router   = require('express').Router();
const Pharmacy = require('../models/Pharmacy');
const Inventory = require('../models/Inventory');
const { auth, pharmacyAdmin } = require('../middleware/auth');

// ── Get nearby pharmacies ──────────────────────────────────────────────────────
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    if (!lat || !lng) return res.status(400).json({ message: 'lat and lng required' });

    const pharmacies = await Pharmacy.find({
      location: {
        $near: {
          $geometry:    { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000,
        },
      },
    }).limit(20);

    // Calculate distances
    const R = 6371;
    const withDistance = pharmacies.map((p) => {
      const [pLng, pLat] = p.location.coordinates;
      const dLat = ((pLat - parseFloat(lat)) * Math.PI) / 180;
      const dLng = ((pLng - parseFloat(lng)) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((parseFloat(lat) * Math.PI) / 180) * Math.cos((pLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { ...p.toObject(), distance: parseFloat(dist.toFixed(2)) };
    });

    res.json(withDistance.sort((a, b) => a.distance - b.distance));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get all pharmacies ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find().limit(50);
    res.json(pharmacies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get single pharmacy ────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id).populate('owner', 'name email');
    if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });
    res.json(pharmacy);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get pharmacy inventory ─────────────────────────────────────────────────────
router.get('/:id/inventory', async (req, res) => {
  try {
    const inventory = await Inventory.find({ pharmacy: req.params.id })
      .populate('medicine', 'name genericName dosage form category');
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Create pharmacy ────────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const pharmacy = await Pharmacy.create({ ...req.body, owner: req.user._id });
    await require('../models/User').findByIdAndUpdate(req.user._id, { role: 'pharmacy_admin' });
    res.status(201).json(pharmacy);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Add review ─────────────────────────────────────────────────────────────────
router.post('/:id/review', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) return res.status(404).json({ message: 'Not found' });

    pharmacy.reviews.push({ user: req.user._id, rating, comment });
    const total = pharmacy.reviews.reduce((s, r) => s + r.rating, 0);
    pharmacy.rating = parseFloat((total / pharmacy.reviews.length).toFixed(1));
    pharmacy.totalRatings = pharmacy.reviews.length;
    await pharmacy.save();
    res.json({ rating: pharmacy.rating, totalRatings: pharmacy.totalRatings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
