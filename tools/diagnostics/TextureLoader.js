/**
 * TextureLoader.js
 * Diagnostic tool to verify texture loading
 */

import { Logger } from "../../public/js/utils/Logger.js";

/**
 * Test the loading of BiomeTile textures
 */
export async function testTextureLoading() {
  Logger.info("TextureLoader", "Starting texture loading test");

  const biomeTypes = [
    "plains",
    "forest",
    "mountains",
    "desert",
    "water",
    "volcanic",
    "storm",
    "tundra",
    "swamp",
    "dark",
    "sacred",
    "battlefield",
  ];

  const results = {
    success: [],
    failed: [],
    dimensions: {},
    totalSize: 0,
  };

  // Log the start of the process with details
  Logger.info(
    "TextureLoader",
    `Starting texture loading test for ${biomeTypes.length} biome types`,
  );

  for (const biome of biomeTypes) {
    try {
      // Create an Image to load and test the texture
      const img = new Image();
      const loadPromise = new Promise((resolve, reject) => {
        img.onload = () => {
          results.success.push(biome);
          results.dimensions[biome] = {
            width: img.width,
            height: img.height,
          };
          results.totalSize += img.width * img.height * 4; // Rough estimate of memory usage (RGBA)
          resolve();
        };
        img.onerror = () => {
          results.failed.push(biome);
          reject(new Error(`Failed to load ${biome}.png`));
        };
      });

      // Mapping from biome types to element texture files
      const biomeToElementMap = {
        plains: "Earth",
        forest: "Plant",
        mountains: "Earth", // Changed from Metal to Earth
        desert: "Light",
        water: "Water",
        volcanic: "Fire",
        storm: "Electric",
        tundra: "Wind",
        swamp: "Corrosion",
        dark: "Dark", // Should be Cave = Dark
        sacred: "Spirit", // Should be Temp = Spirit
        battlefield: "Combat",
        electricForest: "Electric", // Added specifically for Electric
        cave: "Dark", // Added for Cave = Dark
        temp: "Spirit", // Added for Temp = Spirit
        volcano: "Fire" // Added for Volcano = Fire
      };

      // Use the element mapping instead of capitalization
      const elementName = biomeToElementMap[biome] || biome;
      img.src = `./public/assets/BiomeTiles/${elementName}.png`;
      Logger.debug(
        "TextureLoader",
        `Attempting to load ${img.src} (element for ${biome})`,
      );

      // Wait with timeout
      await Promise.race([
        loadPromise,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`Timeout loading ${biome}.png`)),
            5000,
          ),
        ),
      ]);

      Logger.info("TextureLoader", `Successfully loaded ${biome}.png`);
    } catch (err) {
      Logger.error("TextureLoader", `Error loading ${biome}.png`, err);
    }
  }

  // Log summary
  Logger.info("TextureLoader", "Texture loading test complete", {
    total: biomeTypes.length,
    succeeded: results.success.length,
    failed: results.failed.length,
    dimensions: results.dimensions,
    totalSizeKB: Math.round(results.totalSize / 1024),
  });

  return results;
}
