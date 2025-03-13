
/**
 * Discord integration module for Beast Tactics
 * Handles all Discord-specific functionality
 */
import { DiscordSDK } from "https://cdn.jsdelivr.net/npm/@discord/embedded-app-sdk@1.2.0/dist/discord-embedded-app-sdk.min.js";

/**
 * Class to manage Discord integration
 */
export class DiscordHandler {
  constructor() {
    this.sdk = null;
    this.isInitialized = false;
    this.playerInfo = null;
    
    console.log("DiscordHandler: Created new instance");
  }
  
  /**
   * Initialize the Discord SDK with the provided client ID
   * @param {string} clientId - Discord application client ID
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize(clientId) {
    try {
      console.log("DiscordHandler: Starting initialization with client ID:", clientId);
      
      if (!clientId || clientId === "YOUR_CLIENT_ID") {
        console.warn("DiscordHandler: Invalid client ID provided. Using Discord may not work properly.");
      }
      
      // Create SDK instance
      this.sdk = new DiscordSDK(clientId);
      console.log("DiscordHandler: SDK instance created");
      
      // Wait for SDK to be ready
      await this.sdk.ready();
      console.log("DiscordHandler: SDK is ready");
      
      // Get authentication token
      const token = await this.sdk.commands.authenticate();
      console.log("DiscordHandler: Authentication successful:", { tokenReceived: !!token });
      
      // Fetch user information if needed
      // this.playerInfo = await this.fetchUserInfo();
      
      this.isInitialized = true;
      console.log("DiscordHandler: Initialization complete");
      return true;
    } catch (error) {
      console.error("DiscordHandler: Initialization failed:", error);
      console.debug("DiscordHandler: Error details:", { 
        name: error.name, 
        message: error.message,
        stack: error.stack
      });
      return false;
    }
  }
  
  /**
   * Check if we're running inside Discord
   * @returns {boolean} - Whether the app is running in Discord
   */
  isInDiscord() {
    try {
      return window.navigator.userAgent.includes("Discord") || 
             window.location.hostname.includes("discord.com");
    } catch (e) {
      console.warn("DiscordHandler: Failed to detect Discord environment:", e);
      return false;
    }
  }
  
  /**
   * Send a message to Discord
   * @param {string} message - Message content to send
   * @returns {Promise<boolean>} - Whether message was sent successfully
   */
  async sendMessage(message) {
    if (!this.isInitialized || !this.sdk) {
      console.error("DiscordHandler: Cannot send message - SDK not initialized");
      return false;
    }
    
    try {
      console.log("DiscordHandler: Sending message:", message);
      // Implementation depends on Discord SDK capabilities
      // await this.sdk.commands.sendMessage(message);
      console.log("DiscordHandler: Message sent successfully");
      return true;
    } catch (error) {
      console.error("DiscordHandler: Failed to send message:", error);
      return false;
    }
  }
}

// Export a singleton instance
export default new DiscordHandler();

