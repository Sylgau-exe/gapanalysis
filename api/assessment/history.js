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
      SELECT 
        id, 
        profile_name, profile_title, profile_organization, profile_experience,
        goal, timeline, learning_style,
        score_basics, score_agile, score_product, score_initiation, score_scope,
        score_time, score_cost, score_quality, score_resources, score_communication,
        score_risk, score_procurement, score_softskills,
        overall_score, gap_count, strength_count,
        pdf_downloaded, completed_at
      FROM assessment_results 
      WHERE user_id = ${decoded.userId}
      ORDER BY completed_at DESC
      LIMIT 20
    `;

    const assessments = result.rows.map(row => ({
      id: row.id,
      profile: {
        name: row.profile_name,
        title: row.profile_title,
        organization: row.profile_organization,
        experience: row.profile_experience
      },
      objectives: {
        goal: row.goal,
        timeline: row.timeline,
        learningStyle: row.learning_style
      },
      scores: {
        basics: row.score_basics,
        agile: row.score_agile,
        product: row.score_product,
        initiation: row.score_initiation,
        scope: row.score_scope,
        time: row.score_time,
        cost: row.score_cost,
        quality: row.score_quality,
        resources: row.score_resources,
        communication: row.score_communication,
        risk: row.score_risk,
        procurement: row.score_procurement,
        softskills: row.score_softskills
      },
      overallScore: row.overall_score,
      gapCount: row.gap_count,
      strengthCount: row.strength_count,
      pdfDownloaded: row.pdf_downloaded,
      completedAt: row.completed_at
    }));

    return res.status(200).json({ assessments });

  } catch (error) {
    console.error('History error:', error);
    return res.status(500).json({ error: 'Failed to fetch assessment history' });
  }
}
