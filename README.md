# BugTracker

A comprehensive bug tracking system built with Next.js, Prisma, and PostgreSQL.

## Features

- User authentication and authorization
- Project management
- Bug tracking with detailed information
- Comments and activity tracking
- File attachments
- Reporting and analytics
- Responsive UI for all devices
- Automated bug creation from CI test failures

## Local Development Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL installed locally

### Setup Steps

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/bug-tracker.git
   cd bug-tracker
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables:

   - Copy `.env.local.example` to `.env.local`
   - Update the PostgreSQL connection string to match your local setup

4. Set up the database:
   \`\`\`bash

   # Make the setup script executable

   chmod +x setup-local-db.sh

   # Run the setup script

   ./setup-local-db.sh
   \`\`\`

5. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Login Credentials

- Admin User:

  - Email: admin@example.com
  - Password: admin123

- Regular User:
  - Email: alice@example.com
  - Password: user123

## CI Integration for Automated Bug Creation

BugTracker can automatically create bugs from test failures in your CI pipeline. This feature helps teams catch and track issues without manual intervention.

### Setup Process

1. **Create a Project in BugTracker**

   - Log into BugTracker and create a new project
   - Add your GitHub repository URL and target branch
   - Save the project to generate a unique API key

2. **Configure GitHub Repository**

   - Add two secrets in your GitHub repository:
     - `BUG_TRACKER_API_KEY`: The API key from your BugTracker project
     - `BUG_TRACKER_PROJECT_ID`: Your project's ID from BugTracker

3. **Add GitHub Workflow File**

   - Create a file at `.github/workflows/bug-tracker.yml` with the following content:

   ```yaml
   name: Bug Tracker Integration

   on: [push, pull_request]

   jobs:
     test-and-report:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3

         # Setup environment based on project type
         - name: Setup Node.js
           uses: actions/setup-node@v3
           if: hashFiles('package.json') != ''
           with:
             node-version: "16"

         - name: Setup Python
           uses: actions/setup-python@v4
           if: hashFiles('requirements.txt') != '' || hashFiles('pyproject.toml') != ''
           with:
             python-version: "3.10"

         # Install dependencies
         - name: Install dependencies
           run: |
             if [ -f "package.json" ]; then
               npm install
             elif [ -f "requirements.txt" ]; then
               pip install -r requirements.txt
             elif [ -f "pyproject.toml" ]; then
               pip install -e .
             fi

         # Run tests and capture output
         - name: Run tests
           id: run-tests
           continue-on-error: true
           run: |
             if [ -f "package.json" ]; then
               npm test 2>&1 | tee test-output.txt
             elif [ -f "pytest.ini" ] || [ -d "tests" ]; then
               python -m pytest -v 2>&1 | tee test-output.txt
             else
               echo "No recognized test framework found"
               exit 1
             fi

         # Report test failures if tests failed
         - name: Report test failures
           if: steps.run-tests.outcome == 'failure'
           run: |
             cat test-output.txt | base64 > encoded-output.txt
             curl -X POST \
               -H "Content-Type: application/json" \
               -H "Authorization: Bearer ${{ secrets.BUG_TRACKER_API_KEY }}" \
               -d "{\"projectId\": \"${{ secrets.BUG_TRACKER_PROJECT_ID }}\", \"commit\": \"${{ github.sha }}\", \"branch\": \"${{ github.ref_name }}\", \"repository\": \"${{ github.repository }}\", \"testOutput\": \"$(cat encoded-output.txt)\"}" \
               https://your-bug-tracker-domain.com/api/ci-report
   ```

4. **That's it!** Now when tests fail in your CI pipeline, bugs will be automatically created in BugTracker with detailed information about the failure.

### How It Works

1. When a developer pushes code or creates a pull request, GitHub Actions runs the tests
2. If any tests fail, the workflow captures the test output and sends it to BugTracker's API
3. BugTracker creates a new bug with:
   - Test name as the bug title
   - Detailed error message and stack trace
   - Links to the specific file and commit that caused the failure
   - Appropriate severity and priority based on the test type
4. The bug is automatically linked to your project and can be assigned and tracked like any manually created bug

## Project Structure

- `/app` - Next.js App Router pages and API routes
- `/components` - Reusable UI components
- `/lib` - Utility functions and shared code
- `/prisma` - Prisma schema and migrations
- `/hooks` - Custom React hooks

## Technologies Used

- Next.js 14 (App Router)
- Prisma ORM
- PostgreSQL
- Tailwind CSS
- shadcn/ui components
- TypeScript
- bcrypt for password hashing
- JWT for authentication
