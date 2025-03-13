/**
 * BiomeDistributionTest.js
 * Tools for analyzing biome distribution in the game map
 */

import { Logger } from "../../public/js/utils/Logger.js";

/**
 * Analyze the biome distribution on the generated map
 * @returns {Object} Analysis results
 */
export async function analyzeMapGeneration() {
  Logger.info("BiomeDistributionTest", "Starting map generation analysis");
  console.log("Analyzing biome distribution...");

  try {
    // Attempt to get access to the game manager and map system
    const gameManager = window.gameManager;

    if (!gameManager) {
      Logger.error("BiomeDistributionTest", "Game manager not available");
      return {
        error: "Game manager not available, cannot analyze biome distribution",
        biomeCounts: {},
        totalHexes: 0
      };
    }

    const mapSystem = gameManager.getSubsystem('mapSystem');

    if (!mapSystem) {
      Logger.error("BiomeDistributionTest", "Map system not available");
      return {
        error: "Map system not available, cannot analyze biome distribution",
        biomeCounts: {},
        totalHexes: 0
      };
    }

    // Get map tiles
    const hexes = mapSystem.getAllTiles();

    if (!hexes || hexes.length === 0) {
      Logger.warning("BiomeDistributionTest", "No hex tiles found in map system");
      return {
        error: "No hex tiles found in the current map",
        biomeCounts: {},
        totalHexes: 0
      };
    }

    Logger.info("BiomeDistributionTest", `Found ${hexes.length} hex tiles for analysis`);

    // Count biome types
    const biomeCounts = {};
    let totalHexes = hexes.length;

    hexes.forEach(hex => {
      const biomeType = hex.userData?.biomeType || hex.biomeType;

      if (biomeType) {
        biomeCounts[biomeType] = (biomeCounts[biomeType] || 0) + 1;
      } else {
        Logger.warning("BiomeDistributionTest", "Found hex without biome type", hex);
      }
    });

    // Calculate percentages
    const biomePercentages = {};
    Object.entries(biomeCounts).forEach(([biome, count]) => {
      biomePercentages[biome] = (count / totalHexes * 100).toFixed(2) + '%';
    });

    // Calculate expected distribution
    const expectedDistribution = {};
    const biomeTypes = Object.keys(biomeCounts);
    const equalShare = 1 / biomeTypes.length;

    biomeTypes.forEach(biome => {
      expectedDistribution[biome] = equalShare;
    });

    // Calculate deviation from equal distribution
    const deviations = {};
    let totalDeviation = 0;

    biomeTypes.forEach(biome => {
      const actual = biomeCounts[biome] / totalHexes;
      const expected = expectedDistribution[biome];
      deviations[biome] = Math.abs(actual - expected);
      totalDeviation += deviations[biome];
    });

    const averageDeviation = totalDeviation / biomeTypes.length;

    // Log results
    Logger.info("BiomeDistributionTest", "Biome distribution analysis complete", {
      totalHexes,
      biomeCounts,
      biomePercentages,
      averageDeviation
    });

    return {
      totalHexes,
      biomeCounts,
      biomePercentages, 
      averageDeviation,
      equalityScore: (100 * (1 - averageDeviation * biomeTypes.length)).toFixed(2)
    };
  } catch (error) {
    Logger.error("BiomeDistributionTest", "Error analyzing map generation", error);
    console.error("Error analyzing map generation:", error);

    return {
      error: `Analysis error: ${error.message}`,
      biomeCounts: {},
      totalHexes: 0
    };
  }
}

/**
 * Calculate metrics about the distribution equality
 * @param {Object} biomeCounts - Counts of each biome
 * @param {Number} totalHexes - Total number of hexes
 * @returns {Object} Equality metrics
 */
