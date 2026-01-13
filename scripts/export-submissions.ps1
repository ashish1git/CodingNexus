# ============================================================================
# PRODUCTION-READY: Windows PowerShell Export Commands
# For PostgreSQL submissions export on Windows
# ============================================================================

# Database Configuration
$DB_HOST = "dpg-d5e0uo24d50c73fibuu0-a.oregon-postgres.render.com"
$DB_NAME = "codingnexus"
$DB_USER = "codingnexus_user"
$DB_PASSWORD = "nUOTxBglKrnRaktTu5L2AAxjlj650RCD"
$DB_PORT = "5432"
$OUTPUT_DIR = "C:\submissions_export"
$TIMESTAMP = (Get-Date -Format "yyyy-MM-dd-HHmmss")

# Create output directory
if (!(Test-Path $OUTPUT_DIR)) {
    New-Item -ItemType Directory -Path $OUTPUT_DIR | Out-Null
}

# ============================================================================
# FUNCTION 1: Export Single Problem to CSV
# ============================================================================

Function Export-ProblemSubmissions {
    param(
        [Parameter(Mandatory=$true)]
        [string]$ProblemId,
        
        [string]$OutputFile = "$OUTPUT_DIR\problem-$ProblemId.csv"
    )
    
    $query = @"
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
WHERE ps.problemId = '$ProblemId'
ORDER BY s.name, ps.submittedAt DESC
"@

    $psqlPath = "psql"  # Ensure psql is in PATH or provide full path
    
    & $psqlPath -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT `
        -c "\COPY ($query) TO STDOUT WITH (FORMAT csv, HEADER)" `
        -o $OutputFile -w
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Exported: $OutputFile" -ForegroundColor Green
    } else {
        Write-Host "❌ Export failed for problem $ProblemId" -ForegroundColor Red
    }
}

# ============================================================================
# FUNCTION 2: Export All Problems in Competition
# ============================================================================

