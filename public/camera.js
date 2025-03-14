
/**
 * camera.js - Camera management system for Beast Tactics
 * 
 * Handles camera initialization, movement, rotation, zooming and constraints
 * This module encapsulates all camera-related functionality to keep game.js cleaner
 */

// Import THREE.js with consistent CDN path
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js";

// Debug flag for verbose logging
const DEBUG = true;

/**
 * CameraManager class to handle all camera operations
 */
export class CameraManager {
  constructor(scene) {
    console.log("[CAMERA] Initializing CameraManager");
    
    this.scene = scene;
    
    // Camera default settings
    this.settings = {
      fov: 75,
      aspect: window.innerWidth / window.innerHeight,
      near: 0.1,
      far: 1000,
      defaultPosition: new THREE.Vector3(0, 30, 10),
      defaultTarget: new THREE.Vector3(0, 0, 0),
      panSensitivity: 0.003,
      rotateSensitivity: 0.005,
      zoomSensitivity: 0.01,
      minZoom: 5,
      maxZoom: 50,
      constraints: {
        minPolarAngle: 0.1,           // Minimum angle (rad) - close to top-down
        maxPolarAngle: Math.PI * 0.45, // Maximum angle (rad) - stricter to prevent looking from below
        minAzimuthAngle: -Infinity,    // No constraint on horizontal rotation
        maxAzimuthAngle: Infinity      // No constraint on horizontal rotation
      }
    };
    
    // Create the camera
    this.camera = new THREE.PerspectiveCamera(
      this.settings.fov,
      this.settings.aspect,
      this.settings.near,
      this.settings.far
    );
    
    // Camera target (what the camera looks at)
    this.target = this.settings.defaultTarget.clone();
    
    // Mouse state for tracking user input
    this.mouseState = {
      leftDragging: false,   // For panning
      rightDragging: false,  // For camera angle rotation
      lastX: 0,
      lastY: 0
    };
    
    // Initialize camera position and orientation
    this.resetCamera();
    
    // Set up event listeners
    this._setupEventListeners();
    
    console.log("[CAMERA] CameraManager initialized with settings:", {
      position: this.camera.position.toArray().map(v => v.toFixed(1)),
      target: this.target.toArray().map(v => v.toFixed(1)),
      fov: this.settings.fov
    });
  }
  
  /**
   * Reset camera to default position and orientation
   */
  resetCamera() {
    console.log("[CAMERA] Resetting camera to default position");
    this.camera.position.copy(this.settings.defaultPosition);
    this.target.copy(this.settings.defaultTarget);
    this.camera.lookAt(this.target);
  }
  
