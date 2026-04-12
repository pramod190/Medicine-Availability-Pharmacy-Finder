const router = require('express').Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');

// ── Gemini client ─────────────────────────────────────────────────────────────
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
  console.warn('⚠️  WARNING: GEMINI_API_KEY is not set. AI features will not work.');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const getModel = () => genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const cleanJSON = (text) =>
  text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

const generateLocalChatReply = (message) => {
  const q = (message || '').toLowerCase();
  const intro = `Hello! I'm MediBot, your AI pharmacy assistant. I can help you with information about medicines, dosages, and general health advice.\n\nFor your question: "${message}", here's some general information:\n\n`;
  const endings = '\nPlease remember this is general information only. For personalized medical advice, please consult a healthcare professional.';

  if (q.includes('pantoprazole')) {
    return intro +
      '• Pantoprazole is usually taken before food to work best for acidity and reflux.\n' +
      '• If you have stomach pain or acid symptoms, take it 30-60 minutes before meals.\n' +
      '• Do not stop the medicine without your doctor’s advice.\n' + endings;
  }

  if (q.includes('headache') || q.includes('fever')) {
    return intro +
      '• For mild headache and fever, Paracetamol (eg. Crocin) is commonly used in India.\n' +
      '• Follow the label dosage and do not exceed 4 grams per day.\n' +
      '• Rest and hydration are also important.\n' + endings;
  }

  if (q.includes('antihistamine')) {
    return intro +
      '• Cetirizine (Cetzine) is a common non-drowsy antihistamine that many people use at night.\n' +
      '• Levocetirizine is also generally considered safe for evening use.\n' +
      '• Avoid first-generation antihistamines like diphenhydramine if you want to reduce daytime drowsiness.\n' +
      '• Always check with your doctor if you have other health conditions.\n' + endings;
  }

  if (q.includes('ibuprofen') && q.includes('paracetamol')) {
    return intro +
      '• Paracetamol and ibuprofen can sometimes be used together for pain, but do not exceed the recommended dose of either.\n' +
      '• Use each medicine only for a short time and consult a doctor if symptoms persist.\n' + endings;
  }

  if (q.includes('azithromycin')) {
    return intro +
      '• Azithromycin (Azithral) is an antibiotic and usually requires a doctor’s prescription.\n' +
      '• It is not recommended for general pain or fever without medical advice.\n' + endings;
  }

  return intro +
    '• Common medicines such as Paracetamol (Crocin) can help with mild pain and fever.\n' +
    '• For allergies, Cetirizine (Cetzine) is commonly used and may be taken at night.\n' +
    '• Always follow the medicine label and consult a doctor for personalized advice.\n' + endings;
};

// ── Multer for prescription images ────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, `rx-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['.jpg', '.jpeg', '.png', '.webp'].includes(
      path.extname(file.originalname).toLowerCase()
    );
    cb(ok ? null : new Error('Only image files allowed'), ok);
  },
});

// 1. PRESCRIPTION OCR
router.post('/prescription-ocr', auth, upload.single('prescription'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const imgBuffer = fs.readFileSync(req.file.path);
    const base64 = imgBuffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';

    const model = getModel();
    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      {
        text: `You are a medical prescription reader. Carefully analyze this prescription image and extract all medicines.
Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "patientName": "string or null",
  "doctorName": "string or null",
  "date": "string or null",
  "medicines": [
    {
      "name": "medicine name",
      "dosage": "e.g. 500mg",
      "frequency": "e.g. twice daily",
      "duration": "e.g. 5 days",
      "instructions": "e.g. after meals or null"
    }
  ],
  "notes": "any additional notes or null"
}
If you cannot read the image clearly, still return the JSON structure with whatever you can extract.`,
      },
    ]);

    let extracted;
    try {
      extracted = JSON.parse(cleanJSON(result.response.text()));
    } catch {
      extracted = { medicines: [], notes: 'Could not parse prescription clearly.' };
    }

    fs.unlink(req.file.path, () => { });
    res.json({ success: true, extracted, fileUrl: `/uploads/${req.file.filename}` });
  } catch (err) {
    console.error('OCR error:', err.message);
    if (req.file) {
      fs.unlink(req.file.path, () => { });
      return res.json({
        success: true,
        extracted: {
          patientName: null,
          doctorName: null,
          date: null,
          medicines: [],
          notes: 'Prescription analysis is unavailable right now. Please verify medicine details manually.',
        },
        fileUrl: `/uploads/${req.file.filename}`,
      });
    }
    res.status(500).json({ message: err.message || 'OCR failed. Check your GEMINI_API_KEY.' });
  }
});

