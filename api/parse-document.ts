import Anthropic from '@anthropic-ai/sdk';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '30mb',
    },
  },
};

const EXTRACTION_PROMPT = `You are a document parser. Extract key fields from the provided document.

Extract these fields:
- type: best matching category — one of: service, repair, inspection, registration, warranty, tyres, battery, recall, other, test
  Use "test" if the document is not a vehicle service record (e.g. a food receipt, a book page, a handwritten note).
- date: the primary date on the document in YYYY-MM-DD format
- odometer: vehicle odometer reading in km if present (integer); otherwise null
- provider: the issuing business, author, or organisation name
- summary: a one-line description of what this document is (max 80 characters)
- cost: total monetary amount if present as a number; otherwise null

Also extract:
- doc_type: what kind of document this is (e.g. "Tax Invoice", "Receipt", "Handwritten Note", "Service Report")
- vendor_block: the issuing party name and address if shown; otherwise an empty string
- items: key line items, services, or bullet points from the document (array of strings, max 8)

Respond ONLY with valid JSON in this exact structure — no other text, no markdown fences:
{
  "doc_type": "Tax Invoice",
  "vendor_block": "Business Name\\n123 Street, City",
  "items": ["Oil change", "Oil filter"],
  "fields": {
    "type":     { "value": "service", "confidence": 0.95, "label": "Record type" },
    "date":     { "value": "2024-03-15", "confidence": 0.98, "label": "Date" },
    "odometer": { "value": 87500, "confidence": 0.92, "label": "Odometer (km)" },
    "provider": { "value": "Smith Auto Service", "confidence": 0.97, "label": "Provider" },
    "summary":  { "value": "60,000 km service", "confidence": 0.90, "label": "Summary" },
    "cost":     { "value": 289.50, "confidence": 0.99, "label": "Total cost ($)" }
  }
}

If a field cannot be found, use null for value and 0.0 for confidence.`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { file_base64, file_type, file_name } = req.body ?? {};

  if (!file_base64 || !file_type) {
    res.status(400).json({ error: 'Missing file_base64 or file_type' });
    return;
  }

  const isImage = (file_type as string).startsWith('image/');
  const isPDF = file_type === 'application/pdf';

  if (!isImage && !isPDF) {
    res.status(400).json({ error: 'Unsupported file type' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'API key not configured' });
    return;
  }

  try {
    const client = new Anthropic({ apiKey });

    const userContent: any[] = isImage
      ? [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: file_type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: file_base64,
            },
          },
          { type: 'text', text: EXTRACTION_PROMPT },
        ]
      : [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: file_base64 },
          },
          { type: 'text', text: EXTRACTION_PROMPT },
        ];

    const message = await client.messages.create(
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: userContent }],
      },
      isPDF ? { headers: { 'anthropic-beta': 'pdfs-2024-09-25' } } : undefined,
    );

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Model did not return JSON');

    const parsed = JSON.parse(jsonMatch[0]);

    const result = {
      id: `ext_${Date.now()}`,
      document_id: `doc_${Date.now()}`,
      doc_name: file_name ?? 'document',
      doc_type: parsed.doc_type ?? 'Document',
      vendor_block: parsed.vendor_block ?? '',
      fields: {
        type:     parsed.fields?.type     ?? { value: 'other', confidence: 0.5, label: 'Record type' },
        date:     parsed.fields?.date     ?? { value: '',      confidence: 0.0, label: 'Service date' },
        odometer: parsed.fields?.odometer ?? { value: 0,       confidence: 0.0, label: 'Odometer (km)' },
        provider: parsed.fields?.provider ?? { value: '',      confidence: 0.0, label: 'Provider' },
        summary:  parsed.fields?.summary  ?? { value: '',      confidence: 0.0, label: 'Summary' },
        cost:     parsed.fields?.cost     ?? { value: 0,       confidence: 0.0, label: 'Total cost ($)' },
      },
      items: Array.isArray(parsed.items) ? parsed.items : [],
      user_reviewed: false,
      user_confirmed: false,
      created_at: new Date().toISOString(),
    };

    res.status(200).json(result);
  } catch (err: any) {
    console.error('[parse-document]', err);
    res.status(500).json({ error: err?.message ?? 'Internal error' });
  }
}
