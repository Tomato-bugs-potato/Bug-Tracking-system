const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

// Get command line arguments
const commitHash = process.argv[2] || 'unknown';
const commitMessage = process.argv[3] || 'unknown';
const branch = process.argv[4] || 'unknown';

// Configuration
const config = {
  apiUrl: process.env.BUG_API_URL || 'http://localhost:3000/api/bugs',
  projectId: process.env.PROJECT_ID || '', // Set this in your environment or CI
  reporterId: process.env.REPORTER_ID || '', // Set this in your environment or CI
};

// Load project configuration from package.json if available
try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
  );
  if (packageJson.bugTracker) {
    Object.assign(config, packageJson.bugTracker);
  }
} catch (error) {
  console.error('Error reading package.json:', error.message);
}

// Get failed test output
const getTestOutput = () => {
  try {
    // This approach assumes you're capturing test output in a file
    // You may need to adjust this based on your test setup
    const testOutputPath = path.join(__dirname, '..', 'test-output.log');
    if (fs.existsSync(testOutputPath)) {
      return fs.readFileSync(testOutputPath, 'utf8');
    }
    
    // Alternative: try to re-run tests to capture output
    return execSync('npm test', { stdio: 'pipe' }).toString();
  } catch (error) {
    if (error.stdout) {
      return error.stdout.toString();
    }
    return 'Failed to capture test output';
  }
};

// Function to report bug to the tracking system
const reportBug = async () => {
  const testOutput = getTestOutput();
  
  // Extract failing test information
  const failingTests = testOutput.match(/● (.*?)\n/g) || [];
  const failingTestDetails = failingTests.map(test => test.replace('● ', '').trim());
  
  if (failingTestDetails.length === 0) {
    console.log('No specific failing tests identified. Using generic failure title.');
    failingTestDetails.push('Test suite failed without specific test failures');
  }
  
  // Create bug report data
  const data = JSON.stringify({
    title: `Test Failure: ${failingTestDetails[0]}`,
    description: `Tests failed during pre-push hook execution on branch ${branch}.

**Commit Details**
- Hash: ${commitHash}
- Message: ${commitMessage}
- Branch: ${branch}

**Failing Tests**
${failingTestDetails.join('\n')}

**Test Output**
\`\`\`
${testOutput.substring(0, 2000)}${testOutput.length > 2000 ? '...(truncated)' : ''}
\`\`\`
`,
    stepsToReproduce: `1. Checkout commit ${commitHash} on branch ${branch}
2. Run \`npm test\`
3. Observe test failures`,
    priority: 'HIGH',
    severity: 'MAJOR',
    projectId: config.projectId,
    reporterId: config.reporterId,
    source: 'CI',
  });
  
  const url = new URL(config.apiUrl);
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };
  
  return new Promise((resolve, reject) => {
    const req = (url.protocol === 'https:' ? https : http).request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedData = JSON.parse(responseData);
            resolve(parsedData);
          } catch (error) {
            resolve(responseData);
          }
        } else {
          reject(new Error(`Server responded with status code ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
};

// Main execution
(async () => {
  try {
    // Check if we have project and reporter IDs
    if (!config.projectId || !config.reporterId) {
      console.error('Missing required configuration: PROJECT_ID and/or REPORTER_ID');
      console.error('Please set these in your environment or package.json');
      process.exit(1);
    }
    
    console.log('Reporting test failures as bugs...');
    const result = await reportBug();
    console.log('Bug reported successfully:', result);
  } catch (error) {
    console.error('Failed to report bug:', error.message);
    process.exit(1);
  }
})(); 