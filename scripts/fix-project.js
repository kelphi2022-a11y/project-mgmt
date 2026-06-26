"use client";
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve('e:/project management app');

// Helper to recursively list files
function getAllFiles(dir, arr = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip node_modules and .next
      if (['node_modules', '.next', '.git'].includes(entry.name)) continue;
      getAllFiles(fullPath, arr);
    } else {
      if (fullPath.match(/\.(tsx?|jsx?)$/)) arr.push(fullPath);
    }
  }
  return arr;
}

// 1️⃣ Rename (secure) → (secure) if present
const protectedPath = path.join(projectRoot, 'app', '(secure)');
const securePath = path.join(projectRoot, 'app', '(secure)');
if (fs.existsSync(protectedPath) && !fs.existsSync(securePath)) {
  fs.renameSync(protectedPath, securePath);
  console.log('Renamed (secure) to (secure)');
}

// 2️⃣ Update import paths referencing (secure)
const allFiles = getAllFiles(projectRoot);
for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  const updated = content.replace(/\(protected\)/g, '(secure)');
  if (updated !== content) {
    fs.writeFileSync(file, updated);
    console.log('Updated import in', path.relative(projectRoot, file));
  }
}

// 3️⃣ Add "use client" to files that import client‑only APIs
const clientAPIs = ['useEffect', 'useState', 'useRouter', 'useSearchParams'];
for (const file of allFiles) {
  const ext = path.extname(file);
  if (!['.tsx', '.ts', '.jsx', '.js'].includes(ext)) continue;
  let content = fs.readFileSync(file, 'utf8');
  if (/^[\s]*['"]use client['"];\s*$/m.test(content)) continue; // already present
  const hasClientAPI = clientAPIs.some(api => new RegExp(`\\b${api}\\b`).test(content));
  if (hasClientAPI) {
    const newContent = `"use client";\n${content}`;
    fs.writeFileSync(file, newContent);
    console.log('Prepended use client to', path.relative(projectRoot, file));
  }
}

console.log('Auto‑fix completed.');
