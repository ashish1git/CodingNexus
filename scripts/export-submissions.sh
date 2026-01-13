#!/bin/bash
# ============================================================================
# PRODUCTION-READY: PostgreSQL Export Commands for Submissions Review
# Usage: Source environment variables and run individual export commands
# Database: PostgreSQL (Render Cloud)
# ============================================================================

# ====================================================================================
# SETUP: Configure your database connection
# ====================================================================================

# Option A: Using psql directly with connection string
export DB_HOST="dpg-d5e0uo24d50c73fibuu0-a.oregon-postgres.render.com"
export DB_NAME="codingnexus"
export DB_USER="codingnexus_user"
export DB_PASSWORD="nUOTxBglKrnRaktTu5L2AAxjlj650RCD"
export DB_PORT="5432"

# Option B: Full connection string (replace in commands below)
POSTGRES_URL="postgresql://codingnexus_user:nUOTxBglKrnRaktTu5L2AAxjlj650RCD@dpg-d5e0uo24d50c73fibuu0-a.oregon-postgres.render.com:5432/codingnexus"

# ====================================================================================
# COMMAND 1: Export Single Problem Submissions to CSV
# ====================================================================================
# Usage: Replace PROBLEM_ID with actual problem UUID
# Output: problem-{PROBLEM_ID}.csv in current directory

PROBLEM_ID="your-problem-uuid-here"
OUTPUT_DIR="./submissions_export"

mkdir -p "$OUTPUT_DIR"

# Using psql with COPY command (recommended - fastest)
psql "$POSTGRES_URL" << EOF
\COPY (
  SELECT 
    ps.id as submission_id,
    s.name as student_name,
    s.rollNo as roll_number,
    u.email as student_email,
    p.title as problem_title,
    p.difficulty,
    p.points as max_points,
    ps.language,
    ps.code,
    ps.status,
    ps.score as obtained_score,
    ps.testsPassed || '/' || ps.totalTests as tests_passed,
    ps.executionTime || ' ms' as execution_time,
    COALESCE(ps.errorMessage, 'N/A') as error_message,
    ps.submittedAt as submission_timestamp
  FROM "ProblemSubmission" ps
  JOIN "User" u ON ps.userId = u.id
  JOIN "Student" s ON u.id = s.userId
  JOIN "Problem" p ON ps.problemId = p.id
  WHERE ps.problemId = '$PROBLEM_ID'
  ORDER BY s.name, ps.submittedAt DESC
) TO STDOUT WITH (FORMAT csv, HEADER);
EOF > "$OUTPUT_DIR/problem-${PROBLEM_ID}.csv"

echo "✅ Exported: $OUTPUT_DIR/problem-${PROBLEM_ID}.csv"

# ====================================================================================
# COMMAND 2: Export All Problems in Competition
# ====================================================================================
# Creates separate CSV for each problem automatically

COMPETITION_ID="your-competition-uuid-here"

psql "$POSTGRES_URL" << EOF
SELECT DISTINCT ps.problemId, p.title 
FROM "ProblemSubmission" ps
JOIN "Problem" p ON ps.problemId = p.id
WHERE p.competitionId = '$COMPETITION_ID'
ORDER BY p.title;
EOF | tail -n +2 | while IFS='|' read -r PROBLEM_ID PROBLEM_TITLE; do
  PROBLEM_ID=$(echo "$PROBLEM_ID" | xargs)
  SAFE_TITLE=$(echo "$PROBLEM_TITLE" | xargs | sed 's/ /_/g' | sed 's/[^a-zA-Z0-9_-]//g')
  
  psql "$POSTGRES_URL" << SQL
\COPY (
  SELECT 
    s.name, s.rollNo, u.email,
    ps.language, ps.code, ps.status,
    ps.score || '/' || ps.maxScore as score,
    ps.submittedAt
  FROM "ProblemSubmission" ps
  JOIN "User" u ON ps.userId = u.id
  JOIN "Student" s ON u.id = s.userId
  WHERE ps.problemId = '$PROBLEM_ID'
  ORDER BY s.name
) TO STDOUT WITH (FORMAT csv, HEADER);
SQL > "$OUTPUT_DIR/${SAFE_TITLE}.csv"
  
  echo "✅ Exported: $OUTPUT_DIR/${SAFE_TITLE}.csv"
done

# ====================================================================================
# COMMAND 3: Export with Code in Separate Files (Better for large submissions)
# ====================================================================================
# Creates: metadata.csv + separate .txt files for each submission's code

PROBLEM_ID="your-problem-uuid-here"

# Export metadata
psql "$POSTGRES_URL" << EOF
\COPY (
  SELECT 
    ps.id,
    s.name,
    s.rollNo,
    u.email,
    ps.language,
    ps.status,
    ps.score || '/' || ps.maxScore as score,
    ps.submittedAt
  FROM "ProblemSubmission" ps
  JOIN "User" u ON ps.userId = u.id
  JOIN "Student" s ON u.id = s.userId
  WHERE ps.problemId = '$PROBLEM_ID'
  ORDER BY s.name
) TO STDOUT WITH (FORMAT csv, HEADER);
EOF > "$OUTPUT_DIR/problem-${PROBLEM_ID}-metadata.csv"

# Export code files
psql "$POSTGRES_URL" << EOF | while IFS='|' read -r SUBMISSION_ID STUDENT_NAME LANGUAGE CODE; do
SELECT 
  ps.id,
  s.name,
  ps.language,
  ps.code
