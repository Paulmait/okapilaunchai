import fs from "node:fs";
import path from "node:path";
import archiver from "archiver";

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

export async function zipDirectory(sourceDir: string, outPath: string): Promise<void> {
  ensureDir(path.dirname(outPath));

  return await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve());
    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}
