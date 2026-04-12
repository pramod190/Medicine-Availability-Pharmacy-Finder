const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    owner:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email:   { type: String, lowercase: true },
    phone:   { type: String, required: true },
    address: { type: String, required: true },
    location: {
      type:        { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    openHours:   { type: String, default: '9:00 AM – 10:00 PM' },
    isOpen24:    { type: Boolean, default: false },
    isVerified:  { type: Boolean, default: false },
    rating:      { type: Number, default: 0, min: 0, max: 5 },
    totalRatings:{ type: Number, default: 0 },
    reviews: [
      {
        user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating:  Number,
        comment: String,
        date:    { type: Date, default: Date.now },
      },
    ],
    deliveryAvailable: { type: Boolean, default: false },
    deliveryRadius:    { type: Number, default: 5 }, // km
  },
  { timestamps: true }
);

pharmacySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Pharmacy', pharmacySchema);
