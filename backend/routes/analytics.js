const router = require('express').Router();
const { MedicineSearchLog, MedicineTrend } = require('../models/MedicineTrend');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');

// ── Top searched medicines (last N days) ──────────────────────────────────────
router.get('/top-searches', async (req, res) => {
  try {
    const { days = 7, limit = 10 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const results = await MedicineSearchLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$medicineName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      { $project: { medicineName: '$_id', count: 1, _id: 0 } },
    ]);

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Daily search trends ────────────────────────────────────────────────────────
router.get('/daily-trends', async (req, res) => {
  try {
    const { days = 14, medicine } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const matchStage = medicine
      ? { createdAt: { $gte: since }, medicineName: medicine.toLowerCase() }
      : { createdAt: { $gte: since } };

    const results = await MedicineSearchLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]);

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Low stock across all pharmacies ───────────────────────────────────────────
router.get('/low-stock', auth, async (req, res) => {
  try {
    const { pharmacyId } = req.query;
    const filter = pharmacyId ? { pharmacy: pharmacyId, $expr: { $lte: ['$stock', '$lowStockThreshold'] } }
                              : { $expr: { $lte: ['$stock', '$lowStockThreshold'] } };
    const items = await Inventory.find(filter)
      .populate('medicine', 'name dosage category')
      .populate('pharmacy', 'name address')
      .sort({ stock: 1 })
      .limit(20);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Summary stats ─────────────────────────────────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [searchesToday, totalSearches, totalOrders, pendingOrders] = await Promise.all([
      MedicineSearchLog.countDocuments({ createdAt: { $gte: today } }),
      MedicineSearchLog.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
    ]);

    res.json({ searchesToday, totalSearches, totalOrders, pendingOrders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Category distribution ─────────────────────────────────────────────────────
router.get('/categories', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const Medicine = require('../models/Medicine');
    const logs = await MedicineSearchLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$medicineName', count: { $sum: 1 } } },
    ]);

    const names = logs.map((l) => l._id);
    const meds = await Medicine.find({ name: { $in: names.map((n) => new RegExp(n, 'i')) } }, 'name category');

    const catMap = {};
    for (const log of logs) {
      const med = meds.find((m) => m.name.toLowerCase().includes(log._id));
      const cat = med?.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + log.count;
    }

    res.json(Object.entries(catMap).map(([category, count]) => ({ category, count })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
