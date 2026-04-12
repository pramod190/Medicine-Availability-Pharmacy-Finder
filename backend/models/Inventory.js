const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    pharmacy:   { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
    medicine:   { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    stock:      { type: Number, required: true, min: 0, default: 0 },
    price:      { type: Number, required: true, min: 0 },
    mrp:        { type: Number },
    expiry:     { type: Date },
    batchNo:    { type: String },
    lowStockThreshold: { type: Number, default: 10 },
    history: [
      {
        action:   { type: String, enum: ['add','sell','expire','adjust'] },
        quantity: Number,
        date:     { type: Date, default: Date.now },
        note:     String,
      },
    ],
  },
  { timestamps: true }
);

inventorySchema.index({ pharmacy: 1, medicine: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventorySchema);
