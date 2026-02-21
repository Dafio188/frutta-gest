import fs from "fs"
import path from "path"

const rootDir = process.cwd()
const serverDir = path.join(rootDir, ".next", "server")
const targetFile = path.join(serverDir, "middleware.js.nft.json")

if (!fs.existsSync(serverDir)) {
  process.exit(0)
}

if (!fs.existsSync(targetFile)) {
  const payload = {
    version: 1,
    files: [],
    root: ".",
  }

  fs.writeFileSync(targetFile, JSON.stringify(payload), "utf8")
}

