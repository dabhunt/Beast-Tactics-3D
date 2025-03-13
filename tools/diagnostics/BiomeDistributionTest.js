
/**
 * BiomeDistributionTest.js
 * Diagnostic tool to verify the distribution of biomes in the generated map
 */

import { Logger } from '../../public/js/utils/Logger.js';

/**
 * Test and visualize the distribution of biomes in the map
 */
export class BiomeDistributionTest {
  constructor() {
    this.biomeCount = {};
    this.totalHexes = 0;
  }
  
  /**
   * Analyze the biome distribution from the generated hexes
   * @param {Array} hexes - Array of hex objects from the renderer
   */
  analyzeDistribution(hexes) {
    Logger.info('BiomeDistributionTest', 'Analyzing biome distribution...');
    
    // Reset counts
    this.biomeCount = {};
    this.totalHexes = hexes.length;
    
    // Count biomes
    hexes.forEach(hex => {
      const biomeType = hex.biomeType;
      if (!this.biomeCount[biomeType]) {
        this.biomeCount[biomeType] = 0;
      }
      this.biomeCount[biomeType]++;
    });
    
    // Log results
    Logger.info('BiomeDistributionTest', 'Biome distribution analysis:', {
      totalHexes: this.totalHexes,
      distribution: this.biomeCount
    });
    
    // Calculate percentages
    const percentages = {};
    Object.keys(this.biomeCount).forEach(biome => {
      percentages[biome] = (this.biomeCount[biome] / this.totalHexes * 100).toFixed(2) + '%';
    });
    
    Logger.info('BiomeDistributionTest', 'Biome distribution percentages:', percentages);
    
    return {
      counts: this.biomeCount,
      percentages: percentages,
      total: this.totalHexes
    };
  }
  
  /**
   * Generate HTML report of biome distribution
   * @return {String} HTML content for report
   */
  generateHTMLReport() {
    let html = '<h2>Biome Distribution Analysis</h2>';
    
    html += `<p>Total hexes analyzed: ${this.totalHexes}</p>`;
    
    // Create table for results
    html += '<table border="1" style="border-collapse: collapse; width: 100%;">';
    html += '<tr><th>Biome Type</th><th>Count</th><th>Percentage</th><th>Color Sample</th></tr>';
    
    // Color samples for biomes
    const biomeColors = {
      'plains': '#a6c288',      // Earth
      'forest': '#2e8b57',      // Plant
      'mountains': '#a9a9a9',   // Metal
      'desert': '#f5deb3',      // Light
      'water': '#4682b4',       // Water
      'volcanic': '#ff4500',    // Fire
      'storm': '#9370db',       // Electric
      'tundra': '#f0f8ff',      // Wind
      'swamp': '#6b8e23',       // Corrosion
      'dark': '#483d8b',        // Dark
      'sacred': '#fff8dc',      // Spirit
      'battlefield': '#8b0000'  // Combat
    };
    
    // Sort biomes by count descending
    const sortedBiomes = Object.keys(this.biomeCount).sort(
      (a, b) => this.biomeCount[b] - this.biomeCount[a]
    );
    
    // Add rows for each biome
    sortedBiomes.forEach(biome => {
      const percentage = (this.biomeCount[biome] / this.totalHexes * 100).toFixed(2) + '%';
      const color = biomeColors[biome] || '#cccccc';
      
      html += `<tr>
        <td>${biome}</td>
        <td>${this.biomeCount[biome]}</td>
        <td>${percentage}</td>
        <td style="background-color: ${color}; width: 30px;"></td>
      </tr>`;
    });
    
    html += '</table>';
    
    // Add missing biomes section
    const allBiomes = Object.keys(biomeColors);
    const missingBiomes = allBiomes.filter(biome => !this.biomeCount[biome]);
    
    if (missingBiomes.length > 0) {
      html += '<h3>Missing Biomes</h3>';
      html += '<p>The following biomes were not found in the map:</p>';
      html += '<ul>';
      missingBiomes.forEach(biome => {
        html += `<li>${biome} (Element: ${biome.charAt(0).toUpperCase() + biome.slice(1)})</li>`;
      });
      html += '</ul>';
    }
    
    return html;
  }
}

/**
 * Create a simple diagnostic UI for biome distribution
 * @param {Object} hexGridRenderer - The renderer instance with hex data
 */
export function createBiomeDistributionUI(hexGridRenderer) {
  // Create test instance
  const biomeTest = new BiomeDistributionTest();
  
  // Create UI container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '10px';
  container.style.right = '10px';
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  container.style.color = 'white';
  container.style.padding = '10px';
  container.style.borderRadius = '5px';
  container.style.maxHeight = '80vh';
  container.style.overflowY = 'auto';
  container.style.maxWidth = '400px';
  container.style.zIndex = '1000';
  
  // Add title
  const title = document.createElement('h3');
  title.textContent = 'Biome Distribution';
  title.style.margin = '0 0 10px 0';
  container.appendChild(title);
  
  // Create button to analyze
  const analyzeButton = document.createElement('button');
  analyzeButton.textContent = 'Analyze Biome Distribution';
  analyzeButton.style.margin = '5px';
  analyzeButton.style.padding = '5px 10px';
  container.appendChild(analyzeButton);
  
  // Results container
  const resultsContainer = document.createElement('div');
  container.appendChild(resultsContainer);
  
  // Add analyze event
  analyzeButton.addEventListener('click', () => {
    const hexes = hexGridRenderer.getHexes();
    const results = biomeTest.analyzeDistribution(hexes);
    
    // Display results
    resultsContainer.innerHTML = biomeTest.generateHTMLReport();
  });
  
  // Add to document
  document.body.appendChild(container);
  
  return biomeTest;
}
