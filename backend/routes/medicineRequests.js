const router  = require('express').Router();
const MedicineRequest = require('../models/MedicineRequest');
const Pharmacy = require('../models/Pharmacy');
const { auth } = require('../middleware/auth');

// ── Create request (broadcast to nearby pharmacies) ────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { medicineName, lat, lng, address, radius = 5, urgent } = req.body;

    const request = await MedicineRequest.create({
      user: req.user._id,
      medicineName,
      userLocation: { lat, lng, address },
      radius,
      urgent,
    });

    // Find nearby pharmacy admins and notify via socket
    const nearbyPharmacies = await Pharmacy.find({
      location: {
        $near: {
          $geometry:    { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radius * 1000,
        },
      },
    }).select('_id name');

    const io = req.app.get('io');
    if (io) {
      for (const p of nearbyPharmacies) {
        io.to(`pharmacy-${p._id}`).emit('medicine-request', {
          requestId: request._id,
          medicineName,
          userDistance: radius,
          urgent,
        });
      }
    }

    res.status(201).json({ request, notifiedPharmacies: nearbyPharmacies.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Pharmacy responds to a request ────────────────────────────────────────────
router.post('/:id/respond', auth, async (req, res) => {
  try {
    const { pharmacyId, available, stock, price } = req.body;
    const request = await MedicineRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.responses.push({ pharmacy: pharmacyId, available, stock, price });
    if (available) request.status = 'fulfilled';
    await request.save();

    const io = req.app.get('io');
    if (io && available) {
      const pharmacy = await Pharmacy.findById(pharmacyId, 'name address phone');
      io.to(`user-${request.user}`).emit('request-fulfilled', {
        requestId: request._id,
        pharmacy,
        medicineName: request.medicineName,
        stock,
        price,
      });
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get user's requests ────────────────────────────────────────────────────────
router.get('/my', auth, async (req, res) => {
  try {
    const requests = await MedicineRequest.find({ user: req.user._id })
      .populate('responses.pharmacy', 'name address phone rating')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get pending requests for a pharmacy area ───────────────────────────────────
router.get('/nearby-requests', auth, async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;
    const requests = await MedicineRequest.find({
      status: 'pending',
      expiresAt: { $gt: new Date() },
    }).populate('user', 'name');

    // Filter by distance
    const R = 6371;
    const filtered = requests.filter((r) => {
      const dLat = ((r.userLocation.lat - lat) * Math.PI) / 180;
      const dLng = ((r.userLocation.lng - lng) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat * Math.PI) / 180) * Math.cos((r.userLocation.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return dist <= parseFloat(radius);
    });

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
