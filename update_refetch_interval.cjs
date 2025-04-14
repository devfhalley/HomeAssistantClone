const fs = require('fs');
const path = require('path');

// Path to the file
const filePath = 'client/src/pages/PowerMonitoring.tsx';

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Regular expression to match query definitions without refetchInterval
const regex = /const\s+\{\s+data:.*?\}\s+=\s+useQuery\(\{\s+queryKey:.*?,\s+queryFn:.*?\s+\}\);/gs;

// Replace with the same definition but with refetchInterval added
content = content.replace(regex, (match) => {
  // Extract the closing parenthesis position
  const closingBraceIndex = match.lastIndexOf('});');
  
  // Insert the refetchInterval before the closing parenthesis
  return match.slice(0, closingBraceIndex) + 
    ',\n    refetchInterval: 10000, // Refetch every 10 seconds\n    refetchIntervalInBackground: true' + 
    match.slice(closingBraceIndex);
});

// Write the modified content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Updated all queries with refetchInterval in PowerMonitoring.tsx');
