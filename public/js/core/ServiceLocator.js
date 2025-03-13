
/**
 * ServiceLocator.js
 * Provides centralized access to game subsystems through dependency injection
 */

import { Logger } from '../utils/Logger.js';

export class ServiceLocator {
  constructor() {
    console.log('ServiceLocator: Initializing service registry...');
    
    // Map of service names to service instances
    this._services = new Map();
    
    // Track service dependencies for initialization order
    this._dependencies = new Map();
    
    Logger.info('ServiceLocator', 'Instance created');
  }
  
  /**
   * Register a service with the locator
   * @param {String} serviceName - Name to register the service under
   * @param {Object} serviceInstance - The service instance to register
   * @param {Array<String>} dependencies - Names of services this service depends on
   * @returns {Boolean} Success status
   */
  registerService(serviceName, serviceInstance, dependencies = []) {
    if (!serviceName || !serviceInstance) {
      Logger.error('ServiceLocator', 'Cannot register service: missing name or instance');
      return false;
    }
    
    // Check if a service with this name already exists
    if (this._services.has(serviceName)) {
      Logger.warning('ServiceLocator', `Service '${serviceName}' is already registered, replacing`);
    }
    
    // Register the service
    this._services.set(serviceName, serviceInstance);
    
    // Register dependencies
    if (dependencies.length > 0) {
      this._dependencies.set(serviceName, dependencies);
    }
    
    Logger.info('ServiceLocator', `Registered service: ${serviceName}`);
    return true;
  }
  
  /**
   * Retrieve a service by name
   * @param {String} serviceName - Name of the service to retrieve
   * @returns {Object|null} The service instance or null if not found
   */
  getService(serviceName) {
    if (!this._services.has(serviceName)) {
      Logger.warning('ServiceLocator', `Service '${serviceName}' not found`);
      return null;
    }
    
    return this._services.get(serviceName);
  }
  
  /**
   * Unregister a service
   * @param {String} serviceName - Name of the service to unregister
   * @returns {Boolean} Success status
   */
  unregisterService(serviceName) {
    if (!this._services.has(serviceName)) {
      Logger.warning('ServiceLocator', `Cannot unregister service '${serviceName}': not found`);
      return false;
    }
    
    // Remove the service
    this._services.delete(serviceName);
    
    // Remove from dependencies
    this._dependencies.delete(serviceName);
    
    Logger.info('ServiceLocator', `Unregistered service: ${serviceName}`);
    return true;
  }
  
  /**
   * Check if a service is registered
   * @param {String} serviceName - Name of the service to check
   * @returns {Boolean} Whether the service is registered
   */
  hasService(serviceName) {
    return this._services.has(serviceName);
  }
  
  /**
   * Get the sorted initialization order respecting dependencies
   * @returns {Array<String>} Service names in initialization order
   */
  getInitializationOrder() {
    const visited = new Set();
    const result = [];
    
    // Helper function for topological sort
    const visit = (serviceName) => {
      // Skip if already visited
      if (visited.has(serviceName)) return;
      
      // Mark as visited
      visited.add(serviceName);
      
      // Visit dependencies first
      const dependencies = this._dependencies.get(serviceName) || [];
      for (const dep of dependencies) {
        if (this._services.has(dep)) {
          visit(dep);
        } else {
          Logger.warning('ServiceLocator', `Service '${serviceName}' depends on unknown service '${dep}'`);
        }
      }
      
      // Add to result
      result.push(serviceName);
    };
    
    // Visit all services
    for (const serviceName of this._services.keys()) {
      visit(serviceName);
    }
    
    return result;
  }
  
  /**
   * Get a list of all registered services
   * @returns {Array<String>} Names of all registered services
   */
  getAllServiceNames() {
    return Array.from(this._services.keys());
  }
}
