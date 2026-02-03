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

  const { profile, objectives, scores } = req.body;

  if (!profile || !objectives || !scores) {
    return res.status(400).json({ error: 'Missing required assessment data' });
  }

  try {
    // Calculate overall score and gaps
    const scoreValues = Object.values(scores);
    const overallScore = Math.round((scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) * 20);
    
    const targetByGoal = { exploring: 3, support: 3, job: 4, pmp: 5, improve: 4 };
    const target = targetByGoal[objectives.goal] || 4;
    const gapCount = scoreValues.filter(s => s < target).length;
    const strengthCount = scoreValues.filter(s => s >= target).length;

    const result = await sql`
      INSERT INTO assessment_results (
        user_id, 
        profile_name, profile_title, profile_organization, profile_experience, certifications,
        goal, timeline, learning_style,
        score_basics, score_agile, score_product, score_initiation, score_scope,
        score_time, score_cost, score_quality, score_resources, score_communication,
        score_risk, score_procurement, score_softskills,
        overall_score, gap_count, strength_count
      ) VALUES (
        ${decoded.userId},
        ${profile.name}, ${profile.title}, ${profile.organization || null}, ${profile.experience}, ${profile.certifications || []},
        ${objectives.goal}, ${objectives.timeline}, ${objectives.learningStyle},
        ${scores.basics || 0}, ${scores.agile || 0}, ${scores.product || 0}, ${scores.initiation || 0}, ${scores.scope || 0},
        ${scores.time || 0}, ${scores.cost || 0}, ${scores.quality || 0}, ${scores.resources || 0}, ${scores.communication || 0},
        ${scores.risk || 0}, ${scores.procurement || 0}, ${scores.softskills || 0},
        ${overallScore}, ${gapCount}, ${strengthCount}
      )
      RETURNING id, overall_score, gap_count, strength_count, completed_at
    `;

    const assessment = result.rows[0];

    // Update user profile if provided
    if (profile.title || profile.organization || profile.experience) {
      await sql`
        UPDATE users SET 
          job_title = COALESCE(${profile.title}, job_title),
          organization = COALESCE(${profile.organization}, organization),
          experience_level = COALESCE(${profile.experience}, experience_level),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${decoded.userId}
      `;
    }

    return res.status(201).json({
      success: true,
      assessmentId: assessment.id,
      overallScore: assessment.overall_score,
      gapCount: assessment.gap_count,
      strengthCount: assessment.strength_count,
      completedAt: assessment.completed_at
    });

  } catch (error) {
    console.error('Save assessment error:', error);
    return res.status(500).json({ error: 'Failed to save assessment' });
  }
}
