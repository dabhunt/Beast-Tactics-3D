/**
 * CrystalParticleEffect.js
 * Creates sparkling particle effects for crystal shards
 */

export class CrystalParticleEffect {
    /**
     * Creates a new crystal particle effect
     * @param {Object} THREE - THREE.js library reference
     * @param {Object} scene - THREE.js scene to add particles to
     * @param {Object} config - Configuration options
     */
    constructor(THREE, scene, config = {}) {
        console.log('[CRYSTAL-PARTICLES] Initializing Crystal Particle Effect system');
        
        this.THREE = THREE;
        this.scene = scene;
        
        // Default configuration with reasonable values
        this.config = {
            particleCount: 15,          // Number of particles per crystal
            particleSize: 0.04,         // Size of each particle
            particleColor: 0xFFFFFF,    // Color of particles (default: white sparkles)
            emissionRate: 0.3,          // Particles emitted per second
            minLifetime: 1.0,           // Minimum lifetime in seconds
            maxLifetime: 2.5,           // Maximum lifetime in seconds
            minVelocity: 0.02,          // Minimum particle velocity
            maxVelocity: 0.1,           // Maximum particle velocity
            maxDistance: 0.5,           // Maximum distance particles can travel
            emitterRadius: 0.1,         // Radius around crystal to emit particles
            glowIntensity: 1.0,         // Intensity of the particle glow
            ...config                   // Override defaults with any provided config
        };
        
        // Track all active particle systems for updating
        this.particleSystems = [];
        
        // Loading texture for particles
        this.particleTexture = null;
        this._loadParticleTexture();
        
        console.log('[CRYSTAL-PARTICLES] Configuration:', this.config);
    }
    