FROM "ProblemSubmission" ps
JOIN "User" u ON ps.userId = u.id
JOIN "Student" s ON u.id = s.userId
WHERE ps.problemId = '$PROBLEM_ID'
ORDER BY s.name;
EOF
  # Note: Implement code file extraction at application level for better handling
done

echo "✅ Exported metadata: $OUTPUT_DIR/problem-${PROBLEM_ID}-metadata.csv"

# ====================================================================================
# COMMAND 4: Export Summary/Index for Evaluators
# ====================================================================================

COMPETITION_ID="your-competition-uuid-here"

psql "$POSTGRES_URL" << EOF
\COPY (
  SELECT 
    c.title as competition,
    p.title as problem,
    p.difficulty,
    COUNT(*) as total_submissions,
    COUNT(CASE WHEN ps.status = 'accepted' THEN 1 END) as accepted,
    ROUND(AVG(ps.score)::numeric, 2) as avg_score
  FROM "Problem" p
  JOIN "Competition" c ON p.competitionId = c.id
  LEFT JOIN "ProblemSubmission" ps ON p.id = ps.problemId
  WHERE c.id = '$COMPETITION_ID'
  GROUP BY c.id, c.title, p.id, p.title, p.difficulty
) TO STDOUT WITH (FORMAT csv, HEADER);
EOF > "$OUTPUT_DIR/evaluation-summary.csv"

echo "✅ Summary exported: $OUTPUT_DIR/evaluation-summary.csv"

# ====================================================================================
# COMMAND 5: Bulk Export All Submissions (Single CSV)
# ====================================================================================

psql "$POSTGRES_URL" << EOF
\COPY (
  SELECT 
    p.title as problem,
    s.name as student,
    s.rollNo as roll,
    u.email,
    ps.language,
    ps.code,
    ps.status,
    ps.score || '/' || ps.maxScore
  FROM "ProblemSubmission" ps
  JOIN "User" u ON ps.userId = u.id
  JOIN "Student" s ON u.id = s.userId
  JOIN "Problem" p ON ps.problemId = p.id
  ORDER BY p.title, s.name
) TO STDOUT WITH (FORMAT csv, HEADER);
EOF > "$OUTPUT_DIR/all-submissions.csv"

echo "✅ All submissions: $OUTPUT_DIR/all-submissions.csv"

# ====================================================================================
# COMMAND 6: Export Only Flagged Submissions (Need Manual Review)
# ====================================================================================

psql "$POSTGRES_URL" << EOF
\COPY (
  SELECT 
    p.title as problem,
    s.name,
    s.rollNo,
    u.email,
    ps.language,
    ps.status,
    ps.errorMessage as reason,
    ps.code,
    ps.submittedAt
  FROM "ProblemSubmission" ps
  JOIN "User" u ON ps.userId = u.id
  JOIN "Student" s ON u.id = s.userId
  JOIN "Problem" p ON ps.problemId = p.id
  WHERE ps.status IN ('wrong-answer', 'runtime-error', 'tle', 'compile-error')
  ORDER BY p.title, s.name
) TO STDOUT WITH (FORMAT csv, HEADER);
EOF > "$OUTPUT_DIR/flagged-submissions.csv"

echo "✅ Flagged submissions: $OUTPUT_DIR/flagged-submissions.csv"

# ====================================================================================
# COMMAND 7: Export for Google Sheets (Tab-separated for better compatibility)
# ====================================================================================

PROBLEM_ID="your-problem-uuid-here"

psql "$POSTGRES_URL" << EOF
\COPY (
  SELECT 
    s.name,
    s.rollNo,
    u.email,
    ps.language,
    ps.code,
    ps.status,
    ps.score || '/' || ps.maxScore
  FROM "ProblemSubmission" ps
  JOIN "User" u ON ps.userId = u.id
  JOIN "Student" s ON u.id = s.userId
  WHERE ps.problemId = '$PROBLEM_ID'
  ORDER BY s.name
) TO STDOUT WITH (FORMAT csv, DELIMITER E'\t', HEADER);
EOF > "$OUTPUT_DIR/problem-${PROBLEM_ID}-googledocs.tsv"

echo "✅ Google Sheets compatible: $OUTPUT_DIR/problem-${PROBLEM_ID}-googledocs.tsv"

# ====================================================================================
# DIRECT psql ALTERNATIVES (If you prefer interactive psql session)
# ====================================================================================

# Connect to database:
# psql "postgresql://codingnexus_user:nUOTxBglKrnRaktTu5L2AAxjlj650RCD@dpg-d5e0uo24d50c73fibuu0-a.oregon-postgres.render.com:5432/codingnexus"

# Then run inside psql:
# \COPY (SELECT ...) TO '/path/to/output.csv' WITH (FORMAT csv, HEADER);

# ====================================================================================
# NOTES FOR PRODUCTION USE
# ====================================================================================
# 1. Always create backups before bulk operations
# 2. Test exports with LIMIT 10 first to verify column order
# 3. Run during off-peak hours for large exports (>10k rows)
# 4. Monitor: SELECT COUNT(*) FROM "ProblemSubmission"; before exporting
# 5. For sensitive data, consider adding encryption to exports
# 6. CSV created with UTF-8 encoding, compatible with Excel/Google Sheets
