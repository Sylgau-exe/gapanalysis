import { sql } from '@vercel/postgres';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const decoded = await requireAuth(req, res);
  if (!decoded) return;

  try {
    const result = await sql`
      SELECT id, email, name, organization, job_title, is_admin, created_at
      FROM users 
      WHERE id = ${decoded.userId}
    `;

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    const assessments = await sql`
      SELECT COUNT(*) as count FROM assessments WHERE user_id = ${user.id}
    `;

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organization: user.organization,
        jobTitle: user.job_title,
        isAdmin: user.is_admin,
        createdAt: user.created_at,
        assessmentCount: parseInt(assessments.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Me error:', error);
    return res.status(500).json({ error: 'Failed to fetch user data' });
  }
}
