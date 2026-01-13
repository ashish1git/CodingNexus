-- ============================================================================
-- ALTERNATIVE EXPORT FORMATS
-- JSON, TSV, and Delimiter-separated exports for various use cases
-- ============================================================================

-- ============================================================================
-- FORMAT 1: JSON Export (For API/Web Display)
-- ============================================================================

-- PostgreSQL JSON aggregation for submissions by problem
SELECT 
  p.id,
  p.title,
  p.difficulty,
  p.points,
  json_agg(
    json_build_object(
      'studentId', ps.id,
      'studentName', s.name,
      'rollNo', s.rollNo,
      'email', u.email,
      'language', ps.language,
      'code', ps.code,
      'status', ps.status,
      'score', ps.score || '/' || ps.maxScore,
      'submittedAt', ps.submittedAt::text
    )
    ORDER BY s.name
  ) as submissions
FROM "Problem" p
LEFT JOIN "ProblemSubmission" ps ON p.id = ps.problemId
LEFT JOIN "User" u ON ps.userId = u.id
LEFT JOIN "Student" s ON u.id = s.userId
WHERE p.id = '{PROBLEM_ID}'
GROUP BY p.id, p.title, p.difficulty, p.points;

-- Export to JSON file
\COPY (
  SELECT 
    json_build_object(
      'problem', p.title,
      'difficulty', p.difficulty,
      'maxPoints', p.points,
      'submissions', json_agg(
        json_build_object(
          'studentName', s.name,
          'email', u.email,
          'language', ps.language,
          'code', ps.code,
          'status', ps.status,
          'score', ps.score || '/' || ps.maxScore
        ) ORDER BY s.name
      )
    )::text
  FROM "Problem" p
  LEFT JOIN "ProblemSubmission" ps ON p.id = ps.problemId
  LEFT JOIN "User" u ON ps.userId = u.id
  LEFT JOIN "Student" s ON u.id = s.userId
  WHERE p.competitionId = '{COMPETITION_ID}'
  GROUP BY p.id, p.title, p.difficulty, p.points
) TO STDOUT;

-- ============================================================================
-- FORMAT 2: TSV Export (Tab-Separated for Google Sheets)
-- ============================================================================

-- Tab-separated format - best for Google Sheets paste
\COPY (
  SELECT 
    s.name AS student_name,
    s.rollNo AS roll_number,
    u.email,
    ps.language,
    ps.code,
    ps.status,
    ps.score || '/' || ps.maxScore AS score,
    ps.submittedAt
  FROM "ProblemSubmission" ps
  JOIN "User" u ON ps.userId = u.id
  JOIN "Student" s ON u.id = s.userId
  WHERE ps.problemId = '{PROBLEM_ID}'
  ORDER BY s.name
) TO STDOUT WITH (FORMAT csv, DELIMITER E'\t', HEADER);

-- ============================================================================
-- FORMAT 3: Pipe-Separated (For custom parsing)
-- ============================================================================

\COPY (
  SELECT 
    s.name,
    s.rollNo,
    u.email,
    ps.language,
    ps.code,
    ps.status,
    ps.score,
    ps.maxScore,
    ps.submittedAt
  FROM "ProblemSubmission" ps
  JOIN "User" u ON ps.userId = u.id
  JOIN "Student" s ON u.id = s.userId
  WHERE ps.problemId = '{PROBLEM_ID}'
  ORDER BY s.name
) TO STDOUT WITH (FORMAT csv, DELIMITER '|', HEADER);

-- ============================================================================
-- FORMAT 4: Code-Only Export (Separate files per student)
-- ============================================================================

-- Metadata for linking
\COPY (
  SELECT 
    ps.id AS submission_id,
    s.name,
    s.rollNo,
    u.email,
    ps.language,
    ps.status,
    ps.submittedAt
  FROM "ProblemSubmission" ps
  JOIN "User" u ON ps.userId = u.id
  JOIN "Student" s ON u.id = s.userId
  WHERE ps.problemId = '{PROBLEM_ID}'
  ORDER BY s.name
) TO '/path/to/metadata.csv' WITH (FORMAT csv, HEADER);

-- Then export code separately (requires application-level processing):
-- For each row in metadata:
-- SELECT code FROM "ProblemSubmission" WHERE id = '{submission_id}'
-- Save to: /submissions/{student_name}_{language}.{extension}

-- ============================================================================
-- FORMAT 5: HTML Report (For email/web display)
-- ============================================================================

-- Generate HTML summary table
SELECT 
  '<html><body><table border="1">' ||
  '<tr><th>Student</th><th>Roll</th><th>Status</th><th>Score</th></tr>' ||
  string_agg(
    '<tr><td>' || s.name || '</td><td>' || s.rollNo || '</td><td>' || 
    ps.status || '</td><td>' || ps.score || '/' || ps.maxScore || '</td></tr>',
    ''
  ) ||
  '</table></body></html>' as html_report
FROM "ProblemSubmission" ps
JOIN "User" u ON ps.userId = u.id
JOIN "Student" s ON u.id = s.userId
WHERE ps.problemId = '{PROBLEM_ID}';

-- ============================================================================
-- FORMAT 6: Markdown Report (For documentation)
-- ============================================================================

SELECT 
  '# ' || p.title || ' - Submissions Report' || chr(10) || chr(10) ||
  '| Student | Roll | Language | Status | Score |' || chr(10) ||
  '|---------|------|----------|--------|-------|' ||
  string_agg(
    chr(10) || '| ' || s.name || ' | ' || s.rollNo || ' | ' || 
    ps.language || ' | ' || ps.status || ' | ' || ps.score || '/' || ps.maxScore || ' |',
    ''
  ) as markdown_report
