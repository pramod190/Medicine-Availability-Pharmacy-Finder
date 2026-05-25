const router    = require('express').Router();
const Order     = require('../models/Order');
const Inventory = require('../models/Inventory');
const Pharmacy  = require('../models/Pharmacy');
const { auth } = require('../middleware/auth');

async function authorizePharmacyAccess(req, pharmacyId) {
  if (req.user.role === 'admin') return true;
  const pharmacy = await Pharmacy.findById(pharmacyId);
  if (!pharmacy) return null;
  return pharmacy.owner?.toString() === req.user._id.toString();
}

// ── Create order ───────────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { pharmacyId, items, deliveryAddress, deliveryType, paymentMethod, notes } = req.body;

    const totalAmount = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const order = await Order.create({
      user: req.user._id,
      pharmacy: pharmacyId,
      items,
      totalAmount,
      deliveryAddress,
      deliveryType: deliveryType || 'delivery',
      paymentMethod: paymentMethod || 'cash',
      notes,
      estimatedTime: deliveryType === 'pickup' ? 15 : 45,
      statusHistory: [{ status: 'pending' }],
    });

    const populated = await order.populate(['pharmacy', { path: 'items.medicine', select: 'name' }]);
    const io = req.app.get('io');
    if (io) io.to(`pharmacy-${pharmacyId}`).emit('new-order', populated);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get user orders ────────────────────────────────────────────────────────────
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('pharmacy', 'name address phone')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get pharmacy orders ────────────────────────────────────────────────────────
router.get('/pharmacy/:pharmacyId', auth, async (req, res) => {
  try {
    const allowed = await authorizePharmacyAccess(req, req.params.pharmacyId);
    if (allowed === null) return res.status(404).json({ message: 'Pharmacy not found' });
    if (!allowed) return res.status(403).json({ message: 'Access denied' });

    const orders = await Order.find({ pharmacy: req.params.pharmacyId })
      .populate('user', 'name phone email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Update order status ────────────────────────────────────────────────────────
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const allowed = await authorizePharmacyAccess(req, order.pharmacy);
    if (allowed === null) return res.status(404).json({ message: 'Order pharmacy not found' });
    if (!allowed) return res.status(403).json({ message: 'Access denied' });

    order.status = status;
    order.statusHistory.push({ status });
    await order.save();

    const io = req.app.get('io');
    if (io) io.to(`user-${order.user}`).emit('order-update', { orderId: order._id, status });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
