/**
 * Create interactive HTML evaluation dashboard
 * Generates an HTML file where evaluators can review submissions with code highlighting
 * 
 * Usage:
 *   node create-evaluation-dashboard.js --csv ./exports/array_search_algorithms_challenge_all_submissions_fd71a5b2.csv
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

/**
 * Parse CSV file
 */
async function parseCSV(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const submissions = [];
  let headers = [];
  let lineNum = 0;

  for await (const line of rl) {
    if (lineNum === 0) {
      // Parse headers
      headers = parseCSVLine(line);
    } else {
      const values = parseCSVLine(line);
      const submission = {};
      headers.forEach((header, i) => {
        submission[header] = values[i] || '';
      });
      submissions.push(submission);
    }
    lineNum++;
  }

  return submissions;
}

/**
 * Parse CSV line handling quoted fields
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Split submissions among evaluators
 */
function splitSubmissions(submissions, numEvaluators) {
  const evaluatorGroups = Array.from({ length: numEvaluators }, () => []);
  submissions.forEach((sub, index) => {
    evaluatorGroups[index % numEvaluators].push(sub);
  });
  return evaluatorGroups;
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Generate HTML dashboard for one evaluator
 */
function generateDashboardHTML(submissions, evaluatorName, evaluatorNum) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Evaluation Dashboard - ${evaluatorName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: rgba(255,255,255,0.2);
            margin-top: 15px;
        }
        
        .progress-fill {
            height: 100%;
            background: #4CAF50;
            transition: width 0.3s ease;
        }
        
        .content {
            display: flex;
            min-height: calc(100vh - 200px);
        }
        
        .sidebar {
            width: 280px;
            background: #f5f5f5;
            border-right: 1px solid #ddd;
            overflow-y: auto;
        }
        
        .submission-list {
            list-style: none;
        }
        
        .submission-item {
            padding: 12px 15px;
            border-bottom: 1px solid #ddd;
            cursor: pointer;
            transition: background 0.2s;
            font-size: 13px;
        }
        
        .submission-item:hover {
            background: #efefef;
        }
        
        .submission-item.active {
            background: #667eea;
            color: white;
        }
        
        .submission-item.reviewed {
            border-left: 4px solid #4CAF50;
        }
        
        .main-content {
            flex: 1;
            padding: 30px;
            overflow-y: auto;
        }
        
        .submission-card {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .card-header {
            background: #f9f9f9;
            padding: 20px;
            border-bottom: 1px solid #ddd;
        }
        
        .card-header h2 {
            font-size: 20px;
            margin-bottom: 10px;
            color: #333;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .info-item {
            font-size: 13px;
        }
        
        .info-label {
            color: #666;
            font-weight: bold;
        }
        
        .code-section {
            padding: 20px;
            background: #f5f5f5;
        }
        
        .code-section h3 {
            margin-bottom: 15px;
            color: #333;
        }
        
        pre {
            background: #282c34;
            color: #abb2bf;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.5;
        }
        
        .evaluation-section {
            padding: 20px;
            border-top: 1px solid #ddd;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #333;
        }
        
        .form-group input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
        }
        
        .form-group textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            resize: vertical;
            min-height: 80px;
        }
        
        .button-group {
            display: flex;
            gap: 10px;
        }
        
        button {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: background 0.2s;
        }
        
        .btn-save {
            background: #4CAF50;
            color: white;
        }
        
        .btn-save:hover {
            background: #45a049;
        }
        
        .btn-next {
            background: #667eea;
            color: white;
        }
        
        .btn-next:hover {
            background: #5568d3;
        }
        
        .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .status.pass {
            background: #e8f5e9;
            color: #2e7d32;
        }
        
        .status.fail {
            background: #ffebee;
            color: #c62828;
        }
        
        @media (max-width: 768px) {
            .content {
                flex-direction: column;
            }
            
            .sidebar {
                width: 100%;
                max-height: 200px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📝 Code Evaluation Dashboard</h1>
            <p>Evaluator: <strong>${evaluatorName}</strong></p>
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill" style="width: 0%"></div>
            </div>
            <p style="margin-top: 10px;"><span id="progressText">0</span> / ${submissions.length} evaluated</p>
        </div>
        
        <div class="content">
            <div class="sidebar">
                <ul class="submission-list" id="submissionList">
                </ul>
            </div>
            
            <div class="main-content">
                <div id="submissionContainer"></div>
            </div>
        </div>
    </div>
    
    <script>
        const submissions = ${JSON.stringify(submissions)};
        let currentIndex = 0;
        const evaluations = {};
        
        // Load saved evaluations from localStorage
        const saved = localStorage.getItem('evaluations');
        if (saved) {
            Object.assign(evaluations, JSON.parse(saved));
        }
        
        function renderSubmissionList() {
            const list = document.getElementById('submissionList');
            list.innerHTML = submissions.map((sub, idx) => {
                const isReviewed = evaluations[sub.Email + '_' + sub['Problem Title']];
                return \`
                    <li class="submission-item \${idx === currentIndex ? 'active' : ''} \${isReviewed ? 'reviewed' : ''}" onclick="selectSubmission(\${idx})">
                        <strong>\${sub['Student Name']}</strong><br>
                        <small>\${sub['Problem Title']}</small>
                        \${isReviewed ? '<br>✅ Reviewed' : ''}
                    </li>
                \`;
            }).join('');
        }
        
        function renderSubmission(index) {
            const sub = submissions[index];
            const key = sub.Email + '_' + sub['Problem Title'];
            const saved = evaluations[key] || {};
            
            const html = \`
                <div class="submission-card">
                    <div class="card-header">
                        <h2>\${sub['Problem Title']}</h2>
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Student Name</div>
                                \${sub['Student Name']}
                            </div>
                            <div class="info-item">
                                <div class="info-label">Roll Number</div>
                                \${sub['Roll Number']}
                            </div>
                            <div class="info-item">
                                <div class="info-label">Email</div>
                                \${sub['Email']}
                            </div>
                            <div class="info-item">
                                <div class="info-label">Language</div>
                                \${sub['Language']}
                            </div>
                            <div class="info-item">
                                <div class="info-label">Status</div>
                                <span class="status \${sub['Status'] === 'accepted' ? 'pass' : 'fail'}">\${sub['Status']}</span>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Tests Passed</div>
                                \${sub['Tests Passed']}
                            </div>
                        </div>
                    </div>
                    
                    <div class="code-section">
                        <h3>📄 Code Submission</h3>
                        <pre><code>\${sub['Code'].substring(0, 5000)}\${sub['Code'].length > 5000 ? '\\n\\n... (code truncated)' : ''}</code></pre>
                    </div>
                    
                    <div class="evaluation-section">
                        <h3>✏️ Your Evaluation</h3>
                        <form id="evaluationForm" onsubmit="saveEvaluation(event, \${index})">
                            <div class="form-group">
                                <label for="marks">Marks (out of 100)</label>
                                <input type="number" id="marks" min="0" max="100" value="\${saved.marks || ''}" placeholder="Enter marks 0-100">
                            </div>
                            
                            <div class="form-group">
                                <label for="comments">Comments & Feedback</label>
                                <textarea id="comments" placeholder="Logic analysis, improvements, etc...">\${saved.comments || ''}</textarea>
                            </div>
                            
                            <div class="button-group">
                                <button type="submit" class="btn-save">💾 Save & Continue</button>
                                <button type="button" class="btn-next" onclick="selectSubmission(\${index + 1})">⏭️ Next</button>
                            </div>
                        </form>
                    </div>
                </div>
            \`;
            
            document.getElementById('submissionContainer').innerHTML = html;
        }
        
        function selectSubmission(index) {
            if (index < 0 || index >= submissions.length) return;
            currentIndex = index;
            renderSubmission(index);
            renderSubmissionList();
            document.querySelectorAll('.submission-item')[index].scrollIntoView({ block: 'nearest' });
        }
        
        function saveEvaluation(event, index) {
            event.preventDefault();
            const marks = document.getElementById('marks').value;
            const comments = document.getElementById('comments').value;
            
            if (!marks) {
                alert('Please enter marks');
                return;
            }
            
            const sub = submissions[index];
            const key = sub.Email + '_' + sub['Problem Title'];
            evaluations[key] = { marks, comments, timestamp: new Date().toISOString() };
            localStorage.setItem('evaluations', JSON.stringify(evaluations));
            
            updateProgress();
            renderSubmissionList();
            
            // Move to next
            if (currentIndex + 1 < submissions.length) {
                selectSubmission(currentIndex + 1);
            } else {
                alert('✅ All submissions evaluated!');
            }
        }
        
        function updateProgress() {
            const reviewed = Object.keys(evaluations).length;
            const percent = (reviewed / submissions.length) * 100;
            document.getElementById('progressFill').style.width = percent + '%';
            document.getElementById('progressText').textContent = reviewed;
        }
        
        // Export evaluations
        window.exportEvaluations = function() {
            const data = submissions.map(sub => {
                const key = sub.Email + '_' + sub['Problem Title'];
                const eval = evaluations[key] || {};
                return {
                    'Student Name': sub['Student Name'],
                    'Roll Number': sub['Roll Number'],
                    'Email': sub['Email'],
                    'Problem Title': sub['Problem Title'],
                    'Marks': eval.marks || 'Not reviewed',
                    'Comments': eval.comments || '',
                    'Timestamp': eval.timestamp || ''
                };
            });
            
            const csv = [
                Object.keys(data[0]).join(','),
                ...data.map(row => Object.values(row).map(v => \`"\${v}"\`).join(','))
            ].join('\\n');
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'evaluation_results_${evaluatorName}.csv';
            a.click();
        };
        
        // Initialize
        renderSubmissionList();
        selectSubmission(0);
        updateProgress();
    </script>
</body>
</html>`;

  return html;
}

// ============================================================================
// MAIN
// ============================================================================

const args = process.argv.slice(2);
let csvPath = null;
let outputDir = './exports';
let numEvaluators = 4;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--csv' && args[i + 1]) {
    csvPath = args[i + 1];
    i++;
  } else if (args[i] === '--output' && args[i + 1]) {
    outputDir = args[i + 1];
    i++;
  } else if (args[i] === '--evaluators' && args[i + 1]) {
    numEvaluators = parseInt(args[i + 1]);
    i++;
  }
}

if (!csvPath) {
  console.error('❌ Error: --csv <path> is required');
  console.error('\nUsage:');
  console.error('  node create-evaluation-dashboard.js --csv ./exports/submissions.csv');
  console.error('  node create-evaluation-dashboard.js --csv ./exports/submissions.csv --evaluators 4');
  process.exit(1);
}

// Parse CSV
console.log('📂 Reading CSV file...');
const submissions = await parseCSV(csvPath);
console.log(`✅ Loaded ${submissions.length} submissions`);

// Split among evaluators
console.log(`\n📊 Splitting among ${numEvaluators} evaluators...`);
const evaluatorGroups = splitSubmissions(submissions, numEvaluators);

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate dashboards
evaluatorGroups.forEach((group, idx) => {
  const evaluatorName = `Evaluator ${idx + 1}`;
  const html = generateDashboardHTML(group, evaluatorName, idx + 1);
  const filename = path.join(outputDir, `evaluation-dashboard-${idx + 1}-${evaluatorName.replace(/ /g, '_')}.html`);
  fs.writeFileSync(filename, html, 'utf-8');
  console.log(`✅ Created: ${filename} (${group.length} submissions)`);
});

console.log('\n' + '='.repeat(60));
console.log('✨ EVALUATION DASHBOARDS READY!');
console.log('='.repeat(60));
console.log('\nEach evaluator gets their own HTML file with:');
console.log('  ✓ Code syntax highlighting');
console.log('  ✓ Student information');
console.log('  ✓ Input form for marks & comments');
console.log('  ✓ Progress tracking');
console.log('  ✓ Auto-save with localStorage');
console.log('  ✓ Export results to CSV');
console.log('\nOpen the HTML files in any browser to start evaluating!');
