
/**
 * TextureLoaderTest.js
 * Diagnostic tool to verify texture loading for BiomeTiles
 */

import { Logger } from '../../public/js/utils/Logger.js';
import * as THREE from 'three';

export class TextureLoaderTest {
  constructor() {
    this.textures = {};
    this.loadingManager = new THREE.LoadingManager();
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    
    // Set up loading manager callbacks
    this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
      Logger.info('TextureLoaderTest', `Started loading: ${url} (${itemsLoaded}/${itemsTotal} items)`);
    };
    
    this.loadingManager.onLoad = () => {
      Logger.info('TextureLoaderTest', 'Loading complete');
    };
    
    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      Logger.debug('TextureLoaderTest', `Loading file: ${url} (${itemsLoaded}/${itemsTotal} items)`);
    };
    
    this.loadingManager.onError = (url) => {
      Logger.error('TextureLoaderTest', `Error loading ${url}`);
    };
  }
  
  /**
   * Test loading all biome tiles
   * @return {Promise<Object>} Object containing loaded textures or errors
   */
  async testBiomeTileLoading() {
    Logger.info('TextureLoaderTest', 'Testing BiomeTile texture loading...');
    
    const biomeTypes = [
      'plains', 'forest', 'mountains', 'desert', 'water',
      'volcanic', 'storm', 'tundra', 'swamp', 'dark', 'sacred', 'battlefield'
    ];
    
    const results = {
      success: [],
      failure: []
    };
    
    // Mapping from biome types to element texture files
    const biomeToElementMap = {
      'plains': 'Earth',
      'forest': 'Plant', // Changed from Nature to Plant
      'mountains': 'Metal',
      'desert': 'Light',
      'water': 'Water',
      'volcanic': 'Fire',
      'storm': 'Electric',
      'tundra': 'Wind',
      'swamp': 'Corrosion',
      'dark': 'Dark',
      'sacred': 'Spirit',
      'battlefield': 'Combat'
    };
    
    // Complete element file mapping (for reference)
    const elementFiles = {
      'Combat': 'Combat.png',
      'Corrosion': 'Corrosion.png',
      'Dark': 'Dark.png',
      'Earth': 'Earth.png',
      'Electric': 'Electric.png',
      'Fire': 'Fire.png',
      'Light': 'Light.png',
      'Metal': 'Metal.png',
      'Plant': 'Plant.png',
      'Spirit': 'Spirit.png',
      'Water': 'Water.png',
      'Wind': 'Wind.png'
    };
    
    Logger.debug('TextureLoaderTest', 'Using biome to element mapping:', biomeToElementMap);
    
    for (const biome of biomeTypes) {
      try {
        Logger.debug('TextureLoaderTest', `Loading texture for ${biome}...`);
        // Get the corresponding element name from the mapping
        const elementName = biomeToElementMap[biome] || biome;
        const texturePath = `/assets/BiomeTiles/${elementName}.png`;
        Logger.debug('TextureLoaderTest', `Requesting texture from path: ${texturePath} (element for ${biome})`);
        
        // Test if file exists with fetch
        const response = await fetch(texturePath);
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        
        // Try loading the texture
        const texture = await new Promise((resolve, reject) => {
          this.textureLoader.load(
            texturePath,
            (texture) => resolve(texture),
            undefined,
            (error) => reject(error)
          );
        });
        
        results.success.push({
          biome,
          path: texturePath,
          texture: texture
        });
        
        Logger.info('TextureLoaderTest', `Successfully loaded texture for ${biome}`);
      } catch (error) {
        Logger.error('TextureLoaderTest', `Failed to load texture for ${biome}`, error);
        results.failure.push({
          biome,
          error: error.message
        });
      }
    }
    
    // Log summary
    Logger.info('TextureLoaderTest', 'BiomeTile loading test complete', {
      total: biomeTypes.length,
      successful: results.success.length,
      failed: results.failure.length
    });
    
    return results;
  }
  
  /**
   * Generate HTML report of texture loading test
   * @param {Object} results - Results from testBiomeTileLoading
   * @return {String} HTML content for report
   */
  generateHTMLReport(results) {
    let html = '<h2>BiomeTile Texture Loading Report</h2>';
    
    html += `<p>Total textures: ${results.success.length + results.failure.length}</p>`;
    html += `<p>Successfully loaded: ${results.success.length}</p>`;
    html += `<p>Failed to load: ${results.failure.length}</p>`;
    
    // Successful textures
    html += '<h3>Successfully Loaded Textures</h3>';
    html += '<ul>';
    results.success.forEach(item => {
      html += `<li>${item.biome} - <img src="${item.path}" width="64" height="64" alt="${item.biome}"></li>`;
    });
    html += '</ul>';
    
    // Failed textures
    if (results.failure.length > 0) {
      html += '<h3>Failed Textures</h3>';
      html += '<ul class="error-list">';
      results.failure.forEach(item => {
        html += `<li>${item.biome} - Error: ${item.error}</li>`;
      });
      html += '</ul>';
    }
    
    return html;
  }
}