Function Export-CompetitionProblems {
    param(
        [Parameter(Mandatory=$true)]
        [string]$CompetitionId
    )
    
    $getProblemsQuery = @"
SELECT ps.problemId, p.title 
FROM "ProblemSubmission" ps
JOIN "Problem" p ON ps.problemId = p.id
WHERE p.competitionId = '$CompetitionId'
GROUP BY ps.problemId, p.title
ORDER BY p.title;
"@

    $psqlPath = "psql"
    $tempFile = "$env:TEMP\problems_list.txt"
    
    & $psqlPath -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT `
        -c $getProblemsQuery > $tempFile -w
    
    $problems = Get-Content $tempFile | Select-Object -Skip 2 | Where-Object {$_.Trim() -ne ""}
    
    foreach ($line in $problems) {
        $parts = $line -split '\|'
        if ($parts.Count -ge 1) {
            $problemId = $parts[0].Trim()
            $problemTitle = $parts[1].Trim()
            
            if ($problemId -and $problemId -ne "---") {
                $safeTitle = $problemTitle -replace '[^a-zA-Z0-9_-]', '_' -replace '_+', '_'
                $outputFile = "$OUTPUT_DIR\${safeTitle}.csv"
                Export-ProblemSubmissions -ProblemId $problemId -OutputFile $outputFile
            }
        }
    }
    
    Remove-Item $tempFile
}

# ============================================================================
# FUNCTION 3: Export Summary Report
# ============================================================================

Function Export-EvaluationSummary {
    param(
        [Parameter(Mandatory=$true)]
        [string]$CompetitionId
    )
    
    $query = @"
SELECT 
    c.title as competition,
    p.title as problem,
    p.difficulty,
    COUNT(DISTINCT ps.userId) as total_submissions,
    COUNT(CASE WHEN ps.status = 'accepted' THEN 1 END) as accepted,
    COUNT(CASE WHEN ps.status = 'wrong-answer' THEN 1 END) as wrong_answer,
    ROUND(AVG(ps.score)::numeric, 2) as avg_score,
    MAX(ps.score) as max_score
FROM "Problem" p
JOIN "Competition" c ON p.competitionId = c.id
LEFT JOIN "ProblemSubmission" ps ON p.id = ps.problemId
WHERE c.id = '$CompetitionId'
GROUP BY c.id, c.title, p.id, p.title, p.difficulty
ORDER BY p.title;
"@
    
    $outputFile = "$OUTPUT_DIR\evaluation-summary-$TIMESTAMP.csv"
    $psqlPath = "psql"
    
    & $psqlPath -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT `
        -c "\COPY ($query) TO STDOUT WITH (FORMAT csv, HEADER)" `
        -o $outputFile -w
    
    Write-Host "✅ Summary: $outputFile" -ForegroundColor Green
}

# ============================================================================
# FUNCTION 4: Export Flagged Submissions
# ============================================================================

Function Export-FlaggedSubmissions {
    
    $query = @"
SELECT 
    p.title as problem,
    s.name as student,
    s.rollNo as roll,
    u.email,
    ps.language,
    ps.status,
    ps.errorMessage as reason,
    ps.score || '/' || ps.maxScore as score,
    ps.code,
    ps.submittedAt
FROM "ProblemSubmission" ps
JOIN "User" u ON ps.userId = u.id
JOIN "Student" s ON u.id = s.userId
JOIN "Problem" p ON ps.problemId = p.id
WHERE ps.status IN ('wrong-answer', 'runtime-error', 'tle', 'compile-error')
ORDER BY p.title, s.name;
"@
    
    $outputFile = "$OUTPUT_DIR\flagged-submissions-$TIMESTAMP.csv"
    $psqlPath = "psql"
    
    & $psqlPath -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT `
        -c "\COPY ($query) TO STDOUT WITH (FORMAT csv, HEADER)" `
        -o $outputFile -w
    
    Write-Host "✅ Flagged: $outputFile" -ForegroundColor Green
}

# ============================================================================
# USAGE EXAMPLES
# ============================================================================

# Export single problem
# Export-ProblemSubmissions -ProblemId "550e8400-e29b-41d4-a716-446655440000"

# Export entire competition
# Export-CompetitionProblems -CompetitionId "550e8400-e29b-41d4-a716-446655440001"

# Export summary
# Export-EvaluationSummary -CompetitionId "550e8400-e29b-41d4-a716-446655440001"

# Export flagged items
# Export-FlaggedSubmissions

# ============================================================================
# AUTOMATED BATCH EXPORT SCRIPT
# ============================================================================

Function Invoke-FullExport {
    param(
        [Parameter(Mandatory=$true)]
        [string]$CompetitionId
    )
    
    Write-Host "Starting full export for competition: $CompetitionId" -ForegroundColor Cyan
    Write-Host "Output directory: $OUTPUT_DIR`n" -ForegroundColor Yellow
    
    # Get competition details
    $compQuery = "SELECT title FROM \"Competition\" WHERE id = '$CompetitionId';"
    $psqlPath = "psql"
    $compTitle = & $psqlPath -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT `
        -t -c $compQuery
    
    Write-Host "Competition: $compTitle`n" -ForegroundColor Green
    
    # Export all problem-wise CSVs
    Write-Host "Exporting problem-wise submissions..." -ForegroundColor Cyan
    Export-CompetitionProblems -CompetitionId $CompetitionId
    
    # Export summary
    Write-Host "`nExporting evaluation summary..." -ForegroundColor Cyan
    Export-EvaluationSummary -CompetitionId $CompetitionId
    
    # Export flagged
    Write-Host "`nExporting flagged submissions..." -ForegroundColor Cyan
    Export-FlaggedSubmissions
    
    Write-Host "`n✅ EXPORT COMPLETE!" -ForegroundColor Green
    Write-Host "Files saved to: $OUTPUT_DIR" -ForegroundColor Yellow
    
    # Open folder
    Invoke-Item $OUTPUT_DIR
}

# ============================================================================
# QUICK START - Run this for complete export:
# ============================================================================
# Invoke-FullExport -CompetitionId "your-competition-id-here"