    /**
     * Load a texture for the particles
     * @private
     */
    _loadParticleTexture() {
        console.log('[CRYSTAL-PARTICLES] Loading particle texture');
        
        try {
            // Create a canvas to generate a custom particle texture
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            
            const context = canvas.getContext('2d');
            
            // Create a radial gradient for a soft, glowing particle
            const gradient = context.createRadialGradient(
                canvas.width / 2, 
                canvas.height / 2, 
                0, 
                canvas.width / 2, 
                canvas.height / 2, 
                canvas.width / 2
            );
            
            // Define gradient colors for a soft glow effect
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
            gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.4, 'rgba(200, 200, 255, 0.5)');
            gradient.addColorStop(1.0, 'rgba(200, 200, 255, 0.0)');
            
            // Fill the canvas with the gradient
            context.fillStyle = gradient;
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            // Create a texture from the canvas
            this.particleTexture = new this.THREE.CanvasTexture(canvas);
            console.log('[CRYSTAL-PARTICLES] Particle texture created successfully');
        } catch (error) {
            console.error('[CRYSTAL-PARTICLES] Error creating particle texture:', error);
            // Create a fallback texture if the custom one fails
            const loader = new this.THREE.TextureLoader();
            this.particleTexture = loader.load(
                '/effects/particle.png',
                () => console.log('[CRYSTAL-PARTICLES] Fallback texture loaded successfully'),
                undefined,
                (err) => console.error('[CRYSTAL-PARTICLES] Failed to load fallback texture:', err)
            );
        }
    }
    
    /**
     * Create particles for a crystal
     * @param {Object} crystal - The crystal object to attach particles to
     * @param {Object} position - Position to center the particles (usually crystal position)
     * @returns {Object} The created particle system
     */
    createParticlesForCrystal(crystal, position) {
        console.log('[CRYSTAL-PARTICLES] Creating particles for crystal at position:', position);
        
        try {
            // Validation checks
            if (!this.THREE || !this.scene) {
                console.error('[CRYSTAL-PARTICLES] THREE.js or scene not available');
                return null;
            }
            
            if (!position || typeof position.x !== 'number') {
                console.error('[CRYSTAL-PARTICLES] Invalid position provided:', position);
                return null;
            }
            
            // Create geometry for particles
            const particles = new this.THREE.BufferGeometry();
            const particleCount = this.config.particleCount;
            
            // Arrays to store particle attributes
            const positions = new Float32Array(particleCount * 3);
            const velocities = new Float32Array(particleCount * 3);
            const lifetimes = new Float32Array(particleCount * 2); // [current, max]
            const delays = new Float32Array(particleCount); // Staggered start times
            const sizes = new Float32Array(particleCount);
            
            // Initialize particles with random values
            for (let i = 0; i < particleCount; i++) {
                // Randomize emission point within a small radius of the crystal
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * this.config.emitterRadius;
                
                const px = position.x + Math.cos(angle) * radius;
                const py = position.y + (Math.random() * 0.3); // Random height within the crystal
                const pz = position.z + Math.sin(angle) * radius;
                
                // Set position
                positions[i * 3] = px;
                positions[i * 3 + 1] = py;
                positions[i * 3 + 2] = pz;
                
                // Set velocity - mostly upward with some random spread
                const vx = (Math.random() - 0.5) * this.config.maxVelocity;
                const vy = this.config.minVelocity + Math.random() * (this.config.maxVelocity - this.config.minVelocity);
                const vz = (Math.random() - 0.5) * this.config.maxVelocity;
                
                velocities[i * 3] = vx;
                velocities[i * 3 + 1] = vy;
                velocities[i * 3 + 2] = vz;
                
                // Set lifetime and delay
                const lifetime = this.config.minLifetime + Math.random() * (this.config.maxLifetime - this.config.minLifetime);
                lifetimes[i * 2] = 0; // Current lifetime
                lifetimes[i * 2 + 1] = lifetime; // Max lifetime
                
                // Stagger start times to make it more natural
                delays[i] = Math.random() * lifetime;
                
                // Random sizes for variety
                sizes[i] = this.config.particleSize * (0.7 + Math.random() * 0.6);
            }
            
            // Add attributes to the geometry
            particles.setAttribute('position', new this.THREE.BufferAttribute(positions, 3));
            particles.setAttribute('velocity', new this.THREE.BufferAttribute(velocities, 3));
            particles.setAttribute('lifetime', new this.THREE.BufferAttribute(lifetimes, 2));
            particles.setAttribute('delay', new this.THREE.BufferAttribute(delays, 1));
            particles.setAttribute('size', new this.THREE.BufferAttribute(sizes, 1));
            
            // Create material for the particles
            const material = new this.THREE.PointsMaterial({
                color: this.config.particleColor,
                size: this.config.particleSize,
                transparent: true,
                opacity: 0.8,
                depthWrite: false,
                blending: this.THREE.AdditiveBlending, // Makes particles glow when they overlap
                vertexColors: false,
                map: this.particleTexture
            });
            
            // Create the particle system
            const particleSystem = new this.THREE.Points(particles, material);
            particleSystem.userData.createdAt = Date.now();
            particleSystem.userData.crystal = crystal;
            
            // Add to the scene and tracking array
            this.scene.add(particleSystem);
            this.particleSystems.push(particleSystem);
            
            console.log(`[CRYSTAL-PARTICLES] Created particle system with ${particleCount} particles`);
            return particleSystem;
        } catch (error) {
            console.error('[CRYSTAL-PARTICLES] Error creating particle system:', error);
            return null;
        }
    }
    
    /**
     * Update all particle systems
     * @param {number} deltaTime - Time elapsed since last update in seconds
     */
    update(deltaTime) {
        if (this.particleSystems.length === 0) return;
        
        // Small optimization to avoid excessive logging
        if (Math.random() < 0.01) {
            console.log(`[CRYSTAL-PARTICLES] Updating ${this.particleSystems.length} particle systems`);
        }
        
        // Update each particle system
        for (let i = 0; i < this.particleSystems.length; i++) {
            const system = this.particleSystems[i];
            
            // Get attributes for updating
            const positions = system.geometry.attributes.position.array;
            const velocities = system.geometry.attributes.velocity.array;
            const lifetimes = system.geometry.attributes.lifetime.array;
            const delays = system.geometry.attributes.delay.array;
            const sizes = system.geometry.attributes.size.array;
            
            let needsUpdate = false;
            
            // Update each particle in this system
            for (let j = 0; j < this.config.particleCount; j++) {
                // Check if this particle should stay inactive (delay)
                if (delays[j] > 0) {
                    delays[j] -= deltaTime;
                    continue;
                }
                
                // Get indices for this particle's attributes
                const posIdx = j * 3;
                const lifeIdx = j * 2;
                
                // Update lifetime
                lifetimes[lifeIdx] += deltaTime;
                
                // If particle has exceeded its maximum lifetime, reset it
                if (lifetimes[lifeIdx] >= lifetimes[lifeIdx + 1]) {
                    this._resetParticle(j, system, positions, velocities, lifetimes, delays, sizes);
                    needsUpdate = true;
                    continue;
                }
                
                // Calculate how far into the lifetime the particle is
                const lifeRatio = lifetimes[lifeIdx] / lifetimes[lifeIdx + 1];
                
                // Update position based on velocity
                positions[posIdx] += velocities[posIdx] * deltaTime;
                positions[posIdx + 1] += velocities[posIdx + 1] * deltaTime;
                positions[posIdx + 2] += velocities[posIdx + 2] * deltaTime;
                
                // Apply some damping to velocity (slow down over time)
                velocities[posIdx] *= 0.99;
                velocities[posIdx + 1] *= 0.99;
                velocities[posIdx + 2] *= 0.99;
                
                // Add a subtle spin effect
                const spinFactor = deltaTime * 0.5;
                const spin = new this.THREE.Vector3(
                    (Math.random() - 0.5) * spinFactor,
                    (Math.random() - 0.5) * spinFactor,
                    (Math.random() - 0.5) * spinFactor
                );
                
                positions[posIdx] += spin.x;
                positions[posIdx + 2] += spin.z;
                
                // Calculate opacity based on lifetime (fade in and out)
                let opacity = 1.0;
                if (lifeRatio < 0.2) {
                    // Fade in
                    opacity = lifeRatio / 0.2;
                } else if (lifeRatio > 0.8) {
                    // Fade out
                    opacity = 1.0 - ((lifeRatio - 0.8) / 0.2);
                }
                
                // Apply the opacity to the particle (using size for now as a trick)
                // Note: THREE.js Points don't support per-particle opacity directly
                // We'll scale the size to simulate opacity changes
                const baseSize = sizes[j];
                system.geometry.attributes.size.array[j] = baseSize * opacity;
                
                needsUpdate = true;
            }
            
            // Update the buffers if needed
            if (needsUpdate) {
                system.geometry.attributes.position.needsUpdate = true;
                system.geometry.attributes.lifetime.needsUpdate = true;
                system.geometry.attributes.delay.needsUpdate = true;
                system.geometry.attributes.size.needsUpdate = true;
            }
        }
    }
    
    /**
     * Reset a particle to its initial state
     * @private
     */
    _resetParticle(index, system, positions, velocities, lifetimes, delays, sizes) {
        // Get the associated crystal position
        const crystal = system.userData.crystal;
        if (!crystal || !crystal.position) {
            console.warn('[CRYSTAL-PARTICLES] Cannot reset particle: crystal reference invalid');
            return;
        }
        
        const crystalPos = crystal.position;
        
        // Reset position to a random point near the crystal
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * this.config.emitterRadius;
        
        const posIdx = index * 3;
        positions[posIdx] = crystalPos.x + Math.cos(angle) * radius;
        positions[posIdx + 1] = crystalPos.y + (Math.random() * 0.3); // Random height within crystal
        positions[posIdx + 2] = crystalPos.z + Math.sin(angle) * radius;
        
        // Reset velocity - mostly upward with some random spread
        velocities[posIdx] = (Math.random() - 0.5) * this.config.maxVelocity;
        velocities[posIdx + 1] = this.config.minVelocity + Math.random() * (this.config.maxVelocity - this.config.minVelocity);
        velocities[posIdx + 2] = (Math.random() - 0.5) * this.config.maxVelocity;
        
        // Reset lifetime
        const lifeIdx = index * 2;
        lifetimes[lifeIdx] = 0;
        lifetimes[lifeIdx + 1] = this.config.minLifetime + Math.random() * (this.config.maxLifetime - this.config.minLifetime);
        
        // Small random delay for staggered emission
        delays[index] = Math.random() * 0.5;
        
        // Random size
        sizes[index] = this.config.particleSize * (0.7 + Math.random() * 0.6);
    }
    
    /**
     * Create particle effects for all crystals in the scene
     * @param {Array} crystals - Array of crystals to add particles to
     */
    createParticlesForAllCrystals(crystals) {
        console.log(`[CRYSTAL-PARTICLES] Creating particles for ${crystals.length} crystals`);
        
        if (!Array.isArray(crystals) || crystals.length === 0) {
            console.warn('[CRYSTAL-PARTICLES] No crystals provided');
            return;
        }
        
        // Create particles for each crystal
        crystals.forEach(crystal => {
            if (crystal && crystal.position) {
                this.createParticlesForCrystal(crystal, crystal.position);
            } else {
                console.warn('[CRYSTAL-PARTICLES] Invalid crystal object:', crystal);
            }
        });
        
        console.log(`[CRYSTAL-PARTICLES] Created ${this.particleSystems.length} particle systems`);
    }
    
    /**
     * Cleanup and dispose of all particle systems
     */
    dispose() {
        console.log(`[CRYSTAL-PARTICLES] Disposing ${this.particleSystems.length} particle systems`);
        
        this.particleSystems.forEach(system => {
            if (system) {
                // Remove from scene
                this.scene.remove(system);
                
                // Dispose of geometry and material
                if (system.geometry) system.geometry.dispose();
                if (system.material) system.material.dispose();
            }
        });
        
        // Clear tracking array
        this.particleSystems = [];
        
        // Dispose of texture
        if (this.particleTexture) {
            this.particleTexture.dispose();
            this.particleTexture = null;
        }
        
        console.log('[CRYSTAL-PARTICLES] All particle systems disposed');
    }
}
