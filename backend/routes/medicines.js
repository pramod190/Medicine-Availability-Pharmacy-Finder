const router  = require('express').Router();
const Medicine = require('../models/Medicine');
const Inventory = require('../models/Inventory');
const { MedicineSearchLog } = require('../models/MedicineTrend');
const { auth } = require('../middleware/auth');
const Fuse = require('fuse.js');

// ── Search medicines & find pharmacies with stock ─────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const { name, lat, lng, radius = 10, emergency } = req.query;
    if (!name) return res.status(400).json({ message: 'Medicine name required' });

    // Text search + fuzzy fallback
    let medicines = await Medicine.find({ $text: { $search: name } }, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(10);

    if (medicines.length === 0) {
      const allMeds = await Medicine.find({}, 'name genericName brand');
      const fuse = new Fuse(allMeds, { keys: ['name', 'genericName', 'brand'], threshold: 0.4 });
      medicines = fuse.search(name).slice(0, 10).map((r) => r.item);
    }

    // Log search
    await MedicineSearchLog.create({
      medicineName: name.toLowerCase(),
      location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : {},
      resultCount: medicines.length,
    }).catch(() => {});

    // For each medicine find inventory with stock
    const medIds = medicines.map((m) => m._id);
    const inventoryQuery = { medicine: { $in: medIds }, stock: { $gt: 0 } };

    let inventories = await Inventory.find(inventoryQuery)
      .populate('medicine', 'name genericName dosage form category')
      .populate({
        path: 'pharmacy',
        select: 'name address phone location rating isOpen24 openHours deliveryAvailable',
      });

    // Distance filter if location provided
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const R = 6371;
      inventories = inventories
        .map((inv) => {
          const [pLng, pLat] = inv.pharmacy.location.coordinates;
          const dLat = ((pLat - userLat) * Math.PI) / 180;
          const dLng = ((pLng - userLng) * Math.PI) / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos((userLat * Math.PI) / 180) * Math.cos((pLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
          const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return { ...inv.toObject(), distance: parseFloat(distance.toFixed(2)) };
        })
        .filter((inv) => inv.distance <= parseFloat(radius))
        .sort((a, b) => (emergency ? a.distance - b.distance : a.distance - b.distance));
    }

    res.json({ medicines, inventories, total: inventories.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Autocomplete suggestions ───────────────────────────────────────────────────
router.get('/suggest', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const meds = await Medicine.find(
      {
        $or: [
          { name:        { $regex: q, $options: 'i' } },
          { genericName: { $regex: q, $options: 'i' } },
          { brand:       { $regex: q, $options: 'i' } },
          { category:    { $regex: q, $options: 'i' } },
        ],
      },
      'name genericName brand dosage category'
    ).limit(10);
    res.json(meds);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get substitutes ────────────────────────────────────────────────────────────
router.get('/:id/substitutes', async (req, res) => {
  try {
    const med = await Medicine.findById(req.params.id).populate('substitutes');
    if (!med) return res.status(404).json({ message: 'Medicine not found' });
    res.json(med.substitutes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get all medicines ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const filter = category ? { category } : {};
    const medicines = await Medicine.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Medicine.countDocuments(filter);
    res.json({ medicines, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get single medicine ────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const med = await Medicine.findById(req.params.id).populate('substitutes', 'name genericName dosage');
    if (!med) return res.status(404).json({ message: 'Medicine not found' });
    res.json(med);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
