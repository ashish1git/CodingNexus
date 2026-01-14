# Evaluation Tracking System - Complete Guide

## 🎯 Overview

The evaluation tracking system allows admins to:
1. **Manually evaluate submissions** with marks and comments
2. **View complete evaluation history** - see who evaluated, when, and what changes were made
3. **Track evaluator activity** - monitor which admin evaluated which submissions
4. **Audit trail** - full transparency of all evaluation actions

## 📊 Features Added

### 1. Evaluation Fields on Submissions
Each `ProblemSubmission` now tracks:
- `manualMarks` - Marks given by evaluator (0-100)
- `evaluatorComments` - Feedback/comments from evaluator
- `evaluatedBy` - Admin user ID who evaluated
- `evaluatedAt` - Timestamp of evaluation
- `isEvaluated` - Boolean flag for quick filtering

### 2. Evaluation History Table
New `SubmissionEvaluation` table tracks:
- **Who**: Evaluator name, ID, and role
- **What**: Marks given, comments, action type (create/update/review)
- **When**: Timestamp of evaluation
- **Changes**: Previous marks and comments (for updates)
- **Where**: IP address for security audit

### 3. API Endpoints

#### Evaluate Submission (Enhanced)
```
POST /api/competitions/:competitionId/problems/:problemId/submissions/:submissionId/evaluate
```
**Body**: `{ marks: 85, comments: "Great logic!" }`
**Response**: Includes evaluation history entry creation

#### Get Evaluation History
```
GET /api/competitions/:competitionId/problems/:problemId/submissions/:submissionId/history
```
**Returns**: Array of all evaluations for this submission

#### Get All Evaluations
```
GET /api/competitions/:competitionId/evaluations
```
**Returns**: All evaluations across all problems in competition

#### Get Evaluator Activity
```
GET /api/competitions/:competitionId/evaluator-activity
```
**Returns**: Summary of each evaluator's activity:
- Total evaluations
- New evaluations (creates)
- Updates
- Reviews
- Problems evaluated
- Last activity timestamp

## 🎨 UI Components

### 1. Evaluation History Modal
- Click "View History" button on evaluated submissions
- Shows timeline of all evaluations
- Displays:
  - Evaluator name and role
  - Action type (CREATE/UPDATE/REVIEW)
  - Current and previous marks
  - Current and previous comments
  - Timestamp and IP address

### 2. Evaluator Activity Dashboard
- Click "Evaluator Activity" in header
- Shows all evaluators who worked on this competition
- Statistics per evaluator:
  - Total evaluations count
  - Breakdown: New/Updates/Reviews
  - List of problems they evaluated
  - Last activity time

### 3. Enhanced Submission Card
- Shows "Evaluated" badge if already evaluated
- Displays:
  - Manual marks (prominent)
  - Evaluator name
  - Evaluation timestamp
- Quick access to history

## 📝 Usage Guide

### For Evaluators (Admins)

1. **Navigate to Competition**
   - Go to Admin Dashboard → Competitions
   - Click on competition to evaluate

2. **Evaluate Submissions**
   - Select a problem from sidebar
   - Review student code
   - Enter marks (0-100) and comments
   - Click "Save & Continue"

3. **View History**
   - Click "View History" on any evaluated submission
   - See complete audit trail of evaluations

4. **Check Activity**
   - Click "Evaluator Activity" button
   - See who evaluated what and when

### For Super Admins

1. **Monitor Evaluation Progress**
   - Use Evaluator Activity to see workload distribution
   - Track which evaluators are most active
   - Identify which problems need more review

2. **Audit Evaluations**
   - Check evaluation history for any submission
   - Verify marks and comments
   - See if evaluations were updated (and why)

3. **Export Results**
   - Click "Export Results" for CSV export
   - Includes all evaluation data

## 🔧 Database Migration

### Option 1: Automatic (if you have superuser access)
```bash
npx prisma migrate dev --name add_evaluation_tracking
```

### Option 2: Manual (for Render/hosted databases)
Run the SQL script located at:
```
prisma/migrations/add_evaluation_tracking.sql
```

Steps:
1. Go to your Render dashboard
2. Open your PostgreSQL database
3. Go to "Query" or "SQL Editor"
4. Copy and paste the SQL from the migration file
5. Execute the script
6. Verify with the verification queries at the end

## 🔍 Data Structure

### ProblemSubmission (Enhanced)
```typescript
{
  id: string
  code: string
  language: string
  score: number              // Auto-calculated score
  manualMarks: number?       // Manual marks (0-100)
  evaluatorComments: string?
  evaluatedBy: string?       // Admin user ID
  evaluatedAt: DateTime?
  isEvaluated: boolean
  // ... other fields
}
```

### SubmissionEvaluation (New)
```typescript
{
  id: string
  submissionId: string
  evaluatorId: string
  evaluatorName: string
  evaluatorRole: string      // 'admin', 'subadmin', 'superadmin'
  marks: number
  comments: string?
  action: string             // 'create', 'update', 'review'
  previousMarks: number?     // For audit trail
  previousComments: string?
  createdAt: DateTime
  ipAddress: string?
}
```

## 🛡️ Security Features

1. **IP Tracking**: Every evaluation logs the evaluator's IP address
2. **Role Verification**: Only admins/superadmins can evaluate
3. **Audit Trail**: Complete history of all changes
4. **Immutable History**: History records are never deleted, only appended

## 📈 Analytics You Can Extract

### Evaluator Performance
- Evaluations per hour/day
- Average time between evaluations
- Number of re-evaluations (updates)

### Evaluation Quality
- Consistency across evaluators
- Re-evaluation rate (how often marks are changed)
- Comment length and detail

### Workload Distribution
- Which evaluators handle which problems
- Balanced vs unbalanced workload
- Peak evaluation times

## 🚀 Future Enhancements

Possible additions:
- [ ] Evaluation rubrics/criteria
- [ ] Peer review system (one admin reviews another's evaluation)
- [ ] Automated quality checks (flag large mark changes)
- [ ] Evaluation statistics dashboard
- [ ] Export evaluation reports per evaluator
- [ ] Email notifications when evaluations are updated

## 🐛 Troubleshooting

### "Failed to save evaluation"
- Check if user has admin/superadmin role
- Verify submission ID exists
- Check network connection to API

### "No evaluation history found"
- Submission may not have been evaluated yet
- History only shows after first evaluation

### Migration failed
- Use the manual SQL script
- Check database connection
- Verify you have necessary permissions

## 📞 Support

For issues or questions:
1. Check the console logs (browser and server)
2. Verify database migration completed successfully
3. Check that Prisma client was regenerated (`npx prisma generate`)

---

**Version**: 1.0  
**Last Updated**: January 2026  
**Status**: Production Ready ✅
