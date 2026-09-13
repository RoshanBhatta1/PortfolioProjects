import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { FLOORING_CLOSEOUT_TEMPLATE } from "./checklist-template";

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "closeout.db");

declare global {
  // eslint-disable-next-line no-var
  var __closeoutDb: Database.Database | undefined;
}

function initDb(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      public_token TEXT UNIQUE NOT NULL,
      client_name TEXT NOT NULL,
      client_email TEXT,
      project_address TEXT,
      flooring_types TEXT,
      contract_value REAL,
      start_date TEXT,
      completion_date TEXT,
      warranty_years INTEGER DEFAULT 1,
      contractor_name TEXT,
      contractor_contact TEXT,
      status TEXT DEFAULT 'in_progress',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS checklist_items (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      label TEXT NOT NULL,
      category TEXT NOT NULL,
      required INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'pending',
      file_path TEXT,
      file_name TEXT,
      notes TEXT,
      ai_assist INTEGER NOT NULL DEFAULT 0,
      draft_type TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      manufacturer TEXT NOT NULL,
      product_line TEXT,
      colour_style TEXT,
      room TEXT,
      search_status TEXT NOT NULL DEFAULT 'not_searched',
      search_notes TEXT,
      warranty_url TEXT,
      warranty_title TEXT,
      warranty_file_path TEXT,
      maintenance_url TEXT,
      maintenance_title TEXT,
      maintenance_file_path TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_drafts (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      draft_type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_checklist_project ON checklist_items(project_id);
    CREATE INDEX IF NOT EXISTS idx_products_project ON products(project_id);
    CREATE INDEX IF NOT EXISTS idx_drafts_project ON ai_drafts(project_id);
    CREATE INDEX IF NOT EXISTS idx_activity_project ON activity_log(project_id);
  `);

  return db;
}

export function getDb(): Database.Database {
  if (!global.__closeoutDb) {
    global.__closeoutDb = initDb();
  }
  return global.__closeoutDb;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export interface NewProjectInput {
  clientName: string;
  clientEmail?: string;
  projectAddress?: string;
  flooringTypes?: string;
  contractValue?: number;
  startDate?: string;
  completionDate?: string;
  warrantyYears?: number;
  contractorName?: string;
  contractorContact?: string;
}

export function createProject(input: NewProjectInput) {
  const db = getDb();
  const id = crypto.randomUUID();
  const publicToken = crypto.randomBytes(12).toString("hex");
  const ts = nowIso();

  db.prepare(
    `INSERT INTO projects
      (id, public_token, client_name, client_email, project_address, flooring_types,
       contract_value, start_date, completion_date, warranty_years,
       contractor_name, contractor_contact, status, created_at, updated_at)
     VALUES (@id, @publicToken, @clientName, @clientEmail, @projectAddress, @flooringTypes,
       @contractValue, @startDate, @completionDate, @warrantyYears,
       @contractorName, @contractorContact, 'in_progress', @ts, @ts)`
  ).run({
    id,
    publicToken,
    clientName: input.clientName,
    clientEmail: input.clientEmail ?? null,
    projectAddress: input.projectAddress ?? null,
    flooringTypes: input.flooringTypes ?? null,
    contractValue: input.contractValue ?? null,
    startDate: input.startDate ?? null,
    completionDate: input.completionDate ?? null,
    warrantyYears: input.warrantyYears ?? 1,
    contractorName: input.contractorName ?? null,
    contractorContact: input.contractorContact ?? null,
    ts,
  });

  const insertItem = db.prepare(
    `INSERT INTO checklist_items
      (id, project_id, key, label, category, required, status, ai_assist, draft_type, sort_order, updated_at)
     VALUES (@id, @projectId, @key, @label, @category, @required, 'pending', @aiAssist, @draftType, @sortOrder, @ts)`
  );

  FLOORING_CLOSEOUT_TEMPLATE.forEach((item, idx) => {
    insertItem.run({
      id: crypto.randomUUID(),
      projectId: id,
      key: item.key,
      label: item.label,
      category: item.category,
      required: item.required ? 1 : 0,
      aiAssist: item.aiAssist ? 1 : 0,
      draftType: item.draftType ?? null,
      sortOrder: idx,
      ts,
    });
  });

  addActivity(id, "Project created and closeout checklist initialized.");

  return getProjectById(id);
}

export function listProjects() {
  const db = getDb();
  const projects = db
    .prepare(`SELECT * FROM projects ORDER BY created_at DESC`)
    .all() as any[];

  const progressStmt = db.prepare(
    `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'verified' OR status = 'waived' THEN 1 ELSE 0 END) AS done
     FROM checklist_items WHERE project_id = ?`
  );

  return projects.map((p) => {
    const progress = progressStmt.get(p.id) as { total: number; done: number };
    return {
      ...p,
      progress: {
        total: progress.total,
        done: progress.done,
        percent: progress.total ? Math.round((progress.done / progress.total) * 100) : 0,
      },
    };
  });
}

export function getProjectById(id: string) {
  const db = getDb();
  const project = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id) as any;
  if (!project) return null;
  return attachRelations(project);
}

export function getProjectByToken(token: string) {
  const db = getDb();
  const project = db
    .prepare(`SELECT * FROM projects WHERE public_token = ?`)
    .get(token) as any;
  if (!project) return null;
  return attachRelations(project);
}

function attachRelations(project: any) {
  const db = getDb();
  const items = db
    .prepare(`SELECT * FROM checklist_items WHERE project_id = ? ORDER BY sort_order ASC`)
    .all(project.id);
  const products = db
    .prepare(`SELECT * FROM products WHERE project_id = ? ORDER BY created_at ASC`)
    .all(project.id);
  const drafts = db
    .prepare(`SELECT * FROM ai_drafts WHERE project_id = ? ORDER BY created_at DESC`)
    .all(project.id);
  const activity = db
    .prepare(`SELECT * FROM activity_log WHERE project_id = ? ORDER BY created_at DESC LIMIT 50`)
    .all(project.id);

  const total = items.length;
  const done = items.filter((i: any) => i.status === "verified" || i.status === "waived").length;

  return {
    ...project,
    checklist: items,
    products,
    drafts,
    activity,
    progress: { total, done, percent: total ? Math.round((done / total) * 100) : 0 },
  };
}

export interface NewProductInput {
  projectId: string;
  manufacturer: string;
  productLine?: string;
  colourStyle?: string;
  room?: string;
}

export function createProduct(input: NewProductInput) {
  const db = getDb();
  const id = crypto.randomUUID();
  const ts = nowIso();
  db.prepare(
    `INSERT INTO products (id, project_id, manufacturer, product_line, colour_style, room, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.projectId,
    input.manufacturer,
    input.productLine ?? null,
    input.colourStyle ?? null,
    input.room ?? null,
    ts,
    ts
  );
  addActivity(input.projectId, `Product added: ${input.manufacturer} ${input.productLine ?? ""}`.trim());
  return getProductById(id);
}

export function getProductById(id: string) {
  return getDb().prepare(`SELECT * FROM products WHERE id = ?`).get(id) as any;
}

export function updateProduct(
  id: string,
  updates: Partial<{
    manufacturer: string;
    productLine: string;
    colourStyle: string;
    room: string;
    searchStatus: string;
    searchNotes: string;
    warrantyUrl: string | null;
    warrantyTitle: string | null;
    warrantyFilePath: string | null;
    maintenanceUrl: string | null;
    maintenanceTitle: string | null;
    maintenanceFilePath: string | null;
  }>
) {
  const db = getDb();
  const current = getProductById(id);
  if (!current) return null;

  const merged = {
    manufacturer: updates.manufacturer ?? current.manufacturer,
    productLine: updates.productLine ?? current.product_line,
    colourStyle: updates.colourStyle ?? current.colour_style,
    room: updates.room ?? current.room,
    searchStatus: updates.searchStatus ?? current.search_status,
    searchNotes: updates.searchNotes !== undefined ? updates.searchNotes : current.search_notes,
    warrantyUrl: updates.warrantyUrl !== undefined ? updates.warrantyUrl : current.warranty_url,
    warrantyTitle: updates.warrantyTitle !== undefined ? updates.warrantyTitle : current.warranty_title,
    warrantyFilePath:
      updates.warrantyFilePath !== undefined ? updates.warrantyFilePath : current.warranty_file_path,
    maintenanceUrl: updates.maintenanceUrl !== undefined ? updates.maintenanceUrl : current.maintenance_url,
    maintenanceTitle:
      updates.maintenanceTitle !== undefined ? updates.maintenanceTitle : current.maintenance_title,
    maintenanceFilePath:
      updates.maintenanceFilePath !== undefined
        ? updates.maintenanceFilePath
        : current.maintenance_file_path,
  };

  db.prepare(
    `UPDATE products SET manufacturer = @manufacturer, product_line = @productLine,
       colour_style = @colourStyle, room = @room, search_status = @searchStatus,
       search_notes = @searchNotes, warranty_url = @warrantyUrl, warranty_title = @warrantyTitle,
       warranty_file_path = @warrantyFilePath, maintenance_url = @maintenanceUrl,
       maintenance_title = @maintenanceTitle, maintenance_file_path = @maintenanceFilePath,
       updated_at = @ts WHERE id = @id`
  ).run({ ...merged, ts: nowIso(), id });

  return getProductById(id);
}

export function deleteProduct(id: string) {
  const product = getProductById(id);
  if (!product) return false;
  getDb().prepare(`DELETE FROM products WHERE id = ?`).run(id);
  addActivity(product.project_id, `Product removed: ${product.manufacturer}`);
  return true;
}

export function updateChecklistItem(
  itemId: string,
  updates: Partial<{
    status: string;
    filePath: string | null;
    fileName: string | null;
    notes: string;
  }>
) {
  const db = getDb();
  const current = db.prepare(`SELECT * FROM checklist_items WHERE id = ?`).get(itemId) as any;
  if (!current) return null;

  const merged = {
    status: updates.status ?? current.status,
    filePath: updates.filePath !== undefined ? updates.filePath : current.file_path,
    fileName: updates.fileName !== undefined ? updates.fileName : current.file_name,
    notes: updates.notes !== undefined ? updates.notes : current.notes,
  };

  db.prepare(
    `UPDATE checklist_items SET status = @status, file_path = @filePath, file_name = @fileName,
       notes = @notes, updated_at = @ts WHERE id = @id`
  ).run({ ...merged, ts: nowIso(), id: itemId });

  addActivity(current.project_id, `Checklist item "${current.label}" marked ${merged.status}.`);

  return db.prepare(`SELECT * FROM checklist_items WHERE id = ?`).get(itemId);
}

export function saveAiDraft(projectId: string, draftType: string, content: string) {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO ai_drafts (id, project_id, draft_type, content, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(id, projectId, draftType, content, nowIso());
  addActivity(projectId, `AI drafted "${draftType.replace(/_/g, " ")}".`);
  return { id, projectId, draftType, content };
}

export function addActivity(projectId: string, message: string) {
  const db = getDb();
  db.prepare(
    `INSERT INTO activity_log (id, project_id, message, created_at) VALUES (?, ?, ?, ?)`
  ).run(crypto.randomUUID(), projectId, message, nowIso());
}

export function getUploadsDir() {
  return UPLOADS_DIR;
}

export function getChecklistItemById(itemId: string) {
  const db = getDb();
  return db.prepare(`SELECT * FROM checklist_items WHERE id = ?`).get(itemId) as any;
}
