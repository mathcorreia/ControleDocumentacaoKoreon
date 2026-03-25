import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

export const SystemManager = {
  async log(type: string, description: string, user?: string, data?: any) {
    try {
      await prisma.systemLog.create({
        data: {
          type,
          description,
          user: user || "System",
          data: data ? JSON.stringify(data) : null,
        },
      });
    } catch (error) {
      console.error("Failed to create system log:", error);
    }
  },

  async checkUpdates() {
    const currentVersion = "1.0.1";
    const update = await prisma.systemUpdate.findUnique({
      where: { version: currentVersion }
    });

    if (!update) {
      console.log(`Applying system update to version ${currentVersion}...`);
      await prisma.systemUpdate.create({
        data: {
          version: currentVersion,
          description: "Initial system setup with logging and versioning.",
        }
      });
      await this.log("audit", `System updated to version ${currentVersion}`, "System");
    }
  },

  async createBackup() {
    const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
    const backupDir = path.resolve(process.cwd(), "backups");
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(backupDir, `backup-${timestamp}.db`);

    try {
      fs.copyFileSync(dbPath, backupPath);
      await this.log("info", `Backup created successfully: ${backupPath}`, "System");
      return backupPath;
    } catch (error) {
      await this.log("error", `Backup failed: ${error}`, "System");
      throw error;
    }
  }
};
