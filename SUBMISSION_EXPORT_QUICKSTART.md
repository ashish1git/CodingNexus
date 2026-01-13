# SUBMISSION EXPORT - QUICK START REFERENCE

## Files Created

1. **export-submissions-for-review.sql** - Core SQL queries for all export scenarios
2. **export-submissions.sh** - Bash script for Linux/Mac automation
3. **export-submissions.ps1** - PowerShell script for Windows automation
4. **export-alternative-formats.sql** - 10+ alternative export formats (JSON, XML, YAML, etc.)
5. **SUBMISSION_EVALUATION_GUIDE.md** - Complete evaluation workflow guide

---

## TL;DR - FASTEST PATH TO EVALUATION

### Windows Users (3 steps, 5 minutes)

```powershell
# 1. Open PowerShell, navigate to project
cd C:\Users\Ashish\Downloads\CN

# 2. Run export script
. .\scripts\export-submissions.ps1
Invoke-FullExport -CompetitionId "YOUR_COMPETITION_ID"

# 3. Open CSV files in Google Sheets
# Files created in C:\submissions_export\
```

### Linux/Mac Users (3 steps, 5 minutes)

```bash
# 1. Make script executable
chmod +x scripts/export-submissions.sh

# 2. Set database URL and run
export POSTGRES_URL="postgresql://user:pass@host/dbname"
./scripts/export-submissions.sh

# 3. Open CSV files in Google Sheets
# Files created in ./submissions_export/
```

### Using psql Directly (1 command)

```bash
psql "postgresql://codingnexus_user:PASSWORD@host:5432/codingnexus" -c \
  "\COPY (
    SELECT s.name, s.rollNo, u.email, ps.language, ps.code, ps.status, 
           ps.score || '/' || ps.maxScore as score, ps.submittedAt
    FROM \"ProblemSubmission\" ps
    JOIN \"User\" u ON ps.userId = u.id
    JOIN \"Student\" s ON u.id = s.userId
    WHERE ps.problemId = 'PROBLEM_ID'
    ORDER BY s.name
  ) TO 'output.csv' WITH (FORMAT csv, HEADER);"
```

---

## FORMAT RECOMMENDATION

| Scenario | Use | Speed | Effort |
|----------|-----|-------|--------|
| **4-5 evaluators, parallel review** | CSV → Google Sheets | ⭐⭐⭐ | Low |
| Single evaluator | CSV → Excel | ⭐⭐ | Low |
| Programmatic processing | JSON | ⭐⭐⭐ | Med |
| Academic report | LaTeX/Markdown | ⭐⭐ | High |
| Email summary | HTML | ⭐⭐⭐ | Low |

**BEST FOR YOUR USE CASE (4-5 evaluators):**
✅ **CSV + Google Sheets** - No installation, real-time collaboration, built-in tools

---

## DATABASE QUERIES

### Get Competition Details
```sql
SELECT id, title, startTime, endTime FROM "Competition";
```

### Get Problem Details
```sql
SELECT id, title, difficulty, points FROM "Problem" 
WHERE competitionId = 'YOUR_COMPETITION_ID';
```

### Count Submissions per Problem
```sql
SELECT 
  p.title, 
  COUNT(*) as submission_count
FROM "ProblemSubmission" ps
JOIN "Problem" p ON ps.problemId = p.id
GROUP BY p.id, p.title;
```

### Export Summary Report
```sql
SELECT 
  p.title as problem,
  COUNT(*) as submissions,
  COUNT(CASE WHEN ps.status = 'accepted' THEN 1 END) as accepted,
  ROUND(AVG(ps.score)::numeric, 2) as avg_score
FROM "Problem" p
LEFT JOIN "ProblemSubmission" ps ON p.id = ps.problemId
GROUP BY p.id, p.title
ORDER BY p.title;
```

---

## GOOGLE SHEETS WORKFLOW

### Import CSV
1. Google Drive → New → Google Sheets
2. File → Import → Upload
3. Select `problem_title.csv` → Create new spreadsheet

### Set Up Evaluation
1. Add column: "Evaluator"
2. Add column: "Code Quality (1-5)"
3. Add column: "Logic (1-5)"
4. Add column: "Efficiency (1-5)"
5. Add column: "Remarks"
6. **Share** with team members

### Track Progress
- Filter by Evaluator column
- Conditional formatting for scores
- Data → Data validation for dropdown scores

### Export Results
- File → Download → CSV
- **Import to database:**
  ```sql
  \COPY evaluation_results FROM 'results.csv' WITH (FORMAT csv, HEADER);
  ```

---

## CSV STRUCTURE CREATED

```
name (string)         - Student name
rollNo (string)       - Roll number
email (string)        - Student email
language (string)     - Programming language (python/java/cpp/etc)
code (text)           - Full submitted code
status (string)       - Accepted/Wrong Answer/Compile Error/TLE/Runtime Error
score (string)        - Format: "obtained/maximum" e.g., "8/10"
submittedAt (datetime)- ISO 8601 timestamp
```

