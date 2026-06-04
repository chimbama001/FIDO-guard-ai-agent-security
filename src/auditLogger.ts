import fs from "fs";
import path from "path";

type AuditLogEntry = {
  timestamp: string;
  eventType: string;
  actor: string;
  action: string;
  status: string;
  details?: Record<string, unknown>;
};

const auditLogPath = path.join(process.cwd(), "audit-log.json");

export function writeAuditLog(entry: Omit<AuditLogEntry, "timestamp">) {
  const logEntry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
  };

  let existingLogs: AuditLogEntry[] = [];

  if (fs.existsSync(auditLogPath)) {
    const fileContent = fs.readFileSync(auditLogPath, "utf-8");

    if (fileContent.trim().length > 0) {
      existingLogs = JSON.parse(fileContent);
    }
  }

  existingLogs.push(logEntry);

  fs.writeFileSync(auditLogPath, JSON.stringify(existingLogs, null, 2));

  console.log("Audit log written:", logEntry);
}