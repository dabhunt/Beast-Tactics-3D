
/**
 * TextureLoader.js
 * Diagnostic tool to verify texture loading
 */

import { Logger } from '../../public/js/utils/Logger.js';

/**
 * Test the loading of BiomeTile textures
 */
export async function testTextureLoading() {
  Logger.info('TextureLoader', 'Starting texture loading test');
  
  const biomeTypes = ['plains', 'forest', 'mountains', 'desert', 'water'];
  const results = {
    success: [],
    failed: [],
    dimensions: {},
    totalSize: 0
  };
  
  for (const biome of biomeTypes) {
    try {
      // Create an Image to load and test the texture
      const img = new Image();
      const loadPromise = new Promise((resolve, reject) => {
        img.onload = () => {
          results.success.push(biome);
          results.dimensions[biome] = {
            width: img.width,
            height: img.height
          };
          results.totalSize += img.width * img.height * 4; // Rough estimate of memory usage (RGBA)
          resolve();
        };
        img.onerror = () => {
          results.failed.push(biome);
          reject(new Error(`Failed to load ${biome}.png`));
        };
      });
      
      // Start loading with proper capitalization
      const capitalizedBiome = biome.charAt(0).toUpperCase() + biome.slice(1);
      img.src = `./public/assets/BiomeTiles/${capitalizedBiome}.png`;
      Logger.debug('TextureLoader', `Attempting to load ${img.src}`);
      
      // Wait with timeout
      await Promise.race([
        loadPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout loading ${biome}.png`)), 5000))
      ]);
      
      Logger.info('TextureLoader', `Successfully loaded ${biome}.png`);
    } catch (err) {
      Logger.error('TextureLoader', `Error loading ${biome}.png`, err);
    }
  }
  
  // Log summary
  Logger.info('TextureLoader', 'Texture loading test complete', {
    total: biomeTypes.length,
    succeeded: results.success.length,
    failed: results.failed.length,
    dimensions: results.dimensions,
    totalSizeKB: Math.round(results.totalSize / 1024)
  });
  
  return results;
}
