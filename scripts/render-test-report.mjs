import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const reportsDir = path.join(process.cwd(), "reports");
const jsonPath = path.join(reportsDir, "vitest-results.json");
const markdownPath = path.join(reportsDir, "test-results.md");

const statusIcon = (status) => {
  if (status === "passed") return "PASS";
  if (status === "failed") return "FAIL";
  if (status === "skipped" || status === "pending" || status === "todo") return "SKIP";
  return status.toUpperCase();
};

const escapeCell = (value) => value.replace(/\|/g, "\\|").replace(/\n/g, " ");
const toDisplayPath = (filePath) => path.relative(process.cwd(), filePath) || filePath;

const render = (results) => {
  const passed = results.numPassedTests ?? 0;
  const failed = results.numFailedTests ?? 0;
  const skipped = (results.numPendingTests ?? 0) + (results.numTodoTests ?? 0);
  const total = results.numTotalTests ?? passed + failed + skipped;
  const passPercent = total === 0 ? 0 : Math.round((passed / total) * 100);

  const lines = [
    "# Test Results",
    "",
    `Status: ${results.success === false ? "FAIL" : "PASS"}`,
    "",
    "```mermaid",
    "pie showData",
    `  "Passed" : ${passed}`,
    `  "Failed" : ${failed}`,
    `  "Skipped/Todo" : ${skipped}`,
    "```",
    "",
    "| Metric | Count |",
    "| --- | ---: |",
    `| Total | ${total} |`,
    `| Passed | ${passed} |`,
    `| Failed | ${failed} |`,
    `| Skipped/Todo | ${skipped} |`,
    `| Pass rate | ${passPercent}% |`,
    "",
    "| File | Test | Result | Duration |",
    "| --- | --- | --- | ---: |"
  ];

  for (const file of results.testResults ?? []) {
    for (const test of file.assertionResults ?? []) {
      const name = test.fullName ?? [...(test.ancestorTitles ?? []), test.title ?? "Unnamed test"].join(" ");
      const duration = typeof test.duration === "number" ? `${test.duration} ms` : "";

      lines.push(
        `| ${escapeCell(toDisplayPath(file.name))} | ${escapeCell(name)} | ${statusIcon(test.status)} | ${duration} |`
      );
    }
  }

  return `${lines.join("\n")}\n`;
};

await mkdir(reportsDir, { recursive: true });

const report = JSON.parse(await readFile(jsonPath, "utf8"));
await writeFile(markdownPath, render(report));

console.log(`Wrote ${path.relative(process.cwd(), markdownPath)}`);
