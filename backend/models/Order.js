const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
    items: [
      {
        medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
        name:     String,
        quantity: Number,
        price:    Number,
      },
    ],
    totalAmount:    { type: Number, required: true },
    status:         { type: String, enum: ['pending','confirmed','preparing','out_for_delivery','delivered','cancelled'], default: 'pending' },
    deliveryAddress:{ type: String },
    deliveryType:   { type: String, enum: ['pickup','delivery'], default: 'delivery' },
    paymentMethod:  { type: String, enum: ['cash','online','card'], default: 'cash' },
    paymentStatus:  { type: String, enum: ['pending','paid'], default: 'pending' },
    estimatedTime:  { type: Number }, // minutes
    notes:          { type: String },
    statusHistory: [
      {
        status: String,
        time:   { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
