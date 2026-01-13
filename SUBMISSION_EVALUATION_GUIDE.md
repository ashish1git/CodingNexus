# SUBMISSION EXPORT & MANUAL EVALUATION GUIDE
## For 4-5 Evaluators | Production-Ready | PostgreSQL

---

## EXECUTIVE SUMMARY

**Best Format for Team Evaluation: CSV (One Problem Per File)**

- **Why:** Parallel evaluation by 4-5 reviewers with minimal coordination overhead
- **Tool:** Google Sheets (free, real-time collaboration, built-in scoring)
- **Setup Time:** < 5 minutes for complete export
- **Evaluation Speed:** 2-3 minutes per submission with proper formatting

---

## EXPORT FORMATS COMPARISON

| Format | Best For | Team Size | Speed | Columns | Notes |
|--------|----------|-----------|-------|---------|-------|
| **CSV (Problem-wise)** ✅ | Parallel review | 4-5 | ⭐⭐⭐ | Dynamic | Recommended |
| CSV (All submissions) | Archive | 1-2 | ⭐⭐ | Fixed | Large files |
| JSON | Programmatic | Dev team | ⭐⭐⭐ | Flexible | Not human-friendly |
| HTML Report | Management | Admins | ⭐⭐ | Fixed | Good for reports |
| TSV (Tab-separated) | Google Sheets | 3-5 | ⭐⭐⭐ | Dynamic | Copy-paste friendly |

**CHOICE: CSV + Google Sheets = OPTIMAL**

---

## QUICK START: Complete Workflow

### Step 1: Get Problem IDs
```sql
SELECT id, title, difficulty FROM "Problem" 
WHERE competitionId = '{COMPETITION_ID}' 
ORDER BY title;
```

### Step 2: Export Each Problem
```sql
\COPY (
  SELECT 
    s.name, s.rollNo, u.email, 
    ps.language, ps.code, ps.status, 
    ps.score || '/' || ps.maxScore as score, 
    ps.submittedAt
  FROM "ProblemSubmission" ps
  JOIN "User" u ON ps.userId = u.id
  JOIN "Student" s ON u.id = s.userId
  WHERE ps.problemId = '{PROBLEM_ID}'
  ORDER BY s.name
) TO STDOUT WITH (FORMAT csv, HEADER);
```
**Save as:** `problem_title.csv`

### Step 3: Load to Google Sheets
1. Open Google Drive → Create New Spreadsheet
2. File → Import → Upload → Select `problem_title.csv`
3. Create column for Evaluator name
4. Share with 4-5 team members → Assign Problems

### Step 4: Set Scoring Rubric
Add columns in Google Sheets:
- **Code Quality** (1-5): Readability, naming, comments
- **Logic Correctness** (1-5): Algorithm correctness, edge cases
- **Efficiency** (1-5): Time/space complexity
- **Manual Score** (0-10): Final award points
- **Remarks**: Issues, improvements needed

### Step 5: Merge Results
After evaluation:
```sql
-- Create evaluation results table
CREATE TABLE evaluation_results (
  id UUID PRIMARY KEY,
  submission_id UUID REFERENCES "ProblemSubmission"(id),
  evaluator_name VARCHAR,
  code_quality INT,
  logic_correctness INT,
  efficiency INT,
  manual_score INT,
  remarks TEXT,
  evaluated_at TIMESTAMP DEFAULT NOW()
);

-- Import scores from Google Sheets export → CSV → psql
\COPY evaluation_results FROM 'results.csv' WITH (FORMAT csv, HEADER);
```

---

## DETAILED EXPORT INSTRUCTIONS

### For Linux/Mac (Using Bash Script)

```bash
# 1. Set up environment
export DB_URL="postgresql://user:pass@host:5432/dbname"

# 2. Export all problems in competition
./scripts/export-submissions.sh

# Creates: problem_1.csv, problem_2.csv, problem_3.csv, etc.
```

### For Windows (Using PowerShell)

```powershell
# 1. Open PowerShell as Administrator
# 2. Execute script
. "C:\scripts\export-submissions.ps1"

# 3. Run export function
Export-CompetitionProblems -CompetitionId "abc123..."

# Creates: problem_1.csv, problem_2.csv in C:\submissions_export\
```

