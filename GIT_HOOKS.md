# Git Hooks and Automated Bug Reporting

This project includes a Git hook system that automatically runs tests before pushing code to the repository. If tests fail, it can automatically report bugs to the bug tracking system.

## Setup

1. Install the Git hooks by running:

   ```bash
   npm run install-hooks
   ```

2. Configure your bug tracker settings in one of these ways:
   - Edit the `bugTracker` section in `package.json`
   - Set environment variables:
     ```bash
     export PROJECT_ID=your-project-id
     export REPORTER_ID=your-user-id
     ```

## How It Works

### Pre-Push Hook

The pre-push hook:

1. Runs automatically when you execute `git push`
2. Runs all tests in the project
3. If the tests pass, allows the push to proceed
4. If the tests fail:
   - Captures test output
   - Reports a bug to the tracker with details about the failure
   - Asks if you still want to push (useful for WIP changes)

### Bug Reports

The automatically generated bug reports include:

- Failing test details
- Commit hash and message
- Branch name
- Test output
- Steps to reproduce

Bugs created this way are tagged with `source: 'CI'` to help identify them in the bug tracker.

## Customization

You can customize the behavior by:

1. Editing the scripts in the `scripts/` directory:

   - `install-git-hooks.js` - Installs the Git hooks
   - `report-bug.js` - Handles reporting bugs to the tracking system

2. Modifying the pre-push hook script in `scripts/install-git-hooks.js`

## For Continuous Integration

For CI environments, set the necessary environment variables:

```bash
BUG_API_URL=https://your-api-url.com/api/bugs
PROJECT_ID=your-project-id
REPORTER_ID=your-system-user-id
```

## Troubleshooting

If you encounter issues:

1. Make sure the hooks are executable:

   ```bash
   chmod +x .git/hooks/pre-push
   ```

2. Check that the API URL is correct and the server is running
3. Confirm the project ID and reporter ID are valid
4. Review the console output for any error messages
