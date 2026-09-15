import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getUploadsDir } from "./db";

const MAX_BYTES = 25 * 1024 * 1024;

export interface DownloadResult {
  ok: boolean;
  filePath?: string;
  url?: string;
  error?: string;
}

/**
 * Manufacturer sites (torlys.com among them) return 403 to anything that looks
 * like a script, so present as a normal browser.
 */
function browserHeaders(target: URL): Record<string, string> {
  return {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    Accept: "application/pdf,application/xhtml+xml,text/html;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-CA,en;q=0.9",
    Referer: `${target.protocol}//${target.host}/`,
  };
}

export async function downloadDocument(
  url: string,
  projectId: string,
  label: string
): Promise<DownloadResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, url, error: "Invalid URL" };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, url, error: "Only http(s) URLs are supported" };
  }

  let res: Response;
  try {
    res = await fetch(url, {
      redirect: "follow",
      headers: browserHeaders(parsed),
      signal: AbortSignal.timeout(20000),
    });
  } catch (err: any) {
    return { ok: false, url, error: `Fetch failed: ${err.message}` };
  }

  if (!res.ok) {
    return { ok: false, url, error: `HTTP ${res.status} from source` };
  }

  const buffer = Buffer.from(await res.arrayBuffer());

  if (buffer.length === 0) return { ok: false, url, error: "Empty file" };
  if (buffer.length > MAX_BYTES) return { ok: false, url, error: "File larger than 25MB" };

  // Trust the bytes, not the content-type header — manufacturer sites serve PDFs
  // as octet-stream, and a dead link often returns a 200 HTML error page.
  if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
    return { ok: false, url, error: "Link did not return a PDF (likely an HTML page)" };
  }

  const safeLabel = label.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
  const fileName = `${crypto.randomBytes(4).toString("hex")}-${safeLabel}.pdf`;
  const projectDir = path.join(getUploadsDir(), projectId);
  await fs.mkdir(projectDir, { recursive: true });
  await fs.writeFile(path.join(projectDir, fileName), buffer);

  return { ok: true, url, filePath: path.join(projectId, fileName) };
}

/**
 * Tries every candidate concurrently and returns the best-ranked one that
 * succeeded. Trying them one at a time (await each before starting the next)
 * meant a single slow or dead link cost its full 20s timeout before the next
 * candidate even started — with up to 3 candidates that was over a minute of
 * dead time per document. Running them in parallel bounds the wait to one
 * timeout no matter how many candidates there are.
 */
export async function downloadFirstWorking(
  urls: string[],
  projectId: string,
  label: string
): Promise<{ result: DownloadResult; attempts: string[] }> {
  if (urls.length === 0) {
    return { result: { ok: false, error: "No candidates found" }, attempts: [] };
  }

  const settled = await Promise.all(urls.map((url) => downloadDocument(url, projectId, label)));

  const attempts: string[] = [];
  for (const result of settled) {
    if (result.ok) return { result, attempts };
    attempts.push(`${result.url} — ${result.error}`);
  }

  return { result: { ok: false, error: "All candidate links failed" }, attempts };
}
