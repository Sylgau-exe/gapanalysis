import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = '7d';

export function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export async function requireAuth(req, res) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
  
  return decoded;
}

export async function requireAdmin(req, res, sql) {
  const decoded = await requireAuth(req, res);
  if (!decoded) return null;
  
  const result = await sql`SELECT is_admin FROM users WHERE id = ${decoded.userId}`;
  if (result.rows.length === 0 || !result.rows[0].is_admin) {
    res.status(403).json({ error: 'Admin access required' });
    return null;
  }
  
  return decoded;
}