  /**
   * Update camera aspect ratio on window resize
   */
  updateAspect(width, height) {
    console.log("[CAMERA] Updating camera aspect ratio:", { width, height });
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
  
  /**
   * Debug log camera actions when debug mode is enabled
   * @param {string} action - The camera action being performed
   * @param {Object} data - Additional data to log
   */
  _logCameraAction(action, data = null) {
    if (!DEBUG) return;
    if (data) {
      console.log(`[CAMERA] ${action}`, data);
    } else {
      console.log(`[CAMERA] ${action}`);
    }
  }
  
  /**
   * Handle camera panning (middle mouse button / left drag)
   * @param {number} deltaX - Mouse X movement
   * @param {number} deltaY - Mouse Y movement
   */
  pan(deltaX, deltaY) {
    // Calculate the camera's right and forward vectors
    // For camera-relative panning that respects rotation
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0; // Keep movement in the horizontal plane
    cameraDirection.normalize();
    
    // Camera right vector (perpendicular to direction)
    const cameraRight = new THREE.Vector3(-cameraDirection.z, 0, cameraDirection.x);
    
    // Scale the movement based on camera height
    const moveFactor = this.settings.panSensitivity * this.camera.position.y;
    
    // Calculate movement vectors (negative to create natural "grab world" feel)
    const moveRight = cameraRight.multiplyScalar(-deltaX * moveFactor);
    const moveForward = cameraDirection.multiplyScalar(deltaY * moveFactor);
    
    // Create combined movement vector
    const movement = new THREE.Vector3().addVectors(moveRight, moveForward);
    
    // Apply movement to both camera and target
    this.camera.position.add(movement);
    this.target.add(movement);
    
    // Update camera orientation
    this.camera.lookAt(this.target);
    
    // Debug logging for significant movements
    if (Math.abs(deltaX) + Math.abs(deltaY) > 20) {
      this._logCameraAction("Panning camera", {
        deltaX,
        deltaY,
        newPos: {
          x: this.camera.position.x.toFixed(1),
          y: this.camera.position.y.toFixed(1),
          z: this.camera.position.z.toFixed(1),
        },
        moveVector: {
          x: movement.x.toFixed(2),
          y: movement.y.toFixed(2), 
          z: movement.z.toFixed(2)
        }
      });
    }
    
    return movement;
  }
  
  /**
   * Handle camera rotation (right mouse button)
   * @param {number} deltaX - Mouse X movement
   * @param {number} deltaY - Mouse Y movement
   */
  rotate(deltaX, deltaY) {
    // Orbit the camera around the target point
    const theta = deltaX * this.settings.rotateSensitivity; // Horizontal rotation
    const phi = deltaY * this.settings.rotateSensitivity; // Vertical rotation

    // Get current camera vector from target
    const offset = new THREE.Vector3().subVectors(
      this.camera.position,
      this.target
    );

    // Convert to spherical coordinates
    const radius = offset.length();
    
    // Use THREE.js Spherical for more reliable angle calculations
    const spherical = new THREE.Spherical();
    spherical.setFromVector3(offset);
    
    // Apply rotations to the spherical coordinates
    spherical.theta -= theta; // Horizontal
    spherical.phi += phi;     // Vertical
    
    // Apply constraints to polar (phi) angle
    const constraints = this.settings.constraints;
    
    // Fix the constraint logic by properly clamping spherical.phi
    if (spherical.phi < constraints.minPolarAngle) {
      this._logCameraAction("Constraint applied - minimum polar angle", {
        requested: (spherical.phi * 180/Math.PI).toFixed(1),
        constrained: (constraints.minPolarAngle * 180/Math.PI).toFixed(1)
      });
      spherical.phi = constraints.minPolarAngle;
    }
    
    if (spherical.phi > constraints.maxPolarAngle) {
      this._logCameraAction("Constraint applied - maximum polar angle", {
        requested: (spherical.phi * 180/Math.PI).toFixed(1),
        constrained: (constraints.maxPolarAngle * 180/Math.PI).toFixed(1)
      });
      spherical.phi = constraints.maxPolarAngle;
    }
    
    // Apply constraints to azimuthal (theta) angle if they exist
    if (constraints.minAzimuthAngle > -Infinity) {
      spherical.theta = Math.max(spherical.theta, constraints.minAzimuthAngle);
    }
    
    if (constraints.maxAzimuthAngle < Infinity) {
      spherical.theta = Math.min(spherical.theta, constraints.maxAzimuthAngle);
    }
    
    // Ensure radius stays constant
    spherical.radius = radius;
    
    // Convert back to Cartesian coordinates
    offset.setFromSpherical(spherical);
    
    // Update camera position
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);

    if (Math.abs(deltaX) + Math.abs(deltaY) > 20) {
      this._logCameraAction("Rotating camera", {
        deltaX,
        deltaY,
        rotation: {
          azimuth: ((spherical.theta * 180) / Math.PI).toFixed(1),
          polar: ((spherical.phi * 180) / Math.PI).toFixed(1),
        },
      });
    }
  }
  
