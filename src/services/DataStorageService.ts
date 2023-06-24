import BetterSqlite3 from "better-sqlite3";
import { app } from "electron";
import fs from "fs";
import { rm } from "node:fs/promises";
import path from "path";

class DataStorageService {
  private db: BetterSqlite3.Database;

  constructor(dbFileName: string) {
    this.db = new BetterSqlite3(dbFileName);
  }

  getDatabase(): BetterSqlite3.Database {
    return this.db;
  }

  createTables() {
    console.log("Creating Database");

    const collegeExec = this.db.prepare(`
    CREATE TABLE IF NOT EXISTS Colleges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      abbreviation TEXT NOT NULL,
      logo TEXT NOT NULL
    )`);

    const courseExec = this.db.prepare(`
    CREATE TABLE IF NOT EXISTS Courses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      abbreviation TEXT NOT NULL,
      description TEXT NOT NULL,
      collegeId TEXT NOT NULL,
      FOREIGN KEY (collegeId) REFERENCES Colleges(id)
    )`);

    const studentExec = this.db.prepare(`
    CREATE TABLE IF NOT EXISTS Students (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')) NOT NULL,
      birthday TEXT NOT NULL,
      photo TEXT NOT NULL,
      collegeId TEXT NOT NULL,
      courseId TEXT NOT NULL,
      year TEXT NOT NULL,
      FOREIGN KEY (collegeId) REFERENCES Colleges(id),
      FOREIGN KEY (courseId) REFERENCES Courses(id)
    )`);

    this.db.transaction(() => {
      collegeExec.run();
      courseExec.run();
      studentExec.run();
    })();

    console.log("Finished creating Database");
  }

  createStorageDirectory() {
    console.log("Creating storage directory");

    const storageDirectory = path.join(app.getPath("userData"), "storage");

    console.log(`Storage directory: ${storageDirectory}`);

    if (!fs.existsSync(storageDirectory)) {
      fs.mkdirSync(storageDirectory);
    }

    console.log("Finished creating storage directory");
  }

  createSubDirectoryStorage(subDirectory: string) {
    console.log(`Creating subdirectory ${subDirectory}`);

    const storageDirectory = path.join(app.getPath("userData"), "storage");

    const subDirectoryPath = path.join(storageDirectory, subDirectory);

    if (!fs.existsSync(subDirectoryPath)) {
      fs.mkdirSync(subDirectoryPath);
    }

    console.log(`Finished creating subdirectory ${subDirectory}`);
  }

  async deleteSubDirectoryStorage(subDirectory: string) {
    console.log(`Deleting subdirectory ${subDirectory}`);

    const storageDirectory = path.join(app.getPath("userData"), "storage");
    const subDirectoryPath = path.join(storageDirectory, subDirectory);

    if (fs.existsSync(subDirectoryPath)) {
      await rm(subDirectoryPath, { recursive: true });
    }

    console.log(`Finished deleting subdirectory ${subDirectory}`);
  }
}

export { DataStorageService };
