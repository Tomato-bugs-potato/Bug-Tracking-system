const fs = require('fs');
const fetch = require('node-fetch');

const [,, projectId, commit, apiUrl] = process.argv;
if (!projectId || !commit || !apiUrl) {
  console.error('Usage: node parse-and-report-failures.js <projectId> <commit> <apiUrl>');
  process.exit(1);
}

const testOutput = fs.readFileSync('test-output.txt', 'utf8');
const lines = testOutput.split('\n');
const failures = [];

// Simple regex for Jest/Mocha style failures (customize for your framework)
let currentTest = null;
let currentError = '';
for (const line of lines) {
  if (/^\s*✕|FAIL|●/.test(line)) {
    if (currentTest && currentError) {
      failures.push({ testName: currentTest, error: currentError.trim() });
    }
    currentTest = line.trim();
    currentError = '';
  } else if (currentTest) {
    currentError += line + '\n';
  }
}
if (currentTest && currentError) {
  failures.push({ testName: currentTest, error: currentError.trim() });
}

if (failures.length === 0) {
  console.log('No test failures found.');
  process.exit(0);
}

fetch(apiUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ projectId, commit, failures })
})
  .then(res => res.json())
  .then(data => {
    console.log('Reported failures:', data);
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to report failures:', err);
    process.exit(1);
  }); 