### Manual Export (Direct psql)

```bash
# Connect to database
psql "postgresql://user:pass@host:5432/codingnexus"

# Inside psql, run:
\COPY (
  SELECT 
    s.name, s.rollNo, u.email,
    ps.language, ps.code, ps.status,
    ps.score || '/' || ps.maxScore,
    ps.submittedAt
  FROM "ProblemSubmission" ps
  JOIN "User" u ON ps.userId = u.id
  JOIN "Student" s ON u.id = s.userId
  WHERE ps.problemId = 'problem-uuid'
  ORDER BY s.name
) TO '/path/to/problem_title.csv' WITH (FORMAT csv, HEADER);

# Exit
\q
```

---

## CSV STRUCTURE FOR EVALUATION

Exported CSV contains these columns:

```
name              | Roll No | Email            | Language | Code (embedded) | Status | Score | Submitted At
Rajesh Kumar      | A001    | rajesh@mail.com  | python   | [code...]       | Accepted | 8/10 | 2025-01-15 14:30
Priya Sharma      | A002    | priya@mail.com   | java     | [code...]       | Wrong Answer | 4/10 | 2025-01-15 14:45
...
```

### Handling Large Code Fields in Google Sheets

**Issue:** Code column may be too wide

**Solution:**
1. **Option A:** Remove code column from export, create separate "code.txt" files
   ```sql
   -- Export metadata only
   SELECT s.name, s.rollNo, u.email, ps.language, ps.status, 
          ps.score || '/' || ps.maxScore
   FROM ... (same as above)
   ```

2. **Option B:** Split code into separate tab
   ```
   Sheet 1: Scores & Metadata
   Sheet 2: Raw Code (linked by name)
   ```

3. **Option C:** Use monospace font, freeze columns
   ```
   Format → Column width → 50
   View → Freeze → Freeze first 3 columns
   ```

---

## EVALUATION WORKFLOW FOR 4-5 TEAM

### Setup (Admin - 10 minutes)

1. **Export submissions** (5 min)
   ```powershell
   Invoke-FullExport -CompetitionId "comp-uuid"
   ```

2. **Create Google Drive folder** (2 min)
   - Folder: `Evaluation_2025_Jan_15`
   - Share with all 5 evaluators

3. **Create Evaluation Sheet** (3 min)
   - Master sheet with problem assignments
   - Problem 1 → Evaluators: Rajesh, Priya
   - Problem 2 → Evaluators: Amit, Sophia
   - Problem 3 → Evaluator: Vikram

### Evaluation (Each Evaluator - 30-45 minutes per problem)

**Per Submission (2-3 minutes):**

1. Read code (1 min)
2. Check against test cases (0.5 min)
3. Score on rubric (0.5 min)
4. Add remarks (0.5 min)

**Scoring Rubric (Out of 10):**
```
Code Quality (0-3):
  3 = Excellent: Clean, well-commented, good naming
  2 = Good: Mostly readable, minor style issues
  1 = Poor: Hard to read, unclear logic
  0 = Unreadable

Logic (0-4):
  4 = Correct: Handles all cases, no errors
  3 = Minor Issue: 1-2 edge cases missed
  2 = Major Issue: Wrong approach or multiple bugs
  1 = Incomplete: Algorithm wrong
  0 = Non-functional

Efficiency (0-3):
  3 = Optimal: O(n) or better where possible
  2 = Acceptable: O(n²) for small inputs
  1 = Inefficient: O(n³) or higher
  0 = Extremely slow: TLE possible
```

### Merge & Report (Admin - 15 minutes)

1. **Download all scored sheets** as CSV
2. **Merge scores** into single table:
   ```sql
   INSERT INTO evaluation_results 
   SELECT * FROM imported_csv;
   ```

3. **Generate report:**
   ```sql
   SELECT 
     p.title as Problem,
     COUNT(*) as Total_Submissions,
     ROUND(AVG(er.manual_score), 2) as Avg_Score,
     MAX(er.manual_score) as Highest_Score,
     MIN(er.manual_score) as Lowest_Score
   FROM evaluation_results er
   JOIN "ProblemSubmission" ps ON er.submission_id = ps.id
   JOIN "Problem" p ON ps.problemId = p.id
   GROUP BY p.title
   ORDER BY p.title;
   ```

