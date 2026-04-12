const router    = require('express').Router();
const Inventory = require('../models/Inventory');
const Pharmacy  = require('../models/Pharmacy');
const { auth, pharmacyAdmin } = require('../middleware/auth');

// ── Get inventory for a pharmacy ───────────────────────────────────────────────
router.get('/pharmacy/:pharmacyId', auth, async (req, res) => {
  try {
    const inventory = await Inventory.find({ pharmacy: req.params.pharmacyId })
      .populate('medicine', 'name genericName dosage form category')
      .sort({ stock: 1 });
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Add or update inventory item ───────────────────────────────────────────────
router.post('/update', auth, pharmacyAdmin, async (req, res) => {
  try {
    const { pharmacyId, medicineId, stock, price, mrp, expiry, batchNo } = req.body;

    let item = await Inventory.findOne({ pharmacy: pharmacyId, medicine: medicineId });
    if (item) {
      const diff = stock - item.stock;
      item.stock  = stock;
      item.price  = price;
      item.mrp    = mrp || item.mrp;
      item.expiry = expiry || item.expiry;
      item.batchNo= batchNo || item.batchNo;
      item.history.push({ action: diff >= 0 ? 'add' : 'adjust', quantity: Math.abs(diff), note: 'Manual update' });
    } else {
      item = new Inventory({ pharmacy: pharmacyId, medicine: medicineId, stock, price, mrp, expiry, batchNo });
      item.history.push({ action: 'add', quantity: stock });
    }
    await item.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      const populated = await item.populate('medicine', 'name genericName dosage');
      io.to(`pharmacy-${pharmacyId}`).emit('inventory-update', populated);
      io.emit('stock-update', { pharmacyId, medicineId, stock: item.stock });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Sell (decrement stock) ─────────────────────────────────────────────────────
router.post('/sell', auth, async (req, res) => {
  try {
    const { pharmacyId, medicineId, quantity } = req.body;
    const item = await Inventory.findOne({ pharmacy: pharmacyId, medicine: medicineId });
    if (!item) return res.status(404).json({ message: 'Item not found in inventory' });
    if (item.stock < quantity) return res.status(400).json({ message: 'Insufficient stock' });

    item.stock -= quantity;
    item.history.push({ action: 'sell', quantity });
    await item.save();

    const io = req.app.get('io');
    if (io) io.emit('stock-update', { pharmacyId, medicineId, stock: item.stock });

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Delete inventory item ──────────────────────────────────────────────────────
router.delete('/:id', auth, pharmacyAdmin, async (req, res) => {
  try {
    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Low stock alerts ───────────────────────────────────────────────────────────
router.get('/alerts/:pharmacyId', auth, async (req, res) => {
  try {
    const items = await Inventory.find({
      pharmacy: req.params.pharmacyId,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    }).populate('medicine', 'name dosage');
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
