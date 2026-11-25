import { deflateRawSync, inflateRawSync } from "node:zlib";

export interface ZipEntryInput {
  name: string;
  data: Buffer;
}

export interface ParsedZipEntry {
  name: string;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number;
  data: Buffer;
}

export interface XlsxInspectionResult {
  valid: boolean;
  errorCode?:
    | "INVALID_MAGIC_BYTES"
    | "MALFORMED_ZIP"
    | "SUSPICIOUS_PATH"
    | "ZIP_BOMB"
    | "MACRO_ENABLED"
    | "NOT_XLSX_STRUCTURE"
    | "MISSING_SHEET";
  errorMessage?: string;
  sheetNames: string[];
  entries: string[];
}

const MAX_UNCOMPRESSED_BYTES = 50 * 1024 * 1024; // 50 MB safety cap against zip bombs
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Builds a standard ZIP archive buffer using DEFLATE (method 8).
 */
export function buildZipBuffer(entries: ZipEntryInput[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, "utf8");
    const crc = crc32(entry.data);
    const compressed = deflateRawSync(entry.data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // Local file header signature
    localHeader.writeUInt16LE(20, 4); // Version needed
    localHeader.writeUInt16LE(0, 6); // Flags
    localHeader.writeUInt16LE(8, 8); // Compression: DEFLATE
    localHeader.writeUInt16LE(0, 10); // Mod time
    localHeader.writeUInt16LE(0, 12); // Mod date
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(entry.data.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28); // Extra len

    localParts.push(localHeader, nameBuf, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0); // Central directory signature
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(entry.data.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // End of central directory
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDir, eocd]);
}

/**
 * Parses a ZIP buffer safely without executing any content.
 */
export function parseZipBuffer(buffer: Buffer): ParsedZipEntry[] {
  if (buffer.length < 22 || buffer.readUInt32LE(0) !== 0x04034b50) {
    throw new Error("INVALID_MAGIC_BYTES");
  }

  // Locate End of Central Directory (scan backwards from end)
  let eocdOffset = -1;
  const minOffset = Math.max(0, buffer.length - 65557);
  for (let i = buffer.length - 22; i >= minOffset; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error("MALFORMED_ZIP");
  }

  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirOffset = buffer.readUInt32LE(eocdOffset + 16);
  if (centralDirOffset >= eocdOffset) {
    throw new Error("MALFORMED_ZIP");
  }

  const entries: ParsedZipEntry[] = [];
  let cursor = centralDirOffset;
  let totalUncompressed = 0;

  for (let i = 0; i < totalEntries; i++) {
    if (cursor + 46 > eocdOffset || buffer.readUInt32LE(cursor) !== 0x02014b50) {
      throw new Error("MALFORMED_ZIP");
    }
    const compressionMethod = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const nameLen = buffer.readUInt16LE(cursor + 28);
    const extraLen = buffer.readUInt16LE(cursor + 30);
    const commentLen = buffer.readUInt16LE(cursor + 32);
    const localHeaderOffset = buffer.readUInt32LE(cursor + 42);

    if (cursor + 46 + nameLen > eocdOffset) {
      throw new Error("MALFORMED_ZIP");
    }
    const name = buffer.subarray(cursor + 46, cursor + 46 + nameLen).toString("utf8");
    if (name.includes("..") || name.startsWith("/") || name.startsWith("\\")) {
      throw new Error("SUSPICIOUS_PATH");
    }

    totalUncompressed += uncompressedSize;
    if (totalUncompressed > MAX_UNCOMPRESSED_BYTES) {
      throw new Error("ZIP_BOMB");
    }

    if (localHeaderOffset + 30 > centralDirOffset || buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
      throw new Error("MALFORMED_ZIP");
    }
    const localNameLen = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLen = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > centralDirOffset) {
      throw new Error("MALFORMED_ZIP");
    }

    const rawSlice = buffer.subarray(dataStart, dataEnd);
    let data: Buffer;
    if (compressionMethod === 0) {
      data = Buffer.from(rawSlice);
    } else if (compressionMethod === 8) {
      data = inflateRawSync(rawSlice);
    } else {
      throw new Error("MALFORMED_ZIP");
    }

    if (data.length > MAX_UNCOMPRESSED_BYTES) {
      throw new Error("ZIP_BOMB");
    }

    entries.push({
      name,
      compressedSize,
      uncompressedSize: data.length,
      compressionMethod,
      data
    });

    cursor += 46 + nameLen + extraLen + commentLen;
  }

  return entries;
}

/**
 * Validates XLSX magic bytes, ZIP integrity, macro-free policy, and required worksheet names.
 */
