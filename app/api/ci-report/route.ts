import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Define interfaces for our test failures
interface TestFailure {
  testName: string;
  file: string | null;
  error: string;
  line: number | null;
  testType: string;
}

export async function POST(req: Request) {
  try {
    console.log("REQUEST RECIEVED", req.body);
    // Extract API key from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const apiKey = authHeader.substring(7); // Remove "Bearer " prefix

    // Validate request body
    const { projectId, commit, branch, repository, testOutput } =
      await req.json();
    if (!projectId || !testOutput) {
      return NextResponse.json(
        { error: "Missing required fields: projectId and testOutput" },
        { status: 400 }
      );
    }

    // Verify project exists
    // Note: We're temporarily skipping API key verification due to migration issues
    // In production, you would verify that the API key matches what's stored in the database
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Decode base64 test output
    const decodedOutput = Buffer.from(testOutput, "base64").toString();

    // Parse test failures from output
    const failures = parseTestOutput(decodedOutput, repository);

    if (!failures || failures.length === 0) {
      return NextResponse.json({ message: "No failures detected" });
    }

    console.log(`Detected ${failures.length} test failures`);

    // Get default reporter for automatically created bugs
    const reporterId = await getDefaultReporterId();
    if (!reporterId) {
      return NextResponse.json(
        { error: "No default reporter found" },
        { status: 500 }
      );
    }

    // Create bugs for each failure
    const createdBugs = [];
    for (const failure of failures) {
      // Generate GitHub links when repository info is available
      const fileUrl =
        repository && failure.file
          ? `https://github.com/${repository}/blob/${commit}/${failure.file}`
          : null;
      const commitUrl =
        repository && commit
          ? `https://github.com/${repository}/commit/${commit}`
          : null;

      const bug = await prisma.bug.create({
        data: {
          title: `Test Failure: ${failure.testName}`,
          description: `
## Test Failure Details

**Error Message:**
\`\`\`
${failure.error}
\`\`\`

**File:** ${failure.file || "Unknown"}${
            failure.line ? ` (line ${failure.line})` : ""
          }
${fileUrl ? `**View File:** [${failure.file}](${fileUrl})` : ""}

**Branch:** ${branch || "unknown"}
**Commit:** ${commit ? commit.substring(0, 7) : "unknown"}
${commitUrl ? `**View Commit:** [${commit.substring(0, 7)}](${commitUrl})` : ""}

This bug was automatically created from CI test failures.
          `,
          status: "OPEN",
          priority: failure.testType === "integration" ? "HIGH" : "MEDIUM",
          severity: failure.testType === "integration" ? "MAJOR" : "MINOR",
          project: { connect: { id: projectId } },
          source: "ci",
          reporter: {
            connect: {
              id: reporterId,
            },
          },
        },
        include: {
          project: {
            select: {
              name: true,
            },
          },
        },
      });

      createdBugs.push(bug);

      // Create activity record
      await prisma.activity.create({
        data: {
          action: "created this bug from CI test failure",
          bugId: bug.id,
          userId: reporterId,
        },
      });
    }

    return NextResponse.json({
      created: createdBugs.length,
      bugs: createdBugs.map((bug) => ({
        id: bug.id,
        title: bug.title,
        project: bug.project.name,
      })),
    });
  } catch (error) {
    console.error("Error processing CI report:", error);
    return NextResponse.json(
      { error: "Failed to process CI report", details: String(error) },
      { status: 500 }
    );
  }
}

// Helper function to get a default reporter ID (system user or admin)
async function getDefaultReporterId() {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
  });
  return admin?.id;
}

// Function to parse test output and extract failures
function parseTestOutput(output: string, repository?: string): TestFailure[] {
  const failures: TestFailure[] = [];

  // Detect test framework based on output format
  if (
    output.includes("FAIL ") &&
    (output.includes("npm test") || output.includes("jest"))
  ) {
    // Jest output parsing
    parseJestOutput(output, failures);
  } else if (output.includes("FAILED ") && output.includes("pytest")) {
    // pytest output parsing
    parsePytestOutput(output, failures);
  } else {
    // Generic output parsing - look for patterns like "Error:" or "FAIL"
    parseGenericOutput(output, failures);
  }

  return failures;
}

function parseJestOutput(output: string, failures: TestFailure[]) {
  // Example Jest failure pattern:
  // FAIL  src/components/__tests__/Login.test.js
  // ● Login › should handle login failure

  const lines = output.split("\n");
  let currentFile = null;
  let currentTest = null;
  let errorMessage: string[] = [];
  let collectingError = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("FAIL ")) {
      currentFile = line.replace("FAIL ", "").trim();
      collectingError = false;
    } else if (line.trim().startsWith("●")) {
      currentTest = line.trim().substring(1).trim();
      collectingError = true;
      errorMessage = [];
    } else if (collectingError && line.trim() !== "") {
      errorMessage.push(line);
    } else if (
      collectingError &&
      line.trim() === "" &&
      errorMessage.length > 0
    ) {
      // End of error message block
      failures.push({
        testName: currentTest || "Unknown Test",
        file: currentFile,
        error: errorMessage.join("\n"),
        line: extractLineNumber(errorMessage.join("\n")),
        testType: currentFile?.includes("integration") ? "integration" : "unit",
      });
      collectingError = false;
    }
  }
}

function parsePytestOutput(output: string, failures: TestFailure[]) {
  // Example pytest failure:
  // FAILED tests/test_auth.py::test_login - AssertionError: Expected status code 200, got 401

  const lines = output.split("\n");
  const failedLines = lines.filter((line) => line.includes("FAILED "));

  for (const failedLine of failedLines) {
    const parts = failedLine.split(" - ");
    if (parts.length >= 2) {
      const testInfo = parts[0].replace("FAILED ", "").trim();
      const errorMsg = parts[1].trim();

      const [file, testName] = testInfo.split("::");

      failures.push({
        testName: testName || "Unknown Test",
        file: file,
        error: errorMsg,
        line: null, // Would need to parse traceback to get line number
        testType: file?.includes("integration") ? "integration" : "unit",
      });
    }
  }
}

function parseGenericOutput(output: string, failures: TestFailure[]) {
  // Generic fallback - look for error patterns
  const lines = output.split("\n");

  for (let i = 0; i < lines.length; i++) {
    if (
      lines[i].includes("Error:") ||
      lines[i].includes("FAIL") ||
      lines[i].includes("Failure")
    ) {
      // Collect a few lines after the error for context
      const errorContext = lines
        .slice(i, Math.min(i + 10, lines.length))
        .join("\n");

      // Try to extract file info
      const fileMatch = errorContext.match(
        /([a-zA-Z0-9_\-/.]+\.(js|py|ts|jsx|tsx))/
      );
      const file = fileMatch ? fileMatch[0] : "Unknown file";

      // Try to extract test name
      const testNameMatch = errorContext.match(/test ([a-zA-Z0-9_]+)/i);
      const testName = testNameMatch ? testNameMatch[1] : "Unknown Test";

      failures.push({
        testName: testName,
        file: file,
        error: errorContext,
        line: extractLineNumber(errorContext),
        testType: "unknown",
      });

      // Skip ahead to avoid duplicate errors
      i += 5;
    }
  }
}

function extractLineNumber(errorText: string): number | null {
  // Try to extract line number from error text
  const lineMatch =
    errorText.match(/line (\d+)/i) || errorText.match(/:(\d+):/);
  return lineMatch ? parseInt(lineMatch[1]) : null;
}
