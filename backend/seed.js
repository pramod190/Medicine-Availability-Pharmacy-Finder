require('dotenv').config();
const mongoose  = require('mongoose');
const bcrypt    = require('bcryptjs');
const User      = require('./models/User');
const Medicine  = require('./models/Medicine');
const Pharmacy  = require('./models/Pharmacy');
const Inventory = require('./models/Inventory');
const { MedicineSearchLog } = require('./models/MedicineTrend');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medicine_finder';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing
  await Promise.all([
    User.deleteMany(), Medicine.deleteMany(), Pharmacy.deleteMany(),
    Inventory.deleteMany(), MedicineSearchLog.deleteMany(),
  ]);
  console.log('Cleared existing data');

  // ── Users ────────────────────────────────────────────────────────────────────
  const hashedPass = await bcrypt.hash('password123', 10);
  const [admin, pharmAdmin, user1] = await User.insertMany([
    { name: 'Admin User',      email: 'admin@medifind.com',   password: hashedPass, role: 'admin',          phone: '9000000001', location: { coordinates: [78.4867, 17.3850] } },
    { name: 'Ravi Pharmacy',   email: 'ravi@pharmacy.com',    password: hashedPass, role: 'pharmacy_admin', phone: '9000000002', location: { coordinates: [78.4900, 17.3870] } },
    { name: 'Priya Sharma',    email: 'priya@example.com',    password: hashedPass, role: 'user',           phone: '9000000003', location: { coordinates: [78.4850, 17.3840] } },
  ]);
  console.log('Users seeded');

  // ── Medicines ─────────────────────────────────────────────────────────────────
  const medicines = await Medicine.insertMany([
    { name: 'Paracetamol 500mg',   genericName: 'Acetaminophen',      brand: 'Crocin',        category: 'Analgesic',      dosage: '500mg', form: 'Tablet',   prescription: false, tags: ['fever','pain','headache','crocin','calpol'] },
    { name: 'Paracetamol 650mg',   genericName: 'Acetaminophen',      brand: 'Dolo 650',      category: 'Analgesic',      dosage: '650mg', form: 'Tablet',   prescription: false, tags: ['fever','pain','dolo','crocin'] },
    { name: 'Azithromycin 500mg',  genericName: 'Azithromycin',       brand: 'Azithral',      category: 'Antibiotic',     dosage: '500mg', form: 'Tablet',   prescription: true,  tags: ['antibiotic','infection','z-pack'] },
    { name: 'Amoxicillin 500mg',   genericName: 'Amoxicillin',        brand: 'Mox',           category: 'Antibiotic',     dosage: '500mg', form: 'Capsule',  prescription: true,  tags: ['antibiotic','infection'] },
    { name: 'Metformin 500mg',     genericName: 'Metformin HCl',      brand: 'Glucophage',    category: 'Antidiabetic',   dosage: '500mg', form: 'Tablet',   prescription: true,  tags: ['diabetes','sugar','metformin'] },
    { name: 'Insulin Glargine',    genericName: 'Insulin Glargine',   brand: 'Lantus',        category: 'Antidiabetic',   dosage: '100IU/mL', form: 'Injection', prescription: true, tags: ['insulin','diabetes','injection'] },
    { name: 'Cetirizine 10mg',     genericName: 'Cetirizine HCl',     brand: 'Cetzine',       category: 'Other',          dosage: '10mg', form: 'Tablet',   prescription: false, tags: ['allergy','antihistamine','cold'] },
    { name: 'Pantoprazole 40mg',   genericName: 'Pantoprazole',       brand: 'Pan 40',        category: 'Gastrointestinal', dosage: '40mg', form: 'Tablet', prescription: false, tags: ['acidity','gastric','stomach'] },
    { name: 'Atorvastatin 10mg',   genericName: 'Atorvastatin',       brand: 'Lipitor',       category: 'Cardiovascular', dosage: '10mg', form: 'Tablet',   prescription: true,  tags: ['cholesterol','heart','statin'] },
    { name: 'Amlodipine 5mg',      genericName: 'Amlodipine',         brand: 'Amlokind',      category: 'Cardiovascular', dosage: '5mg',  form: 'Tablet',   prescription: true,  tags: ['blood pressure','hypertension','bp'] },
    { name: 'Vitamin D3 60000IU',  genericName: 'Cholecalciferol',    brand: 'D-Rise',        category: 'Vitamin',        dosage: '60000IU', form: 'Capsule', prescription: false, tags: ['vitamin d','vitamin','supplement'] },
    { name: 'Vitamin C 500mg',     genericName: 'Ascorbic Acid',      brand: 'Limcee',        category: 'Vitamin',        dosage: '500mg', form: 'Tablet',  prescription: false, tags: ['vitamin c','immunity','ascorbic'] },
    { name: 'Salbutamol Inhaler',  genericName: 'Salbutamol',         brand: 'Asthalin',      category: 'Respiratory',    dosage: '100mcg', form: 'Inhaler', prescription: true,  tags: ['asthma','inhaler','breathing','wheezing'] },
    { name: 'Ibuprofen 400mg',     genericName: 'Ibuprofen',          brand: 'Brufen',        category: 'Analgesic',      dosage: '400mg', form: 'Tablet',  prescription: false, tags: ['pain','inflammation','nsaid'] },
    { name: 'Omeprazole 20mg',     genericName: 'Omeprazole',         brand: 'Omez',          category: 'Gastrointestinal', dosage: '20mg', form: 'Capsule', prescription: false, tags: ['acidity','ulcer','omez','stomach'] },
    { name: 'ORS Electrolyte',     genericName: 'ORS',                brand: 'Electral',      category: 'Other',          dosage: 'Sachet', form: 'Other', prescription: false, tags: ['dehydration','diarrhea','electrolyte','ors'] },
    { name: 'Cough Syrup Benadryl',genericName: 'Diphenhydramine',    brand: 'Benadryl',      category: 'Respiratory',    dosage: '100ml', form: 'Syrup',  prescription: false, tags: ['cough','cold','syrup','benadryl'] },
    { name: 'Ondansetron 4mg',     genericName: 'Ondansetron',        brand: 'Emeset',        category: 'Gastrointestinal', dosage: '4mg', form: 'Tablet',  prescription: true,  tags: ['vomiting','nausea','emeset'] },
    { name: 'Montelukast 10mg',    genericName: 'Montelukast',        brand: 'Montair',       category: 'Respiratory',    dosage: '10mg', form: 'Tablet',  prescription: true,  tags: ['asthma','allergy','montair'] },
    { name: 'Diclofenac Gel',      genericName: 'Diclofenac Sodium',  brand: 'Voveran Gel',   category: 'Analgesic',      dosage: '30g',  form: 'Cream',   prescription: false, tags: ['joint pain','muscle pain','topical'] },
  ]);

  // Set substitutes
  await Medicine.findByIdAndUpdate(medicines[0]._id, { substitutes: [medicines[1]._id, medicines[13]._id] });
  await Medicine.findByIdAndUpdate(medicines[1]._id, { substitutes: [medicines[0]._id, medicines[13]._id] });
  await Medicine.findByIdAndUpdate(medicines[2]._id, { substitutes: [medicines[3]._id] });
  console.log('Medicines seeded');

  // ── Pharmacies (Hyderabad area) ────────────────────────────────────────────────
  const pharmacies = await Pharmacy.insertMany([
    {
      name: 'MedPlus Pharmacy',        owner: pharmAdmin._id, phone: '9100000001',
      address: 'Banjara Hills, Road No. 12, Hyderabad',
      location: { coordinates: [78.4480, 17.4126] },
      openHours: '8:00 AM – 11:00 PM', rating: 4.5, totalRatings: 128,
      deliveryAvailable: true, deliveryRadius: 5, isVerified: true,
    },
    {
      name: 'Apollo Pharmacy',          owner: pharmAdmin._id, phone: '9100000002',
      address: 'Jubilee Hills, Hyderabad',
      location: { coordinates: [78.4070, 17.4313] },
      openHours: '8:00 AM – 10:00 PM', rating: 4.3, totalRatings: 92,
      deliveryAvailable: true, deliveryRadius: 7, isVerified: true,
    },
    {
      name: 'Wellness Forever',         owner: pharmAdmin._id, phone: '9100000003',
      address: 'Madhapur, HITEC City, Hyderabad',
      location: { coordinates: [78.3921, 17.4489] },
      openHours: '24 Hours', isOpen24: true, rating: 4.1, totalRatings: 74,
      deliveryAvailable: true, deliveryRadius: 4, isVerified: true,
    },
    {
      name: 'Generic Medical Store',    owner: pharmAdmin._id, phone: '9100000004',
      address: 'Ameerpet, Hyderabad',
      location: { coordinates: [78.4495, 17.4374] },
      openHours: '9:00 AM – 9:00 PM', rating: 3.9, totalRatings: 45,
      deliveryAvailable: false, isVerified: false,
    },
    {
      name: 'Life Pharmacy',            owner: pharmAdmin._id, phone: '9100000005',
      address: 'Kukatpally, Hyderabad',
      location: { coordinates: [78.4122, 17.4847] },
      openHours: '8:00 AM – 11:00 PM', rating: 4.2, totalRatings: 61,
      deliveryAvailable: true, deliveryRadius: 6, isVerified: true,
    },
    {
      name: 'Netcare Pharmacy',         owner: pharmAdmin._id, phone: '9100000006',
      address: 'Gachibowli, Hyderabad',
      location: { coordinates: [78.3581, 17.4435] },
      openHours: '24 Hours', isOpen24: true, rating: 4.6, totalRatings: 189,
      deliveryAvailable: true, deliveryRadius: 8, isVerified: true,
    },
    {
      name: 'Sree Lakshmi Medical',     owner: pharmAdmin._id, phone: '9100000007',
      address: 'SR Nagar, Hyderabad',
      location: { coordinates: [78.4564, 17.4451] },
      openHours: '9:00 AM – 10:00 PM', rating: 4.0, totalRatings: 38,
      deliveryAvailable: false, isVerified: false,
    },
  ]);
  console.log('Pharmacies seeded');

  // ── Inventory ──────────────────────────────────────────────────────────────────
  const inventoryData = [];
  const expiryDate = new Date('2027-06-30');

  pharmacies.forEach((pharmacy, pi) => {
    medicines.forEach((medicine, mi) => {
      const inStock = Math.random() > 0.25; // 75% chance in stock
      if (inStock) {
        const stock = Math.floor(Math.random() * 100) + 5;
        const basePrice = 20 + mi * 8 + pi * 3;
        inventoryData.push({
          pharmacy: pharmacy._id, medicine: medicine._id,
          stock, price: basePrice, mrp: Math.round(basePrice * 1.15),
          expiry: expiryDate, batchNo: `BATCH-${pi}${mi}${Date.now()}`,
          lowStockThreshold: 10,
          history: [{ action: 'add', quantity: stock, note: 'Initial stock' }],
        });
      }
    });
  });

  await Inventory.insertMany(inventoryData);
  console.log(`Inventory seeded: ${inventoryData.length} items`);

  // ── Search Logs (historical data for analytics) ────────────────────────────────
  const popularSearches = ['paracetamol','azithromycin','dolo 650','crocin','insulin','cetirizine','omez','metformin','vitamin d','ibuprofen','benadryl','paracitamol','insulin','cough syrup','vitamin c'];
  const searchLogs = [];
  for (let i = 0; i < 200; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    searchLogs.push({
      medicineName: popularSearches[Math.floor(Math.random() * popularSearches.length)],
      location: { lat: 17.38 + Math.random() * 0.1, lng: 78.47 + Math.random() * 0.1 },
      createdAt: date,
    });
  }
  await MedicineSearchLog.insertMany(searchLogs);
  console.log('Search logs seeded');

  console.log('\n✅ Seed complete!');
  console.log('─────────────────────────────────────');
  console.log('Demo Accounts:');
  console.log('  User:           priya@example.com   / password123');
  console.log('  Pharmacy Admin: ravi@pharmacy.com   / password123');
  console.log('  Admin:          admin@medifind.com  / password123');
  console.log('─────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
