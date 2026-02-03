# PM Skills Assessment Platformxx

A free project management skills assessment platform designed to generate leads for training courses, simulations, and PM tools.

## 🎯 Purpose

This standalone platform allows users to:
- Take a **FREE** comprehensive PM skills assessment (13 skill areas)
- Get personalized development roadmaps based on their career goals
- Access recommended courses, simulations, and tools

**Lead Generation**: When users click on recommended resources, the platform tracks these leads for partner analysis (McGill, Thinkific courses, BizSimHub simulations, etc.)

## 🏗️ Architecture

```
pm-skills-assessment/
├── api/
│   ├── auth/
│   │   ├── register.js    # User registration
│   │   ├── login.js       # User login
│   │   └── me.js          # Get current user
│   ├── assessment/
│   │   ├── save.js        # Save assessment results
│   │   ├── history.js     # Get user's assessment history
│   │   └── track-lead.js  # Track partner resource clicks
│   ├── admin/
│   │   └── stats.js       # Admin dashboard statistics
│   └── health.js          # Health check endpoint
├── lib/
│   └── auth.js            # JWT utilities & middleware
├── public/
│   ├── index.html         # Landing page with login/register
│   ├── assessment.html    # Assessment tool
│   └── dashboard.html     # User assessment history
├── schema.sql             # PostgreSQL database schema
├── package.json           # Node.js dependencies
└── vercel.json            # Vercel deployment config
```

## 🚀 Deployment Instructions

### 1. Create GitHub Repository

```bash
# Clone or download this folder
cd pm-skills-assessment

# Initialize git
git init
git add .
git commit -m "Initial commit: PM Skills Assessment Platform"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/pm-skills-assessment.git
git branch -M main
git push -u origin main
```

### 2. Set Up Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project (e.g., "pm-skills-assessment")
3. Copy the **Connection String** (POSTGRES_URL)
4. Open the **SQL Editor** and run the contents of `schema.sql`

### 3. Deploy to Vercel

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Add Environment Variables:
   - `JWT_SECRET` - Generate a random 32+ character string (e.g., use `openssl rand -base64 32`)
   - `POSTGRES_URL` - Your Neon connection string
4. Deploy!

### 4. Create Admin User

After deployment, create an admin user:

```sql
-- Run this in Neon SQL Editor
-- First, generate a password hash (or use the example below for 'admin123')
INSERT INTO users (email, name, password_hash, is_admin, email_verified) 
VALUES (
  'admin@yourdomain.com', 
  'Admin', 
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.7D7PqL9V1NLJ3m', -- admin123
  true, 
  true
);
```

**⚠️ CHANGE THE PASSWORD IMMEDIATELY after first login!**

## 📊 Partner Resources Configuration

Partners are configured in `public/assessment.html` in the `PARTNER_RESOURCES` object:

```javascript
const PARTNER_RESOURCES = {
  thinkific: {
    name: 'Executive Producer Courses',
    url: 'https://the-executive-producer.thinkific.com',
    code: 'thinkific'
  },
  bizsimhub: {
    name: 'BizSimHub',
    url: 'https://simulations-six.vercel.app',
    code: 'bizsimhub'
  },
  pmtools: {
    name: 'ProjectManagerTool',
    url: 'https://projectmanagertool.com',
    code: 'pmtools'
  },
  mcgill: {
    name: 'McGill Continuing Studies',
    url: 'https://www.mcgill.ca/continuingstudies/',
    code: 'mcgill'
  }
};
```

### Adding McGill Courses

To add specific McGill courses to skill areas, update the `RESOURCE_MAP` object:

```javascript
basics: {
  courses: [
    { title: 'PM Fundamentals', duration: '13 hrs', platform: 'Executive Producer', url: '...', partner: 'thinkific' },
    { title: 'Project Management Certificate', duration: '45 hrs', platform: 'McGill SCS', url: 'https://www.mcgill.ca/continuingstudies/program/project-management', partner: 'mcgill' }
  ],
  // ...
}
```

## 📈 Lead Tracking

All resource clicks are tracked in the `partner_leads` table:

```sql
-- View lead statistics
SELECT partner_code, COUNT(*) as clicks, COUNT(DISTINCT user_id) as unique_users
FROM partner_leads
GROUP BY partner_code
ORDER BY clicks DESC;

-- View recent leads
SELECT pl.*, u.email, u.name
FROM partner_leads pl
JOIN users u ON pl.user_id = u.id
ORDER BY pl.clicked_at DESC
LIMIT 50;
```

## 🎨 Customization

### Branding

Update the following in `public/index.html` and `public/assessment.html`:

1. **Logo/Brand Name**: Search for "PM Skills" and replace
2. **Colors**: Modify the `tailwind.config` colors
3. **Meta Tags**: Update SEO tags in the `<head>` section

### Assessment Skills

The 13 skill areas are defined in `SKILL_AREAS` array in `assessment.html`. Each skill has:
- `id`: Unique identifier
- `name`: Display name
- `description`: Short description
- `rubric`: 5-level proficiency criteria

## 🔒 Security Notes

- Passwords are hashed with bcrypt (12 rounds)
- JWTs expire after 7 days
- All API endpoints validate authorization
- Admin endpoints require `is_admin = true`

## 📝 API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | No | Register new user |
| `/api/auth/login` | POST | No | Login user |
| `/api/auth/me` | GET | Yes | Get current user |
| `/api/assessment/save` | POST | Yes | Save assessment results |
| `/api/assessment/history` | GET | Yes | Get user's assessments |
| `/api/assessment/track-lead` | POST | Yes | Track partner click |
| `/api/admin/stats` | GET | Admin | Dashboard statistics |
| `/api/health` | GET | No | Health check |

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Install Vercel CLI
npm i -g vercel

# Link to Vercel project (for environment variables)
vercel link

# Run locally
vercel dev
```

## 📄 License

MIT License - Sylvain PMO Consulting

---

## Quick Links

- **Live Demo**: [Your Vercel URL]
- **Admin Dashboard**: [Your URL]/admin (coming soon)
- **API Health**: [Your URL]/api/health
