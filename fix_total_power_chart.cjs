const fs = require('fs');

// Read the file
const filePath = 'client/src/components/TotalPowerChart.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add isSameDay import
content = content.replace(
  "import { format } from \"date-fns\";",
  "import { format, isSameDay } from \"date-fns\";"
);

// 2. Replace clearDateFilter function with resetDateToToday
content = content.replace(
  /\/\/\s*Clear the date filter[\s\S]*?setSelectedDate\(undefined\);[\s\S]*?refetch\(\);[\s\S]*?\};/m,
  "// Reset the date filter to today\n  const resetDateToToday = () => {\n    setSelectedDate(new Date());\n    refetch();\n  };"
);

// 3. Replace the button that uses clearDateFilter
content = content.replace(
  /\/\*\s*Clear Filter Button[\s\S]*?onClick=\{clearDateFilter\}[\s\S]*?Clear[\s\S]*?<\/Button>/m,
  "/* Reset to Today Button */\n            {selectedDate && !isSameDay(selectedDate, new Date()) && (\n              <Button \n                variant=\"ghost\" \n                size=\"sm\"\n                onClick={resetDateToToday}\n              >\n                Reset to Today\n              </Button>"
);

// Write the changes back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Successfully updated TotalPowerChart.tsx');
