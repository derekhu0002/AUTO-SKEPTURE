import { readFile } from "node:fs/promises";
const mode = process.argv[2];
if (mode !== "intent" && mode !== "implementation") {
    console.error("Usage: node scripts/validate-handoff.mjs <intent|implementation>");
    process.exit(1);
}
const schemaPath = mode === "intent"
    ? ".github/argoschema/IntentToImplementationHandoff.schema.json"
    : ".github/argoschema/ImplementationToCodingHandoff.schema.json";
const payloadPath = mode === "intent"
    ? "design/KG/IntentToImplementationHandoff.json"
    : "design/KG/ImplementationToCodingHandoff.json";
const schema = JSON.parse(await readFile(schemaPath, "utf8"));
const payload = JSON.parse(await readFile(payloadPath, "utf8"));
const errors = [];
validateRequired(schema.required ?? [], payload, "$", errors);
if (mode === "intent") {
    validateConst(payload.stage, "intent-to-implementation", "$.stage", errors);
    validateArray(payload.intentElementIds, "$.intentElementIds", errors, 1);
    validateArray(payload.explicitTestcases, "$.explicitTestcases", errors, 1);
    validateArray(payload.frozenBaselines, "$.frozenBaselines", errors, 1);
    validateArray(payload.requiredImplementationArtifacts, "$.requiredImplementationArtifacts", errors, 1);
}
else {
    validateConst(payload.stage, "implementation-to-coding", "$.stage", errors);
    validateArray(payload.implementationContracts, "$.implementationContracts", errors, 1);
    validateArray(payload.explicitEntrypoints, "$.explicitEntrypoints", errors, 1);
    validateArray(payload.codingTargets, "$.codingTargets", errors, 1);
    validateArray(payload.frozenFiles, "$.frozenFiles", errors, 1);
    validateString(payload.expectedFailureRecordsPath, "$.expectedFailureRecordsPath", errors);
    for (const [index, entry] of (payload.explicitEntrypoints ?? []).entries()) {
        validateRequired([
            "testcaseName",
            "entryPath",
            "controlPoint",
            "observationPoint",
            "initialExecutionStatus",
            "initialExecutionCommand",
        ], entry, `$.explicitEntrypoints[${index}]`, errors);
        if (!["passed", "failed"].includes(entry.initialExecutionStatus)) {
            errors.push(`$.explicitEntrypoints[${index}].initialExecutionStatus must be 'passed' or 'failed'.`);
        }
    }
}
if (errors.length > 0) {
    for (const error of errors) {
        console.error(error);
    }
    process.exit(1);
}
console.log(`${mode}-handoff-ok`);
function validateRequired(requiredKeys, payloadValue, path, errors) {
    for (const key of requiredKeys) {
        if (payloadValue[key] === undefined) {
            errors.push(`${path}.${key} is required.`);
        }
    }
}
function validateConst(value, expected, path, errors) {
    if (value !== expected) {
        errors.push(`${path} must equal '${expected}'.`);
    }
}
function validateArray(value, path, errors, minItems) {
    if (!Array.isArray(value)) {
        errors.push(`${path} must be an array.`);
        return;
    }
    if (value.length < minItems) {
        errors.push(`${path} must contain at least ${minItems} item(s).`);
    }
}
function validateString(value, path, errors) {
    if (typeof value !== "string" || value.length === 0) {
        errors.push(`${path} must be a non-empty string.`);
    }
}
