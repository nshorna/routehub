import { execSync } from "child_process";

function getOutdatedPackages(output) {
  return output
    .split("\n")
    .slice(1) // remove header
    .filter(Boolean)
    .map(line => line.trim().split(/\s+/)[0] + "@latest");
}

try {
  const output = execSync("npm outdated", { encoding: "utf8" });
  const packages = getOutdatedPackages(output);

  if (packages.length === 0) {
    console.log("All packages are up to date.");
    process.exit(0);
  }

  const cmd = `pnpm add ${packages.join(" ")}`;
  console.log(`Running: ${cmd}`);
  execSync(cmd, { stdio: "inherit" });

} catch (err) {
  // npm outdated exits with code 1 when updates exist
  const output = err.stdout?.toString() || "";
  const packages = getOutdatedPackages(output);

  if (packages.length === 0) {
    console.log("All packages are up to date.");
    process.exit(0);
  }

  const cmd = `pnpm add ${packages.join(" ")}`;
  console.log(`Running: ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}
