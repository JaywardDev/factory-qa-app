import fs from "fs";
import { randomUUID } from "crypto";
import * as XLSX from "xlsx";

const [,, inputPath = "datasamplev2.xlsx", outputPath = "converted.json"] = process.argv;

const workbook = XLSX.readFile(inputPath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(worksheet);

const data = {
  projects: [],
  components: [],
  qa_forms: [],
  qa_items: [],
  qa_sessions: [],
};

rows.forEach((row) => {
  const rowData = row ?? {};
  const wp = String(rowData.WP_GUID ?? "");
  const match = wp.match(/^(?:(\d+))?([A-Za-z]+)_?(\d+)$/) ?? [];
  const projectCode = match[1] ?? "";
  const letters = match[2] ?? "";
  const digits = match[3] ?? "";

  const guid = String(rowData.GUID ?? randomUUID());
  const lettersUpper = letters.toUpperCase();
  const hasDigits = digits.length > 0;
  const groupCodeParts = [];
  if (lettersUpper) groupCodeParts.push(lettersUpper);
  if (hasDigits) groupCodeParts.push(digits[0]);
  const groupCode = groupCodeParts.join("_");
  const id = hasDigits ? digits.slice(-3).padStart(3, "0") : "";
  const panelDigits = hasDigits ? digits.padStart(4, "0") : "";
  const panelIdParts = [];
  if (lettersUpper) panelIdParts.push(lettersUpper);
  if (panelDigits) panelIdParts.push(panelDigits);
  const panelId = panelIdParts.join("_");
  const type = letters.toLowerCase();

  if (!data.projects.find((project) => project.project_id === guid)) {
    data.projects.push({
      project_id: guid,
      project_code: projectCode,
      project_name: rowData["PROJECT NAME"] ?? "",
      status: "active",
    });
  }

  let component = data.components.find((existing) => existing.panel_id === panelId);
  if (!component) {
    component = {
      type,
      project_id: guid,
      group_code: groupCode,
      id,
      panel_id: panelId,
      template_id: rowData.TEMPLATE ?? "",
      qaItems: [],
    };
    data.components.push(component);
  }

  component.qaItems.push({
    title: rowData.TITLE ?? "",
    result: "",
    photoTaken: "",
    signee: "",
    timestamp: "",
  });
});

fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
console.log(`✅ ${outputPath} created`);