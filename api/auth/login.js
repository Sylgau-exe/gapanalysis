import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { createToken } from '../../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const result = await sql`
      SELECT id, email, name, password_hash, organization, job_title, is_admin, email_verified
      FROM users 
      WHERE email = ${email.toLowerCase()}
    `;

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await sql`UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ${user.id}`;

    const token = createToken({
      userId: user.id,
      email: user.email,
      name: user.name
    });

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organization: user.organization,
        jobTitle: user.job_title,
        isAdmin: user.is_admin
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}
