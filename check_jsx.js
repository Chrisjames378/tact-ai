const fs = require('fs');
const content = fs.readFileSync('src/components/RepairToolbox.tsx', 'utf8');

let openTags = 0;
let lineNum = 1;
for (let i = 0; i < content.length; i++) {
  if (content[i] === '\n') lineNum++;
  if (content.substr(i, 4) === '<div') openTags++;
  if (content.substr(i, 5) === '</div') openTags--;
  if (openTags < 0) {
    console.log(`Unmatched closing tag at line ${lineNum}`);
    openTags = 0;
  }
}
console.log(`Final open tags: ${openTags}`);
