const mongoose = require('mongoose');

const medicineRequestSchema = new mongoose.Schema(
  {
    user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    medicineName: { type: String, required: true, trim: true },
    userLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: String,
    },
    radius:   { type: Number, default: 5 }, // km
    status:   { type: String, enum: ['pending','fulfilled','expired'], default: 'pending' },
    urgent:   { type: Boolean, default: false },
    responses: [
      {
        pharmacy:    { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy' },
        available:   Boolean,
        stock:       Number,
        price:       Number,
        respondedAt: { type: Date, default: Date.now },
      },
    ],
    expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicineRequest', medicineRequestSchema);
