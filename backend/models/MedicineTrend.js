const mongoose = require('mongoose');

// ── Search Log (raw events) ────────────────────────────────────────────────────
const searchLogSchema = new mongoose.Schema(
  {
    medicineName: { type: String, required: true, lowercase: true, trim: true },
    location:     { lat: Number, lng: Number, city: String },
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resultCount:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

searchLogSchema.index({ createdAt: 1 });

// ── Trend (aggregated daily) ────────────────────────────────────────────────────
const trendSchema = new mongoose.Schema(
  {
    medicineName: { type: String, required: true, lowercase: true, trim: true },
    date:         { type: String, required: true }, // "YYYY-MM-DD"
    searchCount:  { type: Number, default: 0 },
    category:     { type: String },
  },
  { timestamps: true }
);

trendSchema.index({ medicineName: 1, date: 1 }, { unique: true });

module.exports = {
  MedicineSearchLog: mongoose.model('MedicineSearchLog', searchLogSchema),
  MedicineTrend:     mongoose.model('MedicineTrend', trendSchema),
};
