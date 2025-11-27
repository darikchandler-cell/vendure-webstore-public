# Git Repository Setup

Your local git repository has been initialized and committed.

## Next Steps: Create Remote Repository

### Option 1: GitHub (Recommended)

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Repository name: `vendure-hunterirrigation`
   - Description: "Headless ecommerce platform with Vendure and Next.js"
   - Choose Private or Public
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
   - Click "Create repository"

2. **Connect your local repository:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/vendure-hunterirrigation.git
   git push -u origin main
   ```

   Or if using SSH:
   ```bash
   git remote add origin git@github.com:YOUR_USERNAME/vendure-hunterirrigation.git
   git push -u origin main
   ```

### Option 2: GitLab

1. **Create a new project on GitLab:**
   - Go to https://gitlab.com/projects/new
   - Project name: `vendure-hunterirrigation`
   - Visibility: Private or Public
   - **DO NOT** initialize with README
   - Click "Create project"

2. **Connect your local repository:**
   ```bash
   git remote add origin https://gitlab.com/YOUR_USERNAME/vendure-hunterirrigation.git
   git push -u origin main
   ```

### Option 3: Self-Hosted Git Server

If you have your own git server:

```bash
git remote add origin <your-git-server-url>/vendure-hunterirrigation.git
git push -u origin main
```

## Verify Remote Connection

```bash
# Check remote URL
git remote -v

# Fetch from remote
git fetch origin

# View branches
git branch -a
```

## Common Git Commands

```bash
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "feat: your commit message"

# Push to remote
git push origin main

# Pull latest changes
git pull origin main

# View commit history
git log --oneline

# Create a new branch
git checkout -b feature/your-feature-name

# Switch branches
git checkout main
```

## Branching Strategy

- `main` - Production-ready code
- `develop` - Development branch (optional)
- `feature/*` - New features
- `fix/*` - Bug fixes
- `release/*` - Release preparation

## After Setting Up Remote

Once you've pushed to GitHub/GitLab, you can deploy from the server:

```bash
# On your Hetzner server
ssh root@178.156.194.89
cd /opt
git clone https://github.com/YOUR_USERNAME/vendure-hunterirrigation.git hunter-irrigation
cd hunter-irrigation
./infra/deploy-to-server.sh
```

## Security Notes

⚠️ **IMPORTANT:** Never commit sensitive information:

- `.env` files (already in .gitignore)
- API keys
- Passwords
- Database credentials
- Private keys

All sensitive data should be in `.env` files which are gitignored.

