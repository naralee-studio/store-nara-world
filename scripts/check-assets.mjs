import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const snapshot = () =>
  Object.fromEntries(
    readdirSync("assets")
      .filter((x) => x.startsWith("nara-ui"))
      .sort()
      .map((x) => [
        x,
        createHash("sha256")
          .update(readFileSync(`assets/${x}`))
          .digest("hex"),
      ]),
  );
const before = snapshot();
execFileSync("npm", ["run", "build"], { stdio: "inherit" });
if (JSON.stringify(before) !== JSON.stringify(snapshot())) {
  console.error(
    "Generated assets differ. Run npm run build and commit assets/nara-ui*.",
  );
  process.exit(1);
}
