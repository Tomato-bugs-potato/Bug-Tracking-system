# Bug Tracker CI Integration

This guide explains how to integrate your GitHub project with the Bug Tracker to automatically create bugs from failing tests.

## How It Works

1. When tests fail in your GitHub Actions workflow, the test output is captured
2. The failing test information is sent to the Bug Tracker API
3. Bugs are automatically created in your project with details about the failing tests

## Setup Instructions

### 1. Create a Project in Bug Tracker

1. Create a new project in your Bug Tracker
2. Copy the Project ID from the project settings page

### 2. Configure GitHub Repository

Add the following secrets to your GitHub repository:

- `BUG_TRACKER_URL`: URL of your Bug Tracker instance (e.g., `https://your-bug-tracker.com`)
- `BUG_TRACKER_API_KEY`: Your API key for authentication
- `BUG_TRACKER_PROJECT_ID`: Project ID you copied in step 1

### 3. Add Workflow File

Add the `.github/workflows/bug-tracker.yml` file to your repository. This file is already configured to:

- Run your tests
- Capture the test output
- Send failing test information to the Bug Tracker API

### 4. Verify Integration

1. Push a commit with a failing test
2. Check your project in Bug Tracker to see if a bug was automatically created
3. Verify that the bug contains the relevant test failure information

## Customization

The CI integration can parse output from several test frameworks:

- Jest (JavaScript/TypeScript)
- pytest (Python)
- Generic test outputs with error patterns

If you need to support additional test frameworks, modify the parsing logic in the API route.

## Troubleshooting

If bugs are not being created:

1. Check GitHub Actions logs for any errors
2. Verify that your API key and project ID are correct
3. Make sure your tests are actually failing (the workflow only reports when tests fail)
