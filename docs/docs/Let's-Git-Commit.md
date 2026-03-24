# Git & GitHub - Complete Beginner's Guide 🚀

> **Goal**: Learn 80% of Git & GitHub in 30-40 minutes and start collaborating like professional developers!

---

## 📚 Table of Contents
- [What is Git & GitHub?](#what-is-git--github)
- [Installation](#installation)
- [First Time Setup](#first-time-setup)
- [The 6 Essential Commands](#the-6-essential-commands)
- [Working on Your First Project](#working-on-your-first-project)
- [Collaboration - Team Projects](#collaboration---team-projects)
- [Branches - Working in Parallel](#branches---working-in-parallel)
- [Handling Conflicts](#handling-conflicts)
- [Common Workflows](#common-workflows)
- [Cheat Sheet](#cheat-sheet)
- [Troubleshooting](#troubleshooting)

---

## 🤔 What is Git & GitHub?

### Real-World Analogy

**Git** = Your personal **time machine** 📸
- Imagine you're writing an essay
- Git lets you save "snapshots" of your essay at different stages
- Made a mistake? Go back to any previous version!
- Want to try something risky? Create a copy and experiment!

**GitHub** = Google Drive for code 🌐
- It's a website where you store your Git snapshots online
- Your teammates can see your work and add their changes
- Everyone stays in sync automatically

### Why Should You Care?

✅ **Never lose your work** - Even if your laptop crashes  
✅ **Collaborate smoothly** - Work on the same project without overwriting each other  
✅ **Track who changed what** - Like "track changes" in Word, but way better  
✅ **Required for jobs** - Every tech company uses Git  
✅ **Win hackathons** - Teams with good Git collaboration have an edge  

---

## 💻 Installation

### Windows

1. Download Git from: [git-scm.com](https://git-scm.com/download/win)
2. Run the installer
3. **Important**: When asked, select these options:
   - ✅ "Git from the command line and also from 3rd-party software"
   - ✅ "Use Visual Studio Code as Git's default editor" (or your preferred editor)
   - ✅ "Override the default branch name for new repositories" → use `main`

4. Verify installation (open Command Prompt or PowerShell):
```bash
git --version
```

### macOS

**Option 1: Using Homebrew (Recommended)**
```bash
# Install Homebrew first (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Git
brew install git
```

**Option 2: Download installer**
- Download from: [git-scm.com/download/mac](https://git-scm.com/download/mac)

Verify:
```bash
git --version
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install git
```

**For Fedora/RHEL:**
```bash
sudo dnf install git
```

Verify:
```bash
git --version
```

---

## 🎯 First Time Setup

### Configure Your Identity

**Think of this as signing your name on every snapshot you take**

```bash
# Set your name (use your real name)
git config --global user.name "Your Name"

# Set your email (use the SAME email as your GitHub account!)
git config --global user.email "your.email@example.com"

# Make the output colorful and easier to read
git config --global color.ui auto

# Set default branch name to 'main'
git config --global init.defaultBranch main
```

### Verify Your Setup

```bash
git config --list
```

You should see your name and email listed.

---

## 🎮 The 6 Essential Commands

These 6 commands are 80% of what you'll use daily!

### 1. `git init` - Start a Time Machine

**What it does**: Turns any folder into a Git-tracked project

```bash
# Navigate to your project folder
cd my-project

# Initialize Git
git init
```

**Real-world**: Like saying "I want to track changes in this folder"

---

### 2. `git status` - What's Changed?

**What it does**: Shows what files have changed since your last snapshot

```bash
git status
```

**Real-world**: Like checking "What did I modify?" before saving

**Output meanings**:
- 🔴 **Red files** = Changes not staged (not ready to save)
- 🟢 **Green files** = Changes staged (ready to save)
- ⚪ **Untracked files** = New files Git hasn't seen before

---

### 3. `git add` - Stage Your Changes

**What it does**: Mark files that you want to include in your next snapshot

```bash
# Add a specific file
git add filename.txt

# Add all changed files
git add .

# Add all files in a folder
git add folder-name/
```

**Real-world**: Like selecting which photos to include in your photo album

---

### 4. `git commit` - Take a Snapshot

**What it does**: Actually save the snapshot with a description

```bash
# Commit with a message
git commit -m "Add login feature"

# Longer message (opens editor)
git commit
```

**Real-world**: Like clicking "Save" and writing "what did I just do?"

**Good commit messages**:
- ✅ "Add user authentication"
- ✅ "Fix navbar alignment bug"
- ✅ "Update README with installation steps"
- ❌ "Changes" (too vague)
- ❌ "asdf" (useless)

---

### 5. `git push` - Upload to Cloud

**What it does**: Send your local snapshots to GitHub

```bash
git push origin main
```

**Real-world**: Like clicking "Upload" to Google Drive

---

### 6. `git pull` - Download Latest Changes

**What it does**: Get the latest changes from GitHub to your computer

```bash
git pull origin main
```

**Real-world**: Like clicking "Sync" to get your teammate's latest work

---

## 🏗️ Working on Your First Project

### Scenario: Starting a New College Project

Let's build a simple website project from scratch!

#### Step 1: Create Project Folder

```bash
# Create folder
mkdir my-college-website
cd my-college-website

# Initialize Git
git init
```

#### Step 2: Create Some Files

```bash
# Create a simple HTML file
echo "<!DOCTYPE html><html><body><h1>Hello World</h1></body></html>" > index.html

# Create a README
echo "# My College Website" > README.md
```

#### Step 3: Make Your First Commit

```bash
# Check status
git status

# Stage all files
git add .

# Commit
git commit -m "Initial commit - Add homepage and README"
```

#### Step 4: Connect to GitHub

1. Go to [github.com](https://github.com) and create an account
2. Click the **+** icon → **New repository**
3. Name it: `my-college-website`
4. **DO NOT** initialize with README (we already have files)
5. Click **Create repository**

#### Step 5: Push to GitHub

GitHub will show you commands. Copy them:

```bash
# Add GitHub as remote
git remote add origin https://github.com/YOUR-USERNAME/my-college-website.git

# Push your code
git push -u origin main
```

🎉 **Congratulations!** Your code is now on GitHub!

---

## ⚠️ Oops! I Made a Mistake - Reset & Recovery

### What This Section is About

**Don't Panic!** ❌ Your code is not permanently deleted.

Git is like a **safety net** - even if you accidentally:
- ❌ Deleted important files
- ❌ Committed the wrong code
- ❌ Made unwanted changes
- ❌ Pushed something you shouldn't have

**You can get it all back!** ✅

This section teaches you how to **undo mistakes** using Git's reset commands.

---

### Understanding Git States

Before learning reset, understand where your code lives:

```
Your Computer (Workspace)
        ↓
    git add .
        ↓
Staging Area (Staged Changes)
        ↓
  git commit
        ↓
Local Repository (Commits - on your computer)
        ↓
   git push
        ↓
GitHub (Remote - on the cloud)
```

**The Good News**: Git stores snapshots at each stage, so you can go back!

---

### Scenario 1: "I Made Changes I Don't Want"

**What happened**: You edited files but haven't committed yet.

**How to fix**:

```bash
# See what changed
git status

# Option 1: Discard changes in ONE file
git restore filename.txt

# Option 2: Discard changes in ALL files
git restore .
```

**What `git restore` does** 🔄:
- Takes the file from your last commit and copies it to your workspace
- Your unwanted changes are **discarded forever** (cannot get back!)
- Use only when you're 100% sure!

**Simple terms**: "Give me the file as it was in my last snapshot"

---

### Scenario 2: "I Added Files I Didn't Want to Add"

**What happened**: You did `git add .` but included files you didn't want.

**How to fix**:

```bash
# See what's staged
git status

# Unstage ONE file
git restore --staged filename.txt

# Unstage ALL files
git restore --staged .
```

**What `git restore --staged` does** 🔄:
- Removes the file from the staging area
- Changes stay in your workspace files (not deleted!)
- You can edit them more or add them again later

**Simple terms**: "Remove from staging area but keep my changes"

---

### Scenario 3: "I Committed Something Wrong" (Before Pushing)

**What happened**: You committed but haven't pushed to GitHub yet.

**How to fix - Option 1: Undo and Keep Changes**

```bash
git reset HEAD~1
```

**What this does** 🔄:
- `HEAD~1` means "go back 1 commit"
- Deletes the commit ❌
- Keeps your file changes ✅ (in staging area)
- You can now edit files again and re-commit

**Simple terms**: "Undo my commit but keep my work"

---

**How to fix - Option 2: Undo and Discard Changes**

```bash
git reset --hard HEAD~1
```

**What this does** 🔄:
- `HEAD~1` means "go back 1 commit"
- Deletes the commit ❌
- Deletes your file changes ❌
- Goes back to the commit before your mistake

⚠️ **WARNING**: This is permanent! Use only when you're 100% sure!

**Simple terms**: "Undo my commit AND throw away my changes"

---

**How to fix - Option 3: Change the Commit Message**

```bash
git commit --amend -m "New correct message"
```

**What this does** 🔄:
- Keeps your changes ✅
- Changes only the commit message
- Updates the last commit

**When to use**: You forgot to add a file or wrote wrong message

---

### Scenario 4: "I Committed Multiple Wrong Changes"

**What happened**: 3 commits ago you made a mistake, and you want to go back.

**How to fix**:

```bash
# Go back 3 commits
git reset --hard HEAD~3

# Or go back to a specific commit
git log --oneline    # See all commits
git reset --hard <commit-id>
```

**What this does** 🔄:
- `HEAD~3` means "go back 3 commits"
- All commits after that point are deleted
- All changes in those commits are deleted

⚠️ **WARNING**: All work in last 3 commits is gone!

---

### Scenario 5: "Oh No! I Already Pushed to GitHub!"

**What happened**: You pushed wrong code to GitHub, and now the team can see it.

#### Option 1: Revert (Safest - Recommended) ✅

```bash
# See your commit history
git log --oneline

# Create a NEW commit that undoes the wrong one
git revert <commit-id>

# Push the revert
git push origin main
```

**What this does** 🔄:
- Doesn't delete anything from history
- Creates a NEW commit that reverses your changes
- Team can see what happened
- Everyone can pull and get the fix

**Simple terms**: "I'm creating a new commit that undoes the old one"

**Example**:
```bash
git log --oneline
# Shows:
# 3a4b5c6 (latest) Wrong password hardcoded! ❌
# 2x3y4z5 Fix navbar alignment
# 1m2n3o4 Add homepage

# Fix it:
git revert 3a4b5c6

# This creates:
# 5p6q7r8 Revert "Wrong password hardcoded!"
# 3a4b5c6 Wrong password hardcoded!
# 2x3y4z5 Fix navbar alignment
# ...everyone now pulls the fix!
```

---

#### Option 2: Force Reset (Dangerous - Use Only If Solo) ⚠️

```bash
git reset --hard HEAD~1
git push origin main --force
```

⚠️ **ONLY use if**:
- Your teammates haven't pulled yet
- You're the only one on the project
- You understand the risks!

**What this does** 🔄:
- Deletes the commit locally
- Forces GitHub to accept the deletion
- Other push is overwritten ❌

**Simple terms**: "Force GitHub to forget that commit"

---

### Understanding the Flags (Simple Explanation)

| Command | What Happens to Your Files | What Happens to Commit | Safe? |
|---------|---------------------------|------------------------|-------|
| `git restore <file>` | ❌ Deleted | No change | ❌ No |
| `git restore --staged <file>` | ✅ Kept | No change | ✅ Yes |
| `git reset HEAD~1` | ✅ Kept (Staged) | ❌ Deleted | ✅ Yes |
| `git reset --hard HEAD~1` | ❌ Deleted | ❌ Deleted | ❌ No |
| `git revert <id>` | ✅ Kept (New commit) | ✅ Kept (New commit added) | ✅ Yes |

---

### Emergency Command: Find Your Lost Code

**What if**: You reset --hard and now you're panicking?

**Don't worry!** Git keeps everything for 30 days.

```bash
# See all your commits, even deleted ones
git reflog

# Output shows:
# 3a4b5c6 HEAD@{0}: reset: moving to HEAD~1
# 2x3y4z5 HEAD@{1}: commit: Your lost commit
# 1m2n3o4 HEAD@{2}: commit: Another commit

# Jump back to that commit!
git reset --hard 2x3y4z5
```

**Simple terms**: "Show me ALL commits I ever made, even deleted ones"

---

### Your Safety Checklist ✅

Before pushing code, ask yourself:

- [ ] Did I read my changes? (`git diff`)
- [ ] Are the right files staged? (`git status`)
- [ ] Is my commit message clear?
- [ ] Have I pushed something private? (passwords, API keys, etc.)
- [ ] Is this the right branch? (not someone else's main branch)

**If something goes wrong**:
1. ❌ Don't panic
2. ✅ Use `git log` to understand what happened
3. ✅ Use `git reset` or `git revert` to fix
4. ✅ Tell your team if you pushed wrong code

---

## 👥 Collaboration - Team Projects

### Scenario: Hackathon with 3 Teammates

#### Person 1: Create the Repository

```bash
# On GitHub, create a new repository
# Add collaborators: Settings → Collaborators → Add people
```

#### Everyone Else: Clone the Project

```bash
# Copy the repository to your computer
git clone https://github.com/TEAM-LEAD/project-name.git

# Navigate into it
cd project-name
```

**Real-world**: Like downloading the team's shared Google Drive folder

---

### Daily Workflow

**ALWAYS do this before starting work:**

```bash
# 1. Get latest changes
git pull origin main

# 2. Work on your files
# (edit, code, create files...)

# 3. Check what changed
git status

# 4. Stage your changes
git add .

# 5. Commit with meaningful message
git commit -m "Add search functionality to homepage"

# 6. Upload to GitHub
git push origin main
```

**Golden Rule**: Pull → Work → Add → Commit → Push

---

## 🌿 Branches - Working in Parallel

### What are Branches?

**Analogy**: Imagine a Google Doc where you and your friend both want to edit. Branches let you both edit separate copies, then merge them later.

### Why Use Branches?

✅ Experiment without breaking the main code  
✅ Multiple people work on different features simultaneously  
✅ Keep the `main` branch always working  

### Basic Branch Commands

```bash
# Create a new branch
git branch feature-name

# Switch to that branch
git checkout feature-name

# Create AND switch (shortcut)
git checkout -b feature-name

# See all branches
git branch

# Delete a branch
git branch -d feature-name
```

### Real Hackathon Example

```bash
# Main branch is the working project
git checkout main

# Person 1: Works on login page
git checkout -b login-page
# ... make changes ...
git add .
git commit -m "Complete login page"
git push origin login-page

# Person 2: Works on dashboard
git checkout -b dashboard
# ... make changes ...
git add .
git commit -m "Complete user dashboard"
git push origin dashboard
```

### Merging Branches

When your feature is done, merge it back to `main`:

```bash
# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main

# Merge your feature
git merge feature-name

# Push to GitHub
git push origin main
```

---

## 🔥 Handling Conflicts

### What's a Merge Conflict?

**Scenario**: You and your teammate edited the **same line** in the **same file**. Git doesn't know which version to keep!

### Example Conflict

```bash
git pull origin main
# Auto-merging index.html
# CONFLICT (content): Merge conflict in index.html
# Automatic merge failed; fix conflicts and then commit the result.
```

### How to Resolve

1. **Open the conflicted file**. You'll see:

```html
<<<<<<< HEAD
<h1>My Awesome Website</h1>
=======
<h1>Our Cool Project</h1>
>>>>>>> main
```

2. **Decide what to keep**:
   - Everything between `<<<<<<< HEAD` and `=======` is YOUR change
   - Everything between `=======` and `>>>>>>> main` is THEIR change

3. **Edit to keep what you want**:

```html
<h1>Our Awesome Website</h1>
```

4. **Remove the conflict markers** (`<<<<<<<`, `=======`, `>>>>>>>`)

5. **Stage and commit**:

```bash
git add index.html
git commit -m "Resolve merge conflict in header"
git push origin main
```

### Avoiding Conflicts

✅ **Communicate** with your team about who's working on what  
✅ **Pull often** - Get latest changes frequently  
✅ **Work on different files** when possible  
✅ **Use branches** for big features  

---

## 🎯 Common Workflows

### Workflow 1: Solo Project

```bash
# Daily routine
git pull origin main      # Get any changes (good habit)
# ... do your work ...
git add .
git commit -m "Description"
git push origin main
```

### Workflow 2: Team Project (Feature Branches)

```bash
# Start new feature
git checkout main
git pull origin main
git checkout -b my-feature

# Work on feature
# ... edit files ...
git add .
git commit -m "Add feature"

# Push feature branch
git push origin my-feature

# On GitHub: Create Pull Request
# After PR is approved and merged:
git checkout main
git pull origin main
git branch -d my-feature
```

### Workflow 3: Quick Bug Fix

```bash
git checkout main
git pull origin main
git checkout -b bugfix-navbar
# ... fix the bug ...
git add .
git commit -m "Fix navbar alignment issue"
git push origin bugfix-navbar
# Create Pull Request on GitHub
```

---

## 📋 Cheat Sheet

### Setup & Config
```bash
git config --global user.name "Your Name"
git config --global user.email "email@example.com"
git config --list
```

### Starting a Project
```bash
git init                              # Start tracking a folder
git clone <url>                       # Copy a project from GitHub
```

### Basic Commands
```bash
git status                            # What changed?
git add .                             # Stage all changes
git add <file>                        # Stage specific file
git commit -m "message"               # Save snapshot
git push origin main                  # Upload to GitHub
git pull origin main                  # Download from GitHub
```

### Branches
```bash
git branch                            # List branches
git branch <name>                     # Create branch
git checkout <name>                   # Switch branch
git checkout -b <name>                # Create + switch
git merge <branch>                    # Merge branch into current
git branch -d <name>                  # Delete branch
```

### History & Undo
```bash
git log                               # See commit history
git log --oneline                     # Compact history
git diff                              # See unstaged changes
git diff --staged                     # See staged changes
git restore <file>                    # Discard changes in file
git restore --staged <file>           # Unstage file
```

### GitHub Collaboration
```bash
git remote add origin <url>           # Connect to GitHub
git remote -v                         # View remote URLs
git push -u origin main               # Push + set upstream
git push origin <branch>              # Push branch
```

---

## 🐛 Troubleshooting

### Problem: "Permission denied (publickey)"

**Solution**: Set up SSH or use HTTPS

```bash
# Use HTTPS instead
git remote set-url origin https://github.com/username/repo.git

# Or set up SSH: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
```

### Problem: "fatal: not a git repository"

**Solution**: You're not in a Git folder

```bash
# Either navigate to your project folder
cd my-project

# Or initialize Git in current folder
git init
```

### Problem: "Your branch is ahead of 'origin/main' by X commits"

**Solution**: You forgot to push!

```bash
git push origin main
```

### Problem: "Updates were rejected because the tip of your current branch is behind"

**Solution**: Someone else pushed before you

```bash
# Pull their changes first
git pull origin main

# If no conflicts, push
git push origin main
```

### Problem: Made a commit with wrong message

**Solution**: Fix the last commit message

```bash
git commit --amend -m "New correct message"
git push origin main --force
```

⚠️ **Warning**: Only use `--force` if you haven't pushed yet, or no one else has pulled your commits!

### Problem: Committed to wrong branch

**Solution**: Move commit to correct branch

```bash
# Copy the commit ID from git log
git log --oneline

# Switch to correct branch
git checkout correct-branch

# Apply the commit here
git cherry-pick <commit-id>

# Go back and remove from wrong branch
git checkout wrong-branch
git reset --hard HEAD~1
```

### Problem: Want to ignore files (node_modules, .env, etc.)

**Solution**: Create `.gitignore`

```bash
# Create .gitignore file
touch .gitignore

# Edit it and add:
node_modules/
.env
*.log
.DS_Store
__pycache__/
```

Then commit:
```bash
git add .gitignore
git commit -m "Add gitignore"
```

---

## 🚀 Quick Start Template

Copy-paste this for your next project:

```bash
# 1. Create project folder
mkdir my-new-project
cd my-new-project

# 2. Initialize Git
git init

# 3. Create files
touch README.md
echo "# My Project" > README.md

# 4. Create .gitignore (optional but recommended)
touch .gitignore

# 5. First commit
git add .
git commit -m "Initial commit"

# 6. Create repository on GitHub (do this on github.com)

# 7. Connect and push
git remote add origin https://github.com/YOUR-USERNAME/my-new-project.git
git push -u origin main
```

---

## 🎓 Practice Exercise

### Exercise 1: Solo Project (10 minutes)

1. Create a folder called `my-portfolio`
2. Initialize Git
3. Create an `index.html` file
4. Make 3 commits with different changes
5. Create a GitHub repository
6. Push your code

### Exercise 2: Team Simulation (20 minutes)

1. One person creates a repo and adds others as collaborators
2. Everyone clones it
3. Each person creates a branch with their name
4. Add a file with your name (e.g., `john.txt`)
5. Push your branch
6. Practice merging branches

### Exercise 3: Handle a Conflict (15 minutes)

1. Two people edit the same line in `README.md`
2. Both try to push
3. Second person will get a conflict
4. Practice resolving it

---

## 🔗 Useful Resources

### Official Documentation
- [Git Official Docs](https://git-scm.com/doc)
- [GitHub Docs](https://docs.github.com)

### Interactive Learning
- [Learn Git Branching](https://learngitbranching.js.org/) - Visual & Interactive
- [GitHub Skills](https://skills.github.com/) - Hands-on tutorials

### Visual Tools
- [GitKraken](https://www.gitkraken.com/) - GUI for Git
- [GitHub Desktop](https://desktop.github.com/) - Simple GitHub GUI
- [VS Code Git Integration](https://code.visualstudio.com/docs/sourcecontrol/overview) - Built-in Git

### Cheat Sheets
- [GitHub Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [Atlassian Git Cheat Sheet](https://www.atlassian.com/git/tutorials/atlassian-git-cheatsheet)

---

## 💡 Pro Tips

### 1. Commit Often
Don't wait until end of day. Commit every logical change:
```bash
git add file1.js
git commit -m "Add login validation"

git add file2.js
git commit -m "Fix navbar styling"
```

### 2. Write Good Commit Messages

**Bad**:
```bash
git commit -m "fixed stuff"
git commit -m "changes"
git commit -m "asdf"
```

**Good**:
```bash
git commit -m "Add user authentication feature"
git commit -m "Fix responsive navbar on mobile"
git commit -m "Update README with setup instructions"
```

**Format**: `Action + What`
- Add...
- Fix...
- Update...
- Remove...
- Refactor...

### 3. Use `.gitignore` Early

Create it in every project:
```bash
# Dependencies
node_modules/
venv/

# Environment variables
.env
.env.local

# Build outputs
dist/
build/
*.log

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
```

### 4. Pull Before Push

Make it a habit:
```bash
git pull origin main && git push origin main
```

### 5. Use Meaningful Branch Names

**Bad**: `branch1`, `test`, `new`

**Good**:
- `feature/user-authentication`
- `bugfix/navbar-alignment`
- `hotfix/payment-gateway`

### 6. Don't Commit Secrets

**NEVER** commit:
- Passwords
- API keys
- Database credentials
- Private keys

Use `.env` files and add them to `.gitignore`!

---

## 🎊 Congratulations!

You now know 80% of what professional developers use daily! 

### What You've Learned:
✅ Git basics and why it matters  
✅ Installation and setup  
✅ The 6 essential commands  
✅ Solo and team workflows  
✅ Branches and merging  
✅ Conflict resolution  
✅ Best practices  

### Next Steps:
1. Practice with a personal project
2. Collaborate on a team project
3. Contribute to open-source projects
4. Learn advanced Git (rebasing, stashing, cherry-picking)
5. Explore GitHub Actions (CI/CD)

---

## 📞 Need Help?

- **During session**: Raise your hand!
- **After session**: Create an issue on the course repository
- **Community**: [Stack Overflow - Git](https://stackoverflow.com/questions/tagged/git)
- **Documentation**: [git-scm.com](https://git-scm.com)

---

### 🌟 Remember

> "The best way to learn Git is to use it. Make mistakes, break things, and learn from them. Git is forgiving - you can almost always recover!"

**Happy Coding! 🚀**

---

**Last Updated**: March 2026  
**Maintained by**: Coding Nexus  
**License**: Feel free to share and modify for educational purposes

---

## Quick Command Reference Card

```bash
# Setup
git config --global user.name "Name"
git config --global user.email "email"

# Start
git init                    # New project
git clone <url>             # Copy project

# Daily Workflow
git status                  # Check status
git add .                   # Stage changes
git commit -m "msg"         # Commit
git push origin main        # Upload
git pull origin main        # Download

# Branches
git branch <name>           # Create
git checkout <name>         # Switch
git merge <name>            # Merge

# Undo
git restore <file>          # Discard changes
git restore --staged <file> # Unstage
```

**Print this section and keep it at your desk! 📄**