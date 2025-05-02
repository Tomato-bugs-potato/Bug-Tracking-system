# Bug Tracker GitHub CI Integration Templates

## 1. Add GitHub Secrets

Add these secrets to your GitHub repository:

```
BUG_TRACKER_API_KEY: <your-api-key-here>
BUG_TRACKER_PROJECT_ID: <your-project-id-here>
```

---

## 2. Choose Your Stack and Copy the Workflow File

### Node.js (Jest)

```yaml
name: Test and Bug Tracking

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test-and-report:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run tests and capture output
        id: run_tests
        continue-on-error: true
        run: |
          npm test > test_output.txt 2>&1
          echo "exit_code=$?" >> $GITHUB_ENV
          cat test_output.txt

      - name: Create bug in tracking system
        run: |
          TEST_OUTPUT=$(cat test_output.txt)
          FAILED_TESTS=$(grep -A 1 "FAIL" test_output.txt | grep -v "FAIL" | grep -v "\-\-" | sed 's/^[ \t]*//' | tr '\n' ',' | sed 's/,$//' || echo "Unknown test failure")
          FAILURE_COUNT=$(grep -c "FAIL" test_output.txt || echo "0")
          BUG_TITLE="URGENT: $FAILURE_COUNT Test Failures in ${{ github.repository }} ($(date '+%Y-%m-%d %H:%M:%S'))"
          ENCODED_OUTPUT=$(echo "$TEST_OUTPUT" | base64 -w 0)
          BUG_TRACKER_API="https://<your-bug-tracker-domain>/api/ci-report"
          curl -v -X POST "$BUG_TRACKER_API" \
            -H "Content-Type: application/json" \
            -H "Azure-DevTunnel-Bypass: 1" \
            -H "Authorization: Bearer ${{ secrets.BUG_TRACKER_API_KEY }}" \
            -d "{\n              \"projectId\": \"${{ secrets.BUG_TRACKER_PROJECT_ID }}\",\n              \"commit\": \"${{ github.sha }}\",\n              \"branch\": \"${{ github.ref_name }}\",\n              \"repository\": \"${{ github.repository }}\",\n              \"bugTitle\": \"$BUG_TITLE\",\n              \"testOutput\": \"$ENCODED_OUTPUT\",\n              \"failedTests\": \"$FAILED_TESTS\",\n              \"failureCount\": \"$FAILURE_COUNT\"\n            }" 2>&1 | grep -v "Authorization"
```

---

### Python (Pytest)

```yaml
name: Test and Bug Tracking

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test-and-report:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.10"

      - name: Install dependencies
        run: |
          if [ -f "requirements.txt" ]; then pip install -r requirements.txt; fi
          if [ -f "pyproject.toml" ]; then pip install .; fi

      - name: Run tests and capture output
        id: run_tests
        continue-on-error: true
        run: |
          pytest > test_output.txt 2>&1
          echo "exit_code=$?" >> $GITHUB_ENV
          cat test_output.txt

      - name: Create bug in tracking system
        run: |
          TEST_OUTPUT=$(cat test_output.txt)
          FAILED_TESTS=$(grep -A 1 "FAILED" test_output.txt | grep -v "FAILED" | grep -v "\-\-" | sed 's/^[ \t]*//' | tr '\n' ',' | sed 's/,$//' || echo "Unknown test failure")
          FAILURE_COUNT=$(grep -c "FAILED" test_output.txt || echo "0")
          BUG_TITLE="URGENT: $FAILURE_COUNT Test Failures in ${{ github.repository }} ($(date '+%Y-%m-%d %H:%M:%S'))"
          ENCODED_OUTPUT=$(echo "$TEST_OUTPUT" | base64 -w 0)
          BUG_TRACKER_API="https://<your-bug-tracker-domain>/api/ci-report"
          curl -v -X POST "$BUG_TRACKER_API" \
            -H "Content-Type: application/json" \
            -H "Azure-DevTunnel-Bypass: 1" \
            -H "Authorization: Bearer ${{ secrets.BUG_TRACKER_API_KEY }}" \
            -d "{\n              \"projectId\": \"${{ secrets.BUG_TRACKER_PROJECT_ID }}\",\n              \"commit\": \"${{ github.sha }}\",\n              \"branch\": \"${{ github.ref_name }}\",\n              \"repository\": \"${{ github.repository }}\",\n              \"bugTitle\": \"$BUG_TITLE\",\n              \"testOutput\": \"$ENCODED_OUTPUT\",\n              \"failedTests\": \"$FAILED_TESTS\",\n              \"failureCount\": \"$FAILURE_COUNT\"\n            }" 2>&1 | grep -v "Authorization"
```

---

### Node.js (Mocha)

```yaml
name: Test and Bug Tracking

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test-and-report:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run tests and capture output
        id: run_tests
        continue-on-error: true
        run: |
          npx mocha > test_output.txt 2>&1
          echo "exit_code=$?" >> $GITHUB_ENV
          cat test_output.txt

      - name: Create bug in tracking system
        run: |
          TEST_OUTPUT=$(cat test_output.txt)
          FAILED_TESTS=$(grep -A 1 "failing" test_output.txt | grep -v "failing" | grep -v "\-\-" | sed 's/^[ \t]*//' | tr '\n' ',' | sed 's/,$//' || echo "Unknown test failure")
          FAILURE_COUNT=$(grep -c "failing" test_output.txt || echo "0")
          BUG_TITLE="URGENT: $FAILURE_COUNT Test Failures in ${{ github.repository }} ($(date '+%Y-%m-%d %H:%M:%S'))"
          ENCODED_OUTPUT=$(echo "$TEST_OUTPUT" | base64 -w 0)
          BUG_TRACKER_API="https://<your-bug-tracker-domain>/api/ci-report"
          curl -v -X POST "$BUG_TRACKER_API" \
            -H "Content-Type: application/json" \
            -H "Azure-DevTunnel-Bypass: 1" \
            -H "Authorization: Bearer ${{ secrets.BUG_TRACKER_API_KEY }}" \
            -d "{\n              \"projectId\": \"${{ secrets.BUG_TRACKER_PROJECT_ID }}\",\n              \"commit\": \"${{ github.sha }}\",\n              \"branch\": \"${{ github.ref_name }}\",\n              \"repository\": \"${{ github.repository }}\",\n              \"bugTitle\": \"$BUG_TITLE\",\n              \"testOutput\": \"$ENCODED_OUTPUT\",\n              \"failedTests\": \"$FAILED_TESTS\",\n              \"failureCount\": \"$FAILURE_COUNT\"\n            }" 2>&1 | grep -v "Authorization"
```

---

## 3. Push to GitHub

Commit and push these changes to your repository. Now, when tests fail, bugs will automatically be created in this project.