function calculateDistributionEquality(biomeCounts, totalHexes) {
  // Get the number of biome types
  const biomeTypes = Object.keys(biomeCounts);
  const typeCount = biomeTypes.length;

  // Perfect equal distribution would have this many hexes per biome
  const perfectCount = totalHexes / typeCount;

  // Calculate variance
  let totalVariance = 0;

  biomeTypes.forEach(biomeType => {
    const count = biomeCounts[biomeType];
    const difference = Math.abs(count - perfectCount);
    totalVariance += (difference * difference);
  });

  const variance = totalVariance / typeCount;
  const stdDeviation = Math.sqrt(variance);

  // Calculate coefficient of variation (normalized measure of dispersion)
  const coefficientOfVariation = stdDeviation / perfectCount;

  // Convert to a 0-100 equality score (0 = completely unequal, 100 = perfectly equal)
  const equalityScore = (100 * (1 - Math.min(1, coefficientOfVariation))).toFixed(2);

  // Generate a message based on the score
  let message = "";

  if (equalityScore > 90) {
    message = "The distribution is very even, with excellent biome variety.";
  } else if (equalityScore > 80) {
    message = "The distribution is mostly even, with good biome variety.";
  } else if (equalityScore > 70) {
    message = "The distribution is somewhat uneven, but still has reasonable biome variety.";
  } else if (equalityScore > 50) {
    message = "The distribution is uneven, with some biomes significantly more common than others.";
  } else {
    message = "The distribution is very uneven, with poor biome variety.";
  }

  return {
    equalityScore,
    perfectCount,
    variance,
    stdDeviation,
    coefficientOfVariation,
    message
  };
}

/**
 * Generate HTML report of biome distribution
 * @param {Object} analysisResult - Result from analyzeMapGeneration
 * @return {String} HTML content for report
 */
async function generateHTMLReport(analysisResult) {
    let html = '<h2>Biome Distribution Analysis</h2>';
    
    if (analysisResult.error) {
        html += `<p style="color: red;">Error: ${analysisResult.error}</p>`;
        return html;
    }

    html += `<p>Total hexes analyzed: ${analysisResult.totalHexes}</p>`;
    
    // Add distribution equality metrics
    const equalityMetrics = calculateDistributionEquality(analysisResult.biomeCounts, analysisResult.totalHexes);
    
    html += `
    <div style="margin: 10px 0; padding: 10px; background-color: rgba(255,255,255,0.1); border-radius: 5px;">
      <h3>Distribution Equality</h3>
      <p><strong>Equality Score:</strong> ${equalityMetrics.equalityScore}/100</p>
      <p><strong>Analysis:</strong> ${equalityMetrics.message}</p>
      <div style="background-color: #333; height: 20px; width: 100%; border-radius: 3px; margin-top: 5px;">
        <div style="background-color: ${parseFloat(equalityMetrics.equalityScore) > 85 ? '#4CAF50' : 
          parseFloat(equalityMetrics.equalityScore) > 70 ? '#FFC107' : '#F44336'}; 
          height: 100%; width: ${equalityMetrics.equalityScore}%; border-radius: 3px;"></div>
      </div>
    </div>`;
    
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
    const sortedBiomes = Object.keys(analysisResult.biomeCounts).sort(
      (a, b) => analysisResult.biomeCounts[b] - analysisResult.biomeCounts[a]
    );
    
    // Add rows for each biome
    sortedBiomes.forEach(biome => {
      const percentage = analysisResult.biomePercentages[biome] || "0%";
      const color = biomeColors[biome] || '#cccccc';
      
      html += `<tr>
        <td>${biome}</td>
        <td>${analysisResult.biomeCounts[biome] || 0}</td>
        <td>${percentage}</td>
        <td style="background-color: ${color}; width: 30px;"></td>
      </tr>`;
    });
    
    html += '</table>';
    
    // Add missing biomes section
    const allBiomes = Object.keys(biomeColors);
    const missingBiomes = allBiomes.filter(biome => !analysisResult.biomeCounts[biome]);
    
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


/**
 * Create a simple diagnostic UI for biome distribution
 * @param {Object} hexGridRenderer - The renderer instance with hex data
 */
export async function createBiomeDistributionUI(hexGridRenderer) {
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
  analyzeButton.addEventListener('click', async () => {
    const results = await analyzeMapGeneration();
    
    // Display results
    resultsContainer.innerHTML = await generateHTMLReport(results);
  });
  
  // Add to document
  document.body.appendChild(container);
  
  return {}; // Returning an empty object since no longer tracking a BiomeDistributionTest instance.
}