---

## PRODUCTION CHECKLIST

### Before Export
- [ ] Verify competition ID is correct
- [ ] Check total submission count: `SELECT COUNT(*) FROM "ProblemSubmission" WHERE problemId IN (...)`
- [ ] Backup database: `pg_dump ... > backup.sql`
- [ ] Create evaluation folder in Google Drive
- [ ] Invite all 5 evaluators to folder

### During Export
- [ ] Run test export with LIMIT 5 first
- [ ] Verify CSV opens correctly in Google Sheets
- [ ] Check code column is readable
- [ ] Confirm all students are included
- [ ] No sensitive data in exports (if needed, anonymize names)

### After Export
- [ ] Distribute CSVs to team
- [ ] Share evaluation rubric
- [ ] Set evaluation deadline
- [ ] Schedule merge meeting
- [ ] Archive evaluated submissions

---

## ALTERNATIVE FORMAT: HTML Report (For Presentation)

If you need to share results with faculty/management:

```sql
-- Generate HTML summary
SELECT 
  '<tr><td>' || p.title || '</td><td>' || 
  COUNT(*) || '</td><td>' || 
  ROUND(AVG(ps.score)::numeric, 2) || 
  '</td></tr>'
FROM "Problem" p
LEFT JOIN "ProblemSubmission" ps ON p.id = ps.problemId
GROUP BY p.id, p.title;
```

Wrap in HTML template → Email to stakeholders

---

## PERFORMANCE NOTES

**For 500 submissions across 3 problems:**
- Export time: 2-3 seconds
- CSV file size: 15-20 MB (code included)
- Google Sheets load time: 5-10 seconds
- Parallel evaluation: 45-60 minutes for team of 5

**If export is slow (>10s):**
```sql
-- Create temporary index for faster export
CREATE INDEX CONCURRENTLY idx_problem_user_temp 
ON "ProblemSubmission"(problemId, userId);

-- Run export
-- Drop after:
DROP INDEX idx_problem_user_temp;
```

---

## SECURITY & COMPLIANCE

**CSV contains:**
- ✅ Student names, emails, roll numbers
- ✅ Submitted code (IP owned by institution)
- ❌ Passwords (never included)
- ❌ API keys (never included)

**Before sharing externally:**
1. Remove email addresses: `SELECT name, rollNo, code, status FROM ...`
2. Anonymize: Replace names with Student ID
3. Encrypt files: `gpg --encrypt file.csv`

---

## TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| CSV won't open in Sheets | Use TSV format instead (`DELIMITER E'\t'`) |
| Code column truncated | Increase column width to 80+ |
| Unicode characters broken | Export with UTF-8 encoding (default) |
| Google Sheets too slow | Split into smaller files (≤1000 rows) |
| Psql connection timeout | Add `-t 30` for 30-second timeout |
| CSV too large | Add WHERE clause to filter problems |

---

## QUICK REFERENCE COMMANDS

```bash
# Windows PowerShell
. export-submissions.ps1
Invoke-FullExport -CompetitionId "id"

# Linux/Mac Bash
chmod +x export-submissions.sh
./export-submissions.sh

# Direct SQL
psql $DB_URL -c "\COPY (SELECT ...) TO 'file.csv' WITH (FORMAT csv, HEADER);"
```

---

## FINAL RECOMMENDATION

**For manual evaluation by 4-5 reviewers:**

✅ **Use:** CSV files (one per problem) + Google Sheets
✅ **Why:** 
  - No setup complexity
  - Real-time collaboration
  - Easy scoring & comments
  - Fast review cycle

❌ **Avoid:** 
  - Single large CSV (hard to coordinate)
  - JSON/XML (not human-readable)
  - Database direct access (security risk)
  - Excel offline (version conflicts)

---

**Last Updated:** 2025-01-10
**Database:** PostgreSQL 13+
**Compatible:** Google Sheets, Excel, LibreOffice
