
/**
 * BiomeDistributionTest.js
 * A diagnostic tool to check the availability of biome tile assets
 * and preview the element distribution logic for the map.
 */

console.log('Starting Biome Distribution Test...');

// Define all element types
const elementTypes = [
  'Combat',
  'Corrosion',
  'Dark',
  'Earth',
  'Electric',
  'Fire',
  'Light',
  'Metal',
  'Plant',
  'Spirit',
  'Water',
  'Wind'
];

// Create URLs for local assets
const elemUrls = {};
elementTypes.forEach(element => {
  elemUrls[element] = `/assets/BiomeTiles/${element}.png`;
  
  // Create a test image element to verify if the asset exists
  const img = new Image();
  img.onload = () => {
    console.log(`✅ Successfully loaded ${element} texture: ${elemUrls[element]}`);
  };
  img.onerror = () => {
    console.error(`❌ Failed to load ${element} texture: ${elemUrls[element]}`);
  };
  img.src = elemUrls[element];
});

// Log the full URL map for reference
console.log('Element URL mapping:', elemUrls);

// Test the distribution logic we'll use for the map
console.log('\nTesting element distribution logic:');
function getRandomElement() {
  const randomIndex = Math.floor(Math.random() * elementTypes.length);
  return elementTypes[randomIndex];
}

// Generate a sample distribution
const sampleSize = 100;
const distribution = {};
elementTypes.forEach(element => { distribution[element] = 0; });

for (let i = 0; i < sampleSize; i++) {
  const element = getRandomElement();
  distribution[element]++;
}

console.log(`Random distribution of ${sampleSize} hexagons:`);
console.table(distribution);

// Calculate percentage distribution
console.log('Percentage distribution:');
Object.entries(distribution).forEach(([element, count]) => {
  const percentage = (count / sampleSize * 100).toFixed(1);
  console.log(`${element}: ${percentage}%`);
});
