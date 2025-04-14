const fs = require('fs');

// Path to the file
const filePath = 'client/src/pages/PowerMonitoring.tsx';

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Remove duplicates by fixing our previous script's output
content = content.replace(/},\s+refetchInterval: 10000, \/\/ Refetch every 10 seconds\s+refetchIntervalInBackground: true}/g, "}");

// Write the modified content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed duplicate refetchInterval properties in PowerMonitoring.tsx');