**Code column is embedded** - for large files, use separate format:
- Extract code to individual `.py/.java/.cpp` files named by student
- Keep metadata CSV with links to code files

---

## HANDLING LARGE SUBMISSIONS

**If CSV is too large for Google Sheets (>10,000 rows):**

### Option 1: Split by Problem
```bash
# Already done - one CSV per problem
# Reduces file size significantly
```

### Option 2: Split by Batch
```sql
-- Only first 100 submissions
WHERE ps.problemId = 'ID' LIMIT 100;

-- Then repeat for next 100 with OFFSET
WHERE ps.problemId = 'ID' LIMIT 100 OFFSET 100;
```

### Option 3: Extract Code Separately
```sql
-- Metadata only (small CSV)
SELECT s.name, s.rollNo, u.email, ps.language, ps.status, ps.score
FROM "ProblemSubmission" ps
...

-- Code stored in separate files/database
SELECT s.name, ps.code FROM "ProblemSubmission" ps ...
-- Save to /submissions/{studentname}.{lang}
```

---

## SECURITY BEST PRACTICES

### Before Sharing with External Evaluators
```sql
-- Remove sensitive data
SELECT 
  s.name,
  s.rollNo,
  -- u.email,  -- Remove this
  ps.language,
  ps.code,
  ps.status,
  ps.score
FROM ...
```

### Anonymize Names
```sql
SELECT 
  'Student_' || ROW_NUMBER() OVER (ORDER BY s.name) as name,
  s.rollNo,
  ps.code,
  ps.status,
  ps.score
FROM ...
```

### Encrypt Exports
```bash
# Linux/Mac
gpg --symmetric output.csv  # Creates output.csv.gpg

# Windows (using 7-Zip or similar)
7z a -tzip -p output.7z output.csv  # Will prompt for password
```

---

## PERFORMANCE TIPS

### Speed Up Exports
```sql
-- Add temporary index for large datasets
CREATE INDEX CONCURRENTLY idx_exp_temp 
ON "ProblemSubmission"(problemId, userId);

-- Run export

-- Clean up
DROP INDEX IF EXISTS idx_exp_temp;
```

### Monitor Progress
```sql
-- Check submission count before export
SELECT COUNT(*) FROM "ProblemSubmission" 
WHERE problemId = 'PROBLEM_ID';

-- Expected export time:
-- < 1000 rows   = ~1 second
-- 1000-5000     = ~2-3 seconds  
-- 5000-10000    = ~5-10 seconds
-- > 10000       = >15 seconds (consider splitting)
```

---

## TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| `psql: command not found` | Install PostgreSQL client tools |
| CSV won't open in Sheets | Convert to TSV format (tab-separated) |
| Code column too wide | Use separate code files format |
| Connection timeout | Increase timeout: `-t 30` |
| Unicode issues | Verify UTF-8 encoding: `file -i output.csv` |
| Psql hanging | Press Ctrl+C and check database connection |

---

## NEXT STEPS

1. **Choose export method:**
   - Windows: Use PowerShell script
   - Linux/Mac: Use Bash script
   - Direct: Use psql with SQL query

2. **Get your IDs:**
   - Competition ID: `SELECT id FROM "Competition" ORDER BY createdAt DESC LIMIT 1;`
   - Problem IDs: `SELECT id, title FROM "Problem" WHERE competitionId = '...';`

3. **Run export:**
   - Creates one CSV per problem in output folder
   - Files ready for Google Sheets import

4. **Set up evaluation:**
   - Import CSVs into Google Sheets
   - Share with team
   - Add scoring columns
   - Evaluate!

5. **Merge results:**
   - Download evaluated CSVs
   - Import to database
   - Generate reports

---

## KEY FILES REFERENCE

| File | Purpose | Use When |
|------|---------|----------|
| export-submissions-for-review.sql | Raw SQL queries | Need custom queries |
| export-submissions.sh | Bash automation | Linux/Mac environment |
| export-submissions.ps1 | PowerShell automation | Windows environment |
| export-alternative-formats.sql | JSON/XML/YAML/etc | Programmatic processing |
| SUBMISSION_EVALUATION_GUIDE.md | Complete guide | Need full workflow details |

---

## QUESTIONS?

**Issue:** Can't connect to database
**Solution:** Verify DATABASE_URL in .env file

**Issue:** Export taking too long
**Solution:** Add LIMIT 100 to query for testing

**Issue:** Code column too large in Google Sheets
**Solution:** Use separate code files export format or TSV with frozen columns

**Issue:** Need to evaluate offline
**Solution:** Export to Excel instead, or use HTML report format

---

**Ready to start?**
→ Pick your OS (Windows/Linux/Mac)
→ Get your Competition ID
→ Run the export command
→ Upload to Google Sheets
→ Start evaluating!

Good luck! 🎯