  /**
   * Handle camera zooming (mouse wheel)
   * @param {number} deltaY - Mouse wheel delta
   */
  zoom(deltaY) {
    // Determine zoom direction and calculate new position
    const zoomAmount = deltaY * this.settings.zoomSensitivity;

    // Get direction vector from camera to target
    const direction = new THREE.Vector3().subVectors(
      this.camera.position,
      this.target
    );

    // Scale the direction vector based on zoom
    const scaleFactor = 1 + zoomAmount / direction.length();
    direction.multiplyScalar(scaleFactor);

    // Calculate new camera position
    const newPosition = new THREE.Vector3()
      .copy(this.target)
      .add(direction);

    // Enforce zoom limits
    if (
      newPosition.y > this.settings.minZoom &&
      newPosition.y < this.settings.maxZoom
    ) {
      this.camera.position.copy(newPosition);
      this._logCameraAction("Zooming camera", {
        delta: deltaY,
        distance: direction.length().toFixed(1),
      });
    }
  }
  
  /**
   * Set up all event listeners for camera controls
   */
  _setupEventListeners() {
    // Mouse down handler to start drag
    window.addEventListener("mousedown", (event) => {
      if (event.button === 1) {
        // Middle mouse button for panning
        this.mouseState.leftDragging = true;
        this.mouseState.lastX = event.clientX;
        this.mouseState.lastY = event.clientY;
        this._logCameraAction("Pan started", { x: event.clientX, y: event.clientY });
        event.preventDefault(); // Prevent default browser behavior
      } else if (event.button === 2) {
        // Right mouse button for rotation
        this.mouseState.rightDragging = true;
        this.mouseState.lastX = event.clientX;
        this.mouseState.lastY = event.clientY;
        this._logCameraAction("Rotation started", {
          x: event.clientX,
          y: event.clientY,
        });
        event.preventDefault(); // Prevent default context menu
      }
    });

    // Prevent context menu on right click
    window.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });

    // Mouse move handler for dragging
    window.addEventListener("mousemove", (event) => {
      // Calculate how much the mouse has moved
      const deltaX = event.clientX - this.mouseState.lastX;
      const deltaY = event.clientY - this.mouseState.lastY;

      // Handle panning (middle mouse button)
      if (this.mouseState.leftDragging) {
        this.pan(deltaX, deltaY);
      }

      // Handle camera rotation (right mouse button)
      if (this.mouseState.rightDragging) {
        this.rotate(deltaX, deltaY);
      }

      // Update last position
      this.mouseState.lastX = event.clientX;
      this.mouseState.lastY = event.clientY;
    });

    // Mouse up handler to end drag
    window.addEventListener("mouseup", (event) => {
      if (event.button === 1) {
        this.mouseState.leftDragging = false;
        this._logCameraAction("Pan ended", null);
      } else if (event.button === 2) {
        this.mouseState.rightDragging = false;
        this._logCameraAction("Rotation ended", null);
      }
    });

    // Mouse wheel handler for zoom
    window.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault(); // Prevent default scroll
        this.zoom(event.deltaY);
      },
      { passive: false }
    ); // Important for preventing scroll
  }
  
  /**
   * Update constraint settings
   * @param {Object} newConstraints - New constraints to apply
   */
  updateConstraints(newConstraints) {
    console.log("[CAMERA] Updating constraints:", newConstraints);
    this.settings.constraints = { ...this.settings.constraints, ...newConstraints };
  }
  
  /**
   * Update sensitivity settings
   * @param {Object} newSettings - New sensitivity settings
   */
  updateSensitivity(newSettings) {
    console.log("[CAMERA] Updating sensitivity settings:", newSettings);
    if (newSettings.panSensitivity !== undefined) {
      this.settings.panSensitivity = newSettings.panSensitivity;
    }
    if (newSettings.rotateSensitivity !== undefined) {
      this.settings.rotateSensitivity = newSettings.rotateSensitivity;
    }
    if (newSettings.zoomSensitivity !== undefined) {
      this.settings.zoomSensitivity = newSettings.zoomSensitivity;
    }
  }
}