export function inspectXlsxBuffer(buffer: Buffer, requiredSheets: string[] = []): XlsxInspectionResult {
  if (buffer.length < 4 || buffer.readUInt32LE(0) !== 0x04034b50) {
    return {
      valid: false,
      errorCode: "INVALID_MAGIC_BYTES",
      errorMessage: "This file does not appear to be a valid .xlsx workbook (invalid file signature).",
      sheetNames: [],
      entries: []
    };
  }

  let parsedEntries: ParsedZipEntry[];
  try {
    parsedEntries = parseZipBuffer(buffer);
  } catch (err: unknown) {
    const code = err instanceof Error ? err.message : "MALFORMED_ZIP";
    if (code === "SUSPICIOUS_PATH") {
      return {
        valid: false,
        errorCode: "SUSPICIOUS_PATH",
        errorMessage: "The uploaded archive contains an unsafe file path and was rejected.",
        sheetNames: [],
        entries: []
      };
    }
    if (code === "ZIP_BOMB") {
      return {
        valid: false,
        errorCode: "ZIP_BOMB",
        errorMessage: "The uncompressed workbook size exceeds safe limits and was rejected.",
        sheetNames: [],
        entries: []
      };
    }
    return {
      valid: false,
      errorCode: "MALFORMED_ZIP",
      errorMessage: "The workbook archive is corrupted or malformed. Please re-save as .xlsx and try again.",
      sheetNames: [],
      entries: []
    };
  }

  const entryNames = parsedEntries.map((e) => e.name);
  const lowerNames = entryNames.map((n) => n.toLowerCase());

  // Reject macro-enabled workbooks (.xlsm or embedded vbaProject.bin)
  const hasVba = lowerNames.some((n) => n.includes("vbaproject.bin") || n.includes("vbadata.xml"));
  const contentTypesEntry = parsedEntries.find((e) => e.name === "[Content_Types].xml");
  const contentTypesText = contentTypesEntry?.data.toString("utf8") ?? "";
  if (hasVba || contentTypesText.includes("macroEnabled")) {
    return {
      valid: false,
      errorCode: "MACRO_ENABLED",
      errorMessage: "Macro-enabled workbooks (.xlsm or files with VBA macros) are not allowed. Please save as a standard .xlsx file.",
      sheetNames: [],
      entries: entryNames
    };
  }

  const workbookEntry = parsedEntries.find((e) => e.name === "xl/workbook.xml");
  if (!contentTypesEntry || !workbookEntry) {
    return {
      valid: false,
      errorCode: "NOT_XLSX_STRUCTURE",
      errorMessage: "The file is a ZIP archive, but it is missing required Excel workbook structure (xl/workbook.xml).",
      sheetNames: [],
      entries: entryNames
    };
  }

  const workbookXml = workbookEntry.data.toString("utf8");
  const sheetNames: string[] = [];
  const sheetRegex = /<sheet\b[^>]*\bname="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = sheetRegex.exec(workbookXml)) !== null) {
    sheetNames.push(match[1]);
  }

  for (const required of requiredSheets) {
    if (!sheetNames.includes(required)) {
      return {
        valid: false,
        errorCode: "MISSING_SHEET",
        errorMessage: `Required worksheet "${required}" is missing from the workbook. Found sheets: ${sheetNames.join(", ") || "none"}.`,
        sheetNames,
        entries: entryNames
      };
    }
  }

  return {
    valid: true,
    sheetNames,
    entries: entryNames
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function colLetter(index: number): string {
  let n = index;
  let result = "";
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

export type CellInput = string | number | { formula: string; value?: number };

export interface SheetInput {
  name: string;
  rows: CellInput[][];
}

function buildWorksheetXml(rows: CellInput[][]): string {
  const rowXml = rows
    .map((row, rIdx) => {
      const rowNum = rIdx + 1;
      const cellsXml = row
        .map((cell, cIdx) => {
          const ref = `${colLetter(cIdx)}${rowNum}`;
          if (typeof cell === "number") {
            return `<c r="${ref}"><v>${cell}</v></c>`;
          }
          if (typeof cell === "object" && cell !== null && "formula" in cell) {
            const formula = cell.formula.startsWith("=") ? cell.formula.slice(1) : cell.formula;
            const valPart = typeof cell.value === "number" ? `<v>${cell.value}</v>` : "";
            return `<c r="${ref}"><f>${escapeXml(formula)}</f>${valPart}</c>`;
          }
          return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(String(cell ?? ""))}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowNum}">${cellsXml}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${rowXml}</sheetData>
</worksheet>`;
}

/**
 * Generates a valid, macro-free .xlsx buffer from sheet definitions.
 */
export function buildXlsxBuffer(sheets: SheetInput[]): Buffer {
  const sheetOverrides = sheets
    .map(
      (_s, idx) =>
        `<Override PartName="/xl/worksheets/sheet${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    )
    .join("");

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${sheetOverrides}
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const sheetNodes = sheets
    .map((s, idx) => `<sheet name="${escapeXml(s.name)}" sheetId="${idx + 1}" r:id="rId${idx + 1}"/>`)
    .join("");

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheetNodes}</sheets>
</workbook>`;

  const workbookRels = sheets
    .map(
      (_s, idx) =>
        `<Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx + 1}.xml"/>`
    )
    .join("");

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${workbookRels}
</Relationships>`;

  const entries: ZipEntryInput[] = [
    { name: "[Content_Types].xml", data: Buffer.from(contentTypesXml, "utf8") },
    { name: "_rels/.rels", data: Buffer.from(rootRelsXml, "utf8") },
    { name: "xl/workbook.xml", data: Buffer.from(workbookXml, "utf8") },
    { name: "xl/_rels/workbook.xml.rels", data: Buffer.from(workbookRelsXml, "utf8") },
    ...sheets.map((s, idx) => ({
      name: `xl/worksheets/sheet${idx + 1}.xml`,
      data: Buffer.from(buildWorksheetXml(s.rows), "utf8")
    }))
  ];

  return buildZipBuffer(entries);
}
