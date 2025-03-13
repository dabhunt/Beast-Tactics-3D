/**
 * ServiceLocator.js
 * Service location pattern implementation for accessing game services
 */

import { Logger } from '../utils/Logger.js';

/**
 * Service locator to manage and retrieve game services
 */
export class ServiceLocator {
  /**
   * Create the service locator
   */
  constructor() {
    // Registry of all game services
    this._services = new Map();

    Logger.info('ServiceLocator', 'Instance created');
  }

  /**
   * Register a new service
   * @param {String} serviceName - Name of the service
   * @param {Object} serviceInstance - Service implementation object
   * @returns {Boolean} Whether registration was successful
   */
  registerService(serviceName, serviceInstance) {
    if (!serviceName || !serviceInstance) {
      Logger.error('ServiceLocator', 'Cannot register service: Missing name or instance');
      return false;
    }

    if (this._services.has(serviceName)) {
      Logger.warning('ServiceLocator', `Service '${serviceName}' already registered, overwriting`);
    }

    this._services.set(serviceName, serviceInstance);
    Logger.info('ServiceLocator', `Registered service: ${serviceName}`);
    return true;
  }

  /**
   * Remove a service from the registry
   * @param {String} serviceName - Name of the service to unregister
   * @returns {Boolean} Whether unregistration was successful
   */
  unregisterService(serviceName) {
    if (!this._services.has(serviceName)) {
      Logger.warning('ServiceLocator', `Cannot unregister service '${serviceName}': Not found`);
      return false;
    }

    this._services.delete(serviceName);
    Logger.info('ServiceLocator', `Unregistered service: ${serviceName}`);
    return true;
  }

  /**
   * Get a service by name
   * @param {String} serviceName - Name of the service to retrieve
   * @returns {Object|null} The service instance or null if not found
   */
  getService(serviceName) {
    if (!this._services.has(serviceName)) {
      Logger.warning('ServiceLocator', `Requested service '${serviceName}' not found`);
      return null;
    }

    return this._services.get(serviceName);
  }

  /**
   * Check if a service exists in the registry
   * @param {String} serviceName - Name of the service to check
   * @returns {Boolean} Whether the service exists
   */
  hasService(serviceName) {
    return this._services.has(serviceName);
  }

  /**
   * Get a list of all registered service names
   * @returns {Array<String>} List of service names
   */
  getServiceNames() {
    return Array.from(this._services.keys());
  }
}