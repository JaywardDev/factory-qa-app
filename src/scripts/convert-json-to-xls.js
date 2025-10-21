import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as XLSX from "xlsx";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const [,, providedInput, providedOutput] = process.argv;
const inputPathCandidates = providedInput
  ? [path.resolve(process.cwd(), providedInput)]
  : [
      path.resolve(process.cwd(), "converted.json"),
      path.join(scriptDir, "converted.json"),
    ];

const inputPath = inputPathCandidates.find((candidate) => fs.existsSync(candidate));

if (!inputPath) {
  const target = providedInput ?? "converted.json";
  console.error(`❌ Input file not found. Looked for ${target} relative to the current directory and alongside convert-json-to-xls.js.`);
  process.exit(1);
}

const outputPath = path.resolve(process.cwd(), providedOutput ?? "restored.xlsx");

const normalizeString = (value) => String(value ?? "").trim();
const normalizeKey = (value) => normalizeString(value).replace(/[^A-Za-z0-9]/g, "");

const loadJson = (filePath) => {
  const contents = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(contents);
  } catch (error) {
    console.error(`❌ Failed to parse JSON from ${filePath}`);
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

const data = loadJson(inputPath);

const projects = Array.isArray(data?.projects) ? data.projects : [];
const projectLookup = new Map(
  projects.map((project) => [normalizeKey(project.project_id), project])
);

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const deriveAccessGuid = (component, project) => {
  const fromComponent = normalizeString(component?.access_guid);
  if (fromComponent) {
    return fromComponent;
  }

  const projectCode = normalizeString(project?.project_code);

  let typePart = normalizeString(component?.type).toUpperCase();
  if (!typePart && component?.panel_id) {
    const [letters] = String(component.panel_id).split("_");
    typePart = normalizeString(letters).toUpperCase();
  }

  const panelIdDigitsMatch = String(component?.panel_id ?? "").match(/\d+/g);
  const panelDigits = panelIdDigitsMatch ? panelIdDigitsMatch.join("") : "";
  const idDigits = String(component?.id ?? "").replace(/\D/g, "");
  const groupDigitsMatch = String(component?.group_code ?? "").match(/\d+/);
  const groupDigits = groupDigitsMatch ? groupDigitsMatch[0] : "";

  const digitsPart = [panelDigits, idDigits, groupDigits].find((candidate) => candidate.length > 0) ?? "";

  const combined = `${projectCode}${typePart}${digitsPart}`.trim();
  return combined || undefined;
};

const components = ensureArray(data?.components);

const columns = [
  "PROJECT GUID",
  "GUID",
  "PROJECT CODE",
  "PROJECT NAME",
  "ACCESS_GUID",
  "WP GUID",
  "TEMPLATE",
  "PANEL ID",
  "GROUP CODE",
  "TITLE",
  "RESULT",
  "PHOTO TAKEN",
  "SIGNEE",
  "TIMESTAMP",
];

const rows = [];

components.forEach((component) => {
  const componentProject = projectLookup.get(normalizeKey(component.project_id));
  const accessGuid = deriveAccessGuid(component, componentProject);

  const qaItems = ensureArray(component?.qaItems);
  const items = qaItems.length > 0 ? qaItems : [{}];

  items.forEach((qaItem) => {
    rows.push({
      "PROJECT GUID": normalizeString(componentProject?.project_id ?? component?.project_id),
      GUID: normalizeString(componentProject?.project_id ?? component?.project_id),
      "PROJECT CODE": normalizeString(componentProject?.project_code),
      "PROJECT NAME": normalizeString(componentProject?.project_name),
      ACCESS_GUID: normalizeString(accessGuid),
      "WP GUID": normalizeString(accessGuid),
      TEMPLATE: normalizeString(component?.template_id),
      "PANEL ID": normalizeString(component?.panel_id),
      "GROUP CODE": normalizeString(component?.group_code),
      TITLE: normalizeString(qaItem?.title),
      RESULT: normalizeString(qaItem?.result),
      "PHOTO TAKEN": normalizeString(qaItem?.photoTaken),
      SIGNEE: normalizeString(qaItem?.signee),
      TIMESTAMP: normalizeString(qaItem?.timestamp),
    });
  });
});

if (rows.length === 0) {
  rows.push(Object.fromEntries(columns.map((column) => [column, ""])));
}

const worksheet = XLSX.utils.json_to_sheet(rows, { header: columns });
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
XLSX.writeFile(workbook, outputPath);

console.log(`✅ ${outputPath} created`);