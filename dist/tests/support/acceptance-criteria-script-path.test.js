import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
const ALLOWED_EXTENSIONS = new Set([".js", ".cjs", ".mjs", ".py", ".ps1", ".cmd", ".bat"]);
test("support guardrail: explicit testcase acceptanceCriteria point to executable scripts", async () => {
    const controlPoint = "Read explicit testcase acceptanceCriteria values from design/KG/SystemArchitecture.json.";
    const observationPoint = "Each explicit testcase points to an existing single executable script file accepted by the failure-record consumer.";
    const graphPath = new URL("../../design/KG/SystemArchitecture.json", import.meta.url);
    const raw = await readFile(graphPath, "utf8");
    const graph = JSON.parse(raw);
    const embodiedInteraction = graph.elements?.find((element) => element.id === "1300");
    assert.ok(embodiedInteraction, `Control point: ${controlPoint}`);
    for (const testcase of embodiedInteraction.testcases ?? []) {
        const scriptPath = testcase.acceptanceCriteria ?? "";
        assert.ok(ALLOWED_EXTENSIONS.has(extname(scriptPath)), `Observation point: ${observationPoint}`);
        await access(resolve(scriptPath));
    }
});
