
/**
 * GeneratePlaceholderTiles.js
 * This script helps generate placeholder biome tile images for testing.
 * To be run from the browser console on pages that support Canvas.
 */

console.log('Starting placeholder tile generator...');

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

// Define colors for each element
const elementColors = {
  'Combat': '#ff5733',
  'Corrosion': '#7cfc00',
  'Dark': '#581845',
  'Earth': '#964b00',
  'Electric': '#ffff00',
  'Fire': '#ff4500',
  'Light': '#ffffff',
  'Metal': '#c0c0c0',
  'Plant': '#2ecc71',
  'Spirit': '#d8bfd8',
  'Water': '#3498db',
  'Wind': '#c6e2ff'
};

// Create a canvas to draw on
const canvas = document.createElement('canvas');
canvas.width = 128;
canvas.height = 128;
const ctx = canvas.getContext('2d');

// Function to generate a simple element tile
function generateElementTile(element) {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Set background color
  ctx.fillStyle = elementColors[element];
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw hexagon outline
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI / 3) - (Math.PI / 6);
    const x = canvas.width / 2 + 50 * Math.cos(angle);
    const y = canvas.height / 2 + 50 * Math.sin(angle);
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.stroke();
  
  // Draw element name
  ctx.fillStyle = element === 'Light' ? '#000000' : '#ffffff';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(element, canvas.width / 2, canvas.height / 2);
  
  // Return data URL
  return canvas.toDataURL('image/png');
}

// Generate and output all element tiles
console.log('Generating placeholder tiles...');
elementTypes.forEach(element => {
  const dataUrl = generateElementTile(element);
  
  // Log instructions to save the image
  console.log(`${element} tile generated. Right-click on the image below and select "Save Image As..." to save it as ${element}.png`);
  
  // Create an image element to display the tile
  const img = document.createElement('img');
  img.src = dataUrl;
  img.alt = element;
  img.title = `${element} Tile - Right-click and Save Image As... ${element}.png`;
  img.style.margin = '10px';
  img.style.border = '1px solid black';
  
  // Add to document body or a specific container
  document.body.appendChild(img);
});

console.log('Tile generation complete. Save all images to public/assets/BiomeTiles/ directory.');
