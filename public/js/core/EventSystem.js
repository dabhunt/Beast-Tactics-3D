
/**
 * EventSystem.js
 * Event system for game-wide communication
 * Handles event subscription, unsubscription, and triggering
 */

import { Logger } from '../utils/Logger.js';

export class EventSystem {
  constructor() {
    console.log('EventSystem: Initializing event system...');
    
    // Map of event types to arrays of listener callbacks
    this._listeners = new Map();
    
    // For tracking event statistics
    this._eventStats = {
      totalTriggered: 0,
      byType: {}
    };
    
    Logger.info('EventSystem', 'Instance created');
  }
  
  /**
   * Initialize the event system
   * @returns {Promise} Resolves when initialization is complete
   */
  async initialize() {
    Logger.info('EventSystem', 'Initializing event system');
    
    // Pre-register common event types for efficiency
    this._registerCommonEvents();
    
    Logger.info('EventSystem', 'Event system initialized');
    return true;
  }
  
  /**
   * Pre-register common event types
   * @private
   */
  _registerCommonEvents() {
    const commonEvents = [
      'onGameInitialized',
      'onGameStart',
      'onGameEnd',
      'onStateChange',
      'onTurnBegin',
      'onTurnEnd',
      'onBeastMove',
      'onCombat',
      'onBeastDestroyed',
      'onBeastLevelUp',
      'onBiomeRevealed',
      'onWeatherChange',
      'onShardCollected',
      'onBiomeTransformed'
    ];
    
    commonEvents.forEach(eventType => {
      this._listeners.set(eventType, []);
      this._eventStats.byType[eventType] = 0;
    });
    
    Logger.debug('EventSystem', `Pre-registered ${commonEvents.length} common event types`);
  }
  
  /**
   * Register a listener for a specific event type
   * @param {String} eventType - Type of event to listen for
   * @param {Function} callback - Function to call when event occurs
   * @param {Number} priority - Priority level (higher = called earlier)
   * @returns {Object} Listener reference for unregistering
   */
  registerListener(eventType, callback, priority = 0) {
    if (typeof callback !== 'function') {
      Logger.error('EventSystem', 'Cannot register listener: callback is not a function');
      return null;
    }
    
    // Create listeners array for this event type if it doesn't exist
    if (!this._listeners.has(eventType)) {
      this._listeners.set(eventType, []);
      this._eventStats.byType[eventType] = 0;
      Logger.debug('EventSystem', `Created new event type: ${eventType}`);
    }
    
    // Create listener object with priority
    const listener = {
      callback,
      priority,
      id: Date.now() + Math.random().toString(36).substr(2, 9)
    };
    
    // Add to listeners array
    this._listeners.get(eventType).push(listener);
    
    // Sort by priority (higher priority first)
    this._listeners.get(eventType).sort((a, b) => b.priority - a.priority);
    
    Logger.debug('EventSystem', `Registered listener for ${eventType} with priority ${priority}`);
    
    // Return reference that can be used to unregister
    return {
      eventType,
      id: listener.id
    };
  }
  
  /**
   * Unregister a previously registered event listener
   * @param {Object} listenerRef - Reference returned from registerListener
   * @returns {Boolean} Whether unregistration was successful
   */
  unregisterListener(listenerRef) {
    if (!listenerRef || !listenerRef.eventType || !listenerRef.id) {
      Logger.warning('EventSystem', 'Cannot unregister listener: invalid reference');
      return false;
    }
    
    const { eventType, id } = listenerRef;
    
    // Check if this event type exists
    if (!this._listeners.has(eventType)) {
      Logger.warning('EventSystem', `Cannot unregister listener: event type ${eventType} not found`);
      return false;
    }
    
    // Find and remove the listener
    const listeners = this._listeners.get(eventType);
    const initialLength = listeners.length;
    
    const filteredListeners = listeners.filter(listener => listener.id !== id);
    
    // Update listeners for this event type
    this._listeners.set(eventType, filteredListeners);
    
    const removed = initialLength > filteredListeners.length;
    if (removed) {
      Logger.debug('EventSystem', `Unregistered listener for ${eventType}`);
    } else {
      Logger.warning('EventSystem', `Listener for ${eventType} with id ${id} not found`);
    }
    
    return removed;
  }
  
  /**
   * Unregister all listeners for a specific event type
   * @param {String} eventType - Event type to clear listeners for
   * @returns {Number} Number of listeners that were removed
   */
  unregisterAllListeners(eventType) {
    if (!this._listeners.has(eventType)) {
      return 0;
    }
    
    const count = this._listeners.get(eventType).length;
    this._listeners.set(eventType, []);
    
    Logger.debug('EventSystem', `Unregistered all ${count} listeners for ${eventType}`);
    return count;
  }
  
  /**
   * Trigger an event, notifying all registered listeners
   * @param {String} eventType - Type of event to trigger
   * @param {Object} data - Event data to pass to listeners
   * @returns {Boolean} Whether any listeners were notified
   */
  triggerEvent(eventType, data = {}) {
    // Check if this event type exists and has listeners
    if (!this._listeners.has(eventType) || this._listeners.get(eventType).length === 0) {
      Logger.debug('EventSystem', `Event triggered but no listeners: ${eventType}`);
      return false;
    }
    
    const listeners = this._listeners.get(eventType);
    
    // Add metadata to event data
    const eventData = {
      ...data,
      _eventType: eventType,
      _timestamp: Date.now()
    };
    
    // Update stats
    this._eventStats.totalTriggered++;
    this._eventStats.byType[eventType] = (this._eventStats.byType[eventType] || 0) + 1;
    
    Logger.debug('EventSystem', `Triggering event: ${eventType} to ${listeners.length} listeners`, eventData);
    
    // Call each listener with the event data
    listeners.forEach(listener => {
      try {
        listener.callback(eventData);
      } catch (error) {
        Logger.error('EventSystem', `Error in event listener for ${eventType}`, error);
        console.error(`Error in event listener for ${eventType}:`, error);
      }
    });
    
    return true;
  }
  
  /**
   * Trigger an event with awaitable callbacks for synchronous processing
   * @param {String} eventType - Type of event to trigger
   * @param {Object} data - Event data to pass to listeners
   * @returns {Promise<Array>} Results from all listeners
   */
  async triggerEventAsync(eventType, data = {}) {
    // Check if this event type exists and has listeners
    if (!this._listeners.has(eventType) || this._listeners.get(eventType).length === 0) {
      Logger.debug('EventSystem', `Async event triggered but no listeners: ${eventType}`);
      return [];
    }
    
    const listeners = this._listeners.get(eventType);
    
    // Add metadata to event data
    const eventData = {
      ...data,
      _eventType: eventType,
      _timestamp: Date.now()
    };
    
    // Update stats
    this._eventStats.totalTriggered++;
    this._eventStats.byType[eventType] = (this._eventStats.byType[eventType] || 0) +.1;
    
    Logger.debug('EventSystem', `Triggering async event: ${eventType} to ${listeners.length} listeners`, eventData);
    
    // Call each listener with the event data and collect results
    const results = [];
    
    for (const listener of listeners) {
      try {
        const result = await Promise.resolve(listener.callback(eventData));
        results.push(result);
      } catch (error) {
        Logger.error('EventSystem', `Error in async event listener for ${eventType}`, error);
        console.error(`Error in async event listener for ${eventType}:`, error);
        results.push(null);
      }
    }
    
    return results;
  }
  
  /**
   * Get event statistics for debugging
   * @returns {Object} Event statistics
   */
  getEventStats() {
    return { ...this._eventStats };
  }
}
