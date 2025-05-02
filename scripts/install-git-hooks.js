const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to git hooks
const gitHooksDir = path.join(__dirname, '..', '.git', 'hooks');
const preCommitHookPath = path.join(gitHooksDir, 'pre-push');

// Create the pre-push hook script
const prePushScript = `#!/bin/sh
# Pre-push hook to run tests before pushing

# Get the current branch name
branch="$(git symbolic-ref --short HEAD)"

echo "Running tests before pushing to $branch..."

# Run tests and capture output (adjust the npm test command as needed)
npm test

# Save the exit code 
exit_code=$?

if [ $exit_code -ne 0 ]; then
  echo "Tests failed! Reporting bug to the tracking system..."
  
  # Get the last commit message and hash
  commit_hash=$(git rev-parse HEAD)
  commit_msg=$(git log -1 --pretty=%B)
  
  # Report the bug using the report-bug script
  node scripts/report-bug.js "$commit_hash" "$commit_msg" "$branch"
  
  # Ask the user if they want to proceed with the push despite test failures
  exec < /dev/tty
  echo "Tests failed. Do you want to push anyway? (y/n)"
  read answer
  if [ "$answer" != "y" ]; then
    echo "Push aborted."
    exit 1
  fi
  echo "Proceeding with push despite test failures."
  exec <&-
fi

exit 0
`;

// Ensure the hooks directory exists
if (!fs.existsSync(gitHooksDir)) {
  fs.mkdirSync(gitHooksDir, { recursive: true });
}

// Write the pre-push hook file
fs.writeFileSync(preCommitHookPath, prePushScript);

// Make the hook executable
try {
  execSync(`chmod +x ${preCommitHookPath}`);
  console.log('Git pre-push hook installed successfully.');
} catch (error) {
  console.log('Failed to make the pre-push hook executable. Please run: chmod +x .git/hooks/pre-push');
}

// Log instructions
console.log('\nPre-push hook will run tests before each push and report any failures to the bug tracking system.');
console.log('To install the hooks, run:');
console.log('node scripts/install-git-hooks.js\n'); 