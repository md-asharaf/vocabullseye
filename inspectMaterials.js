const fs = require('fs');
const content = fs.readFileSync('public/models/Standing Aim Idle 01.fbx', 'utf8');
const materials = content.match(/Material::[^"]+/g);
console.log([...new Set(materials)]);
