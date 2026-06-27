const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

const rechartsComponents = [
  'LineChart', 'Line', 'AreaChart', 'Area', 'BarChart', 'Bar', 'ScatterChart', 'Scatter',
  'ComposedChart', 'XAxis', 'YAxis', 'CartesianGrid', 'Tooltip', 'Legend', 'ResponsiveContainer',
  'ReferenceLine', 'Cell', 'ZAxis', 'RadarChart', 'Radar', 'PolarGrid', 'PolarAngleAxis', 
  'PolarRadiusAxis', 'RadialBarChart', 'RadialBar'
];

let foundErrors = false;

files.forEach(file => {
  const content = fs.readFileSync(path.join(pagesDir, file), 'utf8');
  
  // Extract imports from recharts
  const importMatch = content.match(/import\s+{([^}]+)}\s+from\s+['"]recharts['"]/);
  const imported = new Set();
  if (importMatch) {
    importMatch[1].split(',').forEach(item => imported.add(item.trim()));
  }

  // Find all used tags like <LineChart or <XAxis
  const used = new Set();
  rechartsComponents.forEach(comp => {
    if (content.includes(`<${comp}`) || content.includes(`</${comp}>`)) {
      used.add(comp);
    }
  });

  // Check if used are imported
  const missing = [];
  used.forEach(comp => {
    if (!imported.has(comp)) {
      missing.push(comp);
    }
  });

  if (missing.length > 0) {
    console.log(`Error in ${file}: Missing Recharts imports: ${missing.join(', ')}`);
    foundErrors = true;
  }
});

if (!foundErrors) {
  console.log('No missing recharts imports found!');
}
