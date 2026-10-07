import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

const envPath = fileURLToPath(new URL("./.env", import.meta.url));
if (existsSync(envPath)) for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(?:"([^"]*)"|(.*))$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2] ?? match[3];
}

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { testTimeout: 20_000, hookTimeout: 20_000, fileParallelism: false },
});