// 2. SMART SUBSTITUTE ENGINE
router.post('/substitutes', async (req, res) => {
  try {
    const { medicineName, reason = 'out of stock', patientInfo = '' } = req.body;
    if (!medicineName) return res.status(400).json({ message: 'medicineName required' });

    const key = process.env.GEMINI_API_KEY || '';
    const apiKeyMissing = !key || key === 'your_gemini_api_key_here' || key.length < 10;

    if (!apiKeyMissing) {
      try {
        const model = getModel();
        const result = await model.generateContent(
          `You are a clinical pharmacist. A patient cannot get "${medicineName}" (reason: ${reason}).
${patientInfo ? `Patient context: ${patientInfo}` : ''}
Suggest the best substitute medicines. Return ONLY valid JSON (no markdown, no code fences):
{
  "originalMedicine": "${medicineName}",
  "reason": "${reason}",
  "substitutes": [
    {
      "name": "medicine name with strength",
      "genericName": "generic/chemical name",
      "sameClass": true,
      "equivalentDose": "equivalent dosage",
      "availability": "commonly available / prescription needed / OTC",
      "notes": "brief clinical note about this substitute",
      "cautions": "any important caution or null"
    }
  ],
  "generalAdvice": "brief advice for the patient",
  "consultDoctor": true
}
Provide 3-4 substitutes. Prioritize commonly available Indian brands.`
        );
        let parsed;
        try { parsed = JSON.parse(cleanJSON(result.response.text())); }
        catch { parsed = null; }
        if (parsed) return res.json({ success: true, ...parsed });
      } catch (geminiErr) {
        console.warn('Gemini substitutes error, using fallback:', geminiErr.message);
      }
    }

    // Local fallback response
    res.json({
      success: true,
      originalMedicine: medicineName,
      reason,
      substitutes: [
        {
          name: `Generic ${medicineName}`,
          genericName: 'Consult pharmacist for generic name',
          sameClass: true,
          equivalentDose: 'Same strength — consult pharmacist',
          availability: 'Commonly available',
          notes: `A pharmacist can suggest the best generic equivalent for ${medicineName} available in your area.`,
          cautions: 'Verify equivalent dose with a pharmacist before switching.',
        },
        {
          name: 'Ask your pharmacist for alternatives',
          genericName: 'N/A',
          sameClass: true,
          equivalentDose: 'N/A',
          availability: 'Varies by location',
          notes: 'Your pharmacist will have up-to-date information on locally available substitutes with the same active ingredient.',
          cautions: 'Always confirm with your doctor or pharmacist before switching medicines.',
        },
      ],
      generalAdvice: `Since ${medicineName} is ${reason.toLowerCase()}, speak directly with your pharmacist — they can check their stock and suggest the closest available alternative from the same drug class.`,
      consultDoctor: true,
    });
  } catch (err) {
    console.error('Substitutes error:', err.message);
    res.status(500).json({ message: err.message || 'Failed to fetch substitutes.' });
  }
});

// 3. DRUG INTERACTION CHECKER
router.post('/interactions', async (req, res) => {
  try {
    const { medicines } = req.body;
    if (!medicines || medicines.length < 2)
      return res.status(400).json({ message: 'At least 2 medicines required' });
    if (medicines.length > 10)
      return res.status(400).json({ message: 'Max 10 medicines at a time' });

    const key = process.env.GEMINI_API_KEY || '';
    const apiKeyMissing = !key || key === 'your_gemini_api_key_here' || key.length < 10;

    if (!apiKeyMissing) {
      try {
        const model = getModel();
        const result = await model.generateContent(
          `You are a clinical pharmacist checking drug interactions. Analyze these medicines:
${medicines.map((m, i) => `${i + 1}. ${m}`).join('\n')}
Return ONLY valid JSON (no markdown, no code fences):
{
  "overallRisk": "safe",
  "summary": "one sentence overall summary",
  "interactions": [
    {
      "drugs": ["Drug A", "Drug B"],
      "severity": "mild",
      "description": "what happens when these interact",
      "mechanism": "brief pharmacological mechanism",
      "management": "what to do / precaution",
      "avoidCombination": false
    }
  ],
  "safeToTakeTogether": [
    { "drugs": ["Drug X", "Drug Y"], "note": "safe with normal precautions" }
  ],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "consultDoctorUrgently": false
}
overallRisk must be: "safe", "moderate", "severe", or "unknown".
severity must be: "mild", "moderate", or "severe".`
        );
        let parsed;
        try { parsed = JSON.parse(cleanJSON(result.response.text())); }
        catch { parsed = null; }
        if (parsed) return res.json({ success: true, medicines, ...parsed });
      } catch (geminiErr) {
        console.warn('Gemini interactions error, using fallback:', geminiErr.message);
      }
    }

    // Local fallback — general safety information
    const pairs = [];
    for (let i = 0; i < medicines.length; i++)
      for (let j = i + 1; j < medicines.length; j++)
        pairs.push([medicines[i], medicines[j]]);

    res.json({
      success: true,
      medicines,
      overallRisk: 'unknown',
      summary: `Automated AI analysis is temporarily unavailable. Please consult your pharmacist or doctor to check interactions between: ${medicines.join(', ')}.`,
      interactions: [],
      safeToTakeTogether: pairs.map(([a, b]) => ({
        drugs: [a, b],
        note: 'Unable to verify automatically — please consult a pharmacist',
      })),
      recommendations: [
        'Consult your doctor or pharmacist before combining these medicines.',
        'Bring your full list of medicines to your next appointment.',
        'Use a trusted drug interaction checker such as Drugs.com/interactions or Medscape.',
        'Never stop a prescribed medicine without consulting your doctor.',
      ],
      consultDoctorUrgently: false,
    });
  } catch (err) {
    console.error('Interactions error:', err.message);
    res.status(500).json({ message: err.message || 'Failed to check interactions.' });
  }
});

