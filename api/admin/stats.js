import { sql } from '@vercel/postgres';
import { requireAdmin } from '../../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const decoded = await requireAdmin(req, res, sql);
  if (!decoded) return;

  try {
    // Overall stats
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    const assessmentCount = await sql`SELECT COUNT(*) as count FROM assessment_results`;
    const leadCount = await sql`SELECT COUNT(*) as count FROM partner_leads`;
    
    // Stats for last 7 days
    const newUsers7d = await sql`
      SELECT COUNT(*) as count FROM users 
      WHERE created_at > NOW() - INTERVAL '7 days'
    `;
    const assessments7d = await sql`
      SELECT COUNT(*) as count FROM assessment_results 
      WHERE completed_at > NOW() - INTERVAL '7 days'
    `;
    const leads7d = await sql`
      SELECT COUNT(*) as count FROM partner_leads 
      WHERE clicked_at > NOW() - INTERVAL '7 days'
    `;
    
    // Average scores
    const avgScores = await sql`
      SELECT 
        ROUND(AVG(overall_score)::numeric, 1) as avg_overall,
        ROUND(AVG(gap_count)::numeric, 1) as avg_gaps
      FROM assessment_results
    `;
    
    // Goal distribution
    const goalDist = await sql`
      SELECT goal, COUNT(*) as count
      FROM assessment_results
      WHERE goal IS NOT NULL
      GROUP BY goal
      ORDER BY count DESC
    `;
    
    // Partner leads breakdown
    const partnerBreakdown = await sql`
      SELECT partner_code, COUNT(*) as count
      FROM partner_leads
      GROUP BY partner_code
      ORDER BY count DESC
    `;
    
    // Recent assessments
    const recentAssessments = await sql`
      SELECT 
        ar.id, ar.profile_name, ar.profile_organization, ar.overall_score, 
        ar.goal, ar.completed_at,
        u.email
      FROM assessment_results ar
      JOIN users u ON ar.user_id = u.id
      ORDER BY ar.completed_at DESC
      LIMIT 20
    `;
    
    // Recent signups
    const recentUsers = await sql`
      SELECT id, email, name, organization, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 20
    `;

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
        assessments: parseInt(assessments7d.rows[0].count),
        leads: parseInt(leads7d.rows[0].count)
      },
      goalDistribution: goalDist.rows,
      partnerBreakdown: partnerBreakdown.rows,
      recentAssessments: recentAssessments.rows,
      recentUsers: recentUsers.rows
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
}
