const fs = require('fs');
const path = require('path');

const tasksDir = path.join(__dirname, '../tasks');

for (let i = 87; i <= 101; i++) {
  const files = fs.readdirSync(tasksDir).filter(f => f.startsWith(`${i}_`));
  if (files.length === 1) {
    const filePath = path.join(tasksDir, files[0]);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/- \[ \] /g, '- [x] ');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${files[0]}`);
  }
}
