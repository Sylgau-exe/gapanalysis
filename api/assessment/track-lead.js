import { sql } from '@vercel/postgres';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const decoded = await requireAuth(req, res);
  if (!decoded) return;

  const { assessmentId, partnerCode, resourceClicked } = req.body;

  if (!partnerCode || !resourceClicked) {
    return res.status(400).json({ error: 'Missing required tracking data' });
  }

  try {
    await sql`
      INSERT INTO partner_leads (user_id, assessment_id, partner_code, resource_clicked)
      VALUES (${decoded.userId}, ${assessmentId || null}, ${partnerCode}, ${resourceClicked})
    `;

    return res.status(201).json({ success: true });

  } catch (error) {
    console.error('Track lead error:', error);
    return res.status(500).json({ error: 'Failed to track lead' });
  }
}