FROM "Problem" p
LEFT JOIN "ProblemSubmission" ps ON p.id = ps.problemId
LEFT JOIN "User" u ON ps.userId = u.id
LEFT JOIN "Student" s ON u.id = s.userId
WHERE p.id = '{PROBLEM_ID}'
GROUP BY p.id, p.title;

-- ============================================================================
-- FORMAT 7: SQL Insert Format (For backup/restore)
-- ============================================================================

-- Generate INSERT statements for backup
SELECT 
  'INSERT INTO "ProblemSubmission" (id, problemId, userId, code, language, score, maxScore, status, submittedAt) VALUES (' ||
  quote_literal(ps.id) || ', ' ||
  quote_literal(ps.problemId) || ', ' ||
  quote_literal(ps.userId) || ', ' ||
  quote_literal(ps.code) || ', ' ||
  quote_literal(ps.language) || ', ' ||
  ps.score || ', ' ||
  ps.maxScore || ', ' ||
  quote_literal(ps.status) || ', ' ||
  quote_literal(ps.submittedAt) || ');'
FROM "ProblemSubmission" ps
WHERE ps.problemId = '{PROBLEM_ID}'
ORDER BY ps.submittedAt;

-- ============================================================================
-- FORMAT 8: LaTeX Table (For academic papers/thesis)
-- ============================================================================

SELECT 
  '\begin{table}[h]' || chr(10) ||
  '\centering' || chr(10) ||
  '\caption{Submissions for ' || p.title || '}' || chr(10) ||
  '\begin{tabular}{|c|c|c|c|}' || chr(10) ||
  '\hline' || chr(10) ||
  'Student & Language & Status & Score \\' || chr(10) ||
  '\hline' || chr(10) ||
  string_agg(
    s.name || ' & ' || ps.language || ' & ' || ps.status || ' & ' || 
    ps.score || '/' || ps.maxScore || ' \\',
    chr(10)
  ) || chr(10) ||
  '\hline' || chr(10) ||
  '\end{tabular}' || chr(10) ||
  '\end{table}' as latex_table
FROM "Problem" p
LEFT JOIN "ProblemSubmission" ps ON p.id = ps.problemId
LEFT JOIN "User" u ON ps.userId = u.id
LEFT JOIN "Student" s ON u.id = s.userId
WHERE p.id = '{PROBLEM_ID}'
GROUP BY p.id, p.title;

-- ============================================================================
-- FORMAT 9: XML Export (For enterprise systems)
-- ============================================================================

SELECT 
  '<?xml version="1.0" encoding="UTF-8"?>' || chr(10) ||
  '<submissions>' || chr(10) ||
  string_agg(
    '  <submission>' || chr(10) ||
    '    <student>' || s.name || '</student>' || chr(10) ||
    '    <rollNo>' || s.rollNo || '</rollNo>' || chr(10) ||
    '    <email>' || u.email || '</email>' || chr(10) ||
    '    <language>' || ps.language || '</language>' || chr(10) ||
    '    <status>' || ps.status || '</status>' || chr(10) ||
    '    <score>' || ps.score || '/' || ps.maxScore || '</score>' || chr(10) ||
    '  </submission>' || chr(10),
    ''
  ) ||
  '</submissions>' as xml_export
FROM "ProblemSubmission" ps
JOIN "User" u ON ps.userId = u.id
JOIN "Student" s ON u.id = s.userId
WHERE ps.problemId = '{PROBLEM_ID}'
ORDER BY s.name;

-- ============================================================================
-- FORMAT 10: YAML Format (For configuration/documentation)
-- ============================================================================

SELECT 
  'competition: ' || c.title || chr(10) ||
  'problem: ' || p.title || chr(10) ||
  'submissions:' || chr(10) ||
  string_agg(
    '  - name: ' || s.name || chr(10) ||
    '    rollNo: ' || s.rollNo || chr(10) ||
    '    email: ' || u.email || chr(10) ||
    '    language: ' || ps.language || chr(10) ||
    '    status: ' || ps.status || chr(10) ||
    '    score: ' || ps.score || '/' || ps.maxScore || chr(10),
    ''
  ) as yaml_export
FROM "Problem" p
JOIN "Competition" c ON p.competitionId = c.id
LEFT JOIN "ProblemSubmission" ps ON p.id = ps.problemId
LEFT JOIN "User" u ON ps.userId = u.id
LEFT JOIN "Student" s ON u.id = s.userId
WHERE p.id = '{PROBLEM_ID}'
GROUP BY c.id, c.title, p.id, p.title;

-- ============================================================================
-- QUICK REFERENCE: Which Format to Use
-- ============================================================================

/*
CSV        → Google Sheets / Excel / General purpose
TSV        → Copy-paste into Google Sheets (best for wide columns)
JSON       → APIs, web applications, programmatic processing
XML        → Enterprise systems, legacy integrations
YAML       → Configuration, documentation
HTML       → Email, web display, reports
Markdown   → Documentation, GitHub, wikis
LaTeX      → Academic papers, PDF generation
SQL        → Backup, migration, version control
Code-only  → Manual code review with IDE
Pipe-delim → Custom parsing, data pipelines

BEST FOR TEAM EVALUATION: CSV or TSV to Google Sheets
*/
