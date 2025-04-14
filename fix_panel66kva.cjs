const fs = require('fs');

// Path to the file
const filePath = 'client/src/pages/Panel66KVA.tsx';

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Find all query declarations with refetchInterval duplicates
const regex = /refetchInterval: 10000,\s+\/\/ Refetch every 10 seconds\s+refetchIntervalInBackground: true\}/g;

// Replace with cleaned version
content = content.replace(regex, "refetchInterval: 10000, // Refetch every 10 seconds\n    refetchIntervalInBackground: true\n  }");

// Write the fixed file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed Panel66KVA.tsx properly');