// 4. AI MEDICINE CHATBOT (streaming SSE)
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ message: 'message required' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    const systemPrompt = `You are MediBot, a helpful AI pharmacist assistant for MediFind — a medicine and pharmacy finder platform in India.
Your role: Answer questions about medicines, dosages, side effects, and usage. Help users understand prescriptions. Suggest when to seek emergency care. Provide info about common Indian medicines and brands.
Rules: Always recommend consulting a doctor for serious conditions. Never replace professional medical advice. Include common Indian brand names. Be concise, warm, and clear. Use simple language. For emergencies, urge calling a doctor or dialing 112.
You know about: MedPlus, Apollo Pharmacy, Wellness Forever, Netmeds. Common medicines: Crocin, Dolo-650, Pan-D, Azithral, Allegra, Combiflam. OTC vs prescription rules in India.`;

    // Check if Gemini API key is properly configured (string comparison only)
    const key = process.env.GEMINI_API_KEY || '';
    const apiKeyMissing = !key || key === 'your_gemini_api_key_here' || key.length < 10;

    if (apiKeyMissing) {
      // Fallback: use local mock responses when no API key
      const mockResponse = generateLocalChatReply(message);
      const words = mockResponse.split(' ');
      for (let i = 0; i < words.length; i++) {
        res.write(`data: ${JSON.stringify({ text: words[i] + (i < words.length - 1 ? ' ' : '') })}\n\n`);
        await new Promise(resolve => setTimeout(resolve, 25));
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    // Use real Gemini API with streaming — fall back to mock on any API error
    try {
      const model = getModel();

      const geminiHistory = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: "Understood! I'm MediBot — your AI pharmacy assistant. How can I help?" }] },
        ...history.slice(-10).map((h) => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }],
        })),
      ];

      const chat = model.startChat({ history: geminiHistory, generationConfig: { maxOutputTokens: 800 } });
      const result = await chat.sendMessageStream(message);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (geminiErr) {
      // Gemini API failed (bad key, quota, network) — fall back to local mock
      console.warn('Gemini API error, falling back to local response:', geminiErr.message);
      const mockResponse = generateLocalChatReply(message);
      const words = mockResponse.split(' ');
      for (let i = 0; i < words.length; i++) {
        res.write(`data: ${JSON.stringify({ text: words[i] + (i < words.length - 1 ? ' ' : '') })}\n\n`);
        await new Promise(resolve => setTimeout(resolve, 25));
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  } catch (err) {
    console.error('Chat error:', err.message);
    if (!res.headersSent) return res.status(500).json({ message: err.message });
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// 5. QUICK MEDICINE INFO
router.get('/medicine-info', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ message: 'name required' });

    const model = getModel();
    const result = await model.generateContent(
      `Provide concise, accurate info about "${name}" for an Indian patient. Return ONLY valid JSON (no markdown, no code fences):
{
  "name": "${name}",
  "genericName": "chemical/generic name",
  "uses": ["use 1", "use 2", "use 3"],
  "commonBrands": ["Indian brand 1", "Indian brand 2"],
  "typicalDosage": "e.g. 500mg twice daily",
  "sideEffects": ["side effect 1", "side effect 2", "side effect 3"],
  "warnings": ["warning 1", "warning 2"],
  "requiresPrescription": false,
  "foodInteractions": "food/drink to avoid or null",
  "storage": "storage instructions",
  "category": "drug class e.g. Analgesic, Antibiotic"
}`
    );

    let info;
    try {
      info = JSON.parse(cleanJSON(result.response.text()));
    } catch {
      info = { name, error: 'Could not fetch details' };
    }

    res.json({ success: true, ...info });
  } catch (err) {
    console.error('Medicine info error:', err.message);
    res.status(500).json({ message: err.message || 'AI request failed. Check your GEMINI_API_KEY.' });
  }
});

module.exports = router;
