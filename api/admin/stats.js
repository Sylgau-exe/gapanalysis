// api/admin/stats.js - Admin dashboard statistics
import { sql } from '@vercel/postgres';
import { getUserFromRequest, cors } from '../../lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const decoded = getUserFromRequest(req);
  if (!decoded) return res.status(401).json({ error: 'Authentication required' });

  const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${decoded.userId}`;
  if (!adminCheck.rows[0]?.is_admin) return res.status(403).json({ error: 'Admin access required' });

  try {
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    const assessmentCount = await sql`SELECT COUNT(*) as count FROM assessment_results`;
    const leadCount = await sql`SELECT COUNT(*) as count FROM partner_leads`;
    const newUsers7d = await sql`SELECT COUNT(*) as count FROM users WHERE created_at > NOW() - INTERVAL '7 days'`;
    const assessments7d = await sql`SELECT COUNT(*) as count FROM assessment_results WHERE completed_at > NOW() - INTERVAL '7 days'`;
    const avgScores = await sql`SELECT ROUND(AVG(overall_score)::numeric, 1) as avg_overall, ROUND(AVG(gap_count)::numeric, 1) as avg_gaps FROM assessment_results`;
    const goalDist = await sql`SELECT goal, COUNT(*) as count FROM assessment_results WHERE goal IS NOT NULL GROUP BY goal ORDER BY count DESC`;

    return res.status(200).json({
      overview: {
        totalUsers: parseInt(userCount.rows[0].count),
        totalAssessments: parseInt(assessmentCount.rows[0].count),
        totalLeads: parseInt(leadCount.rows[0].count),
        avgOverallScore: parseFloat(avgScores.rows[0]?.avg_overall) || 0,
        avgGapCount: parseFloat(avgScores.rows[0]?.avg_gaps) || 0
      },
      last7Days: {
        newUsers: parseInt(newUsers7d.rows[0].count),
        assessments: parseInt(assessments7d.rows[0].count)
      },
      goalDistribution: goalDist.rows
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
}
