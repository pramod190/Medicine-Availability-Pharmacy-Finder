const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    genericName:  { type: String, trim: true },
    brand:        { type: String, trim: true },
    category:     { type: String, enum: ['Analgesic','Antibiotic','Antiviral','Antifungal','Antidiabetic','Cardiovascular','Respiratory','Gastrointestinal','Vitamin','Other'], default: 'Other' },
    dosage:       { type: String },          // e.g. "500mg"
    form:         { type: String, enum: ['Tablet','Capsule','Syrup','Injection','Cream','Drops','Inhaler','Other'], default: 'Tablet' },
    prescription: { type: Boolean, default: false },
    description:  { type: String },
    substitutes:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' }],
    tags:         [String],
    imageUrl:     { type: String, default: '' },
  },
  { timestamps: true }
);

medicineSchema.index({ name: 'text', genericName: 'text', brand: 'text', tags: 'text' });

module.exports = mongoose.model('Medicine', medicineSchema);
