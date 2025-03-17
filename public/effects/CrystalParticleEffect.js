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
            particleCount: 25,          // Number of particles per crystal (increased)
            particleSize: 0.05,         // Size of each particle (slightly larger)
            particleColor: 0xA020F0,    // Color of particles (purple for crystals)
            emissionRate: 0.5,          // Particles emitted per second (increased)
            minLifetime: 1.2,           // Minimum lifetime in seconds
            maxLifetime: 3.0,           // Maximum lifetime in seconds (longer lifespan)
            minVelocity: 0.05,          // Minimum particle velocity (increased)
            maxVelocity: 0.15,          // Maximum particle velocity (increased)
            maxDistance: 0.7,           // Maximum distance particles can travel (increased)
            emitterRadius: 0.2,         // Radius around crystal to emit particles (wider)
            glowIntensity: 1.5,         // Intensity of the particle glow (increased)
            fadeInTime: 0.3,            // Time to fade in particles
            fadeOutTime: 0.5,           // Time to fade out particles
            ...config                   // Override defaults with any provided config
        };
        
        // Track last update time for smooth animation
        this.lastUpdateTime = Date.now();
        
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
    /**
     * Load or create a particle texture for the sparkle effect
     * @private
     */
    _loadParticleTexture() {
        console.log('[CRYSTAL-PARTICLES] Creating high-visibility purple particle texture');
        
        try {
            // Create a canvas to generate a custom particle texture with higher resolution
            const canvas = document.createElement('canvas');
            canvas.width = 64;  // Increased resolution for better detail
            canvas.height = 64;
            
            const context = canvas.getContext('2d');
            
            // Fill with black first to ensure transparency works correctly
            context.fillStyle = 'rgba(0,0,0,0)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            // Create a radial gradient for an intense, sparkling particle
            const gradient = context.createRadialGradient(
                canvas.width / 2, 
                canvas.height / 2, 
                0, 
                canvas.width / 2, 
                canvas.height / 2, 
                canvas.width / 2
            );
            
            // Define gradient colors for a more intense purple sparkle effect
            // Using much brighter colors with higher contrast
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');      // Pure white center for intensity
            gradient.addColorStop(0.1, 'rgba(250, 230, 255, 1.0)');    // Near-white with slight purple tint
            gradient.addColorStop(0.2, 'rgba(220, 180, 255, 0.95)');   // Light purple
            gradient.addColorStop(0.4, 'rgba(180, 100, 255, 0.9)');    // Medium purple
            gradient.addColorStop(0.6, 'rgba(150, 50, 220, 0.7)');     // Deep purple
            gradient.addColorStop(0.8, 'rgba(120, 20, 180, 0.3)');     // Dark purple with some transparency
            gradient.addColorStop(1.0, 'rgba(100, 0, 150, 0.0)');      // Fully transparent edge
            
            // Fill the canvas with the gradient
            context.fillStyle = gradient;
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add a secondary glow/sparkle effect
            // Draw some radiating lines for a starburst effect
            context.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            context.lineWidth = 1;
            
            // Draw starbursts coming out from the center
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const rays = 8; // Number of rays in the starburst
            
            for (let i = 0; i < rays; i++) {
                const angle = (Math.PI * 2) * (i / rays);
                const rayLength = canvas.width * 0.4; // Ray extends 40% from center
                
                context.beginPath();
                context.moveTo(centerX, centerY);
                context.lineTo(
                    centerX + Math.cos(angle) * rayLength,
                    centerY + Math.sin(angle) * rayLength
                );
                context.stroke();
            }
            
            // Create a texture from the canvas
            this.particleTexture = new this.THREE.CanvasTexture(canvas);
            
            // Important: set these properties for better texture appearance
            this.particleTexture.needsUpdate = true;
            this.particleTexture.minFilter = this.THREE.LinearFilter;
            this.particleTexture.magFilter = this.THREE.LinearFilter;
            this.particleTexture.generateMipmaps = false; // Important for alpha textures
            
            console.log('[CRYSTAL-PARTICLES] Enhanced particle texture created successfully');
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
                // Randomize emission point within a radius of the crystal
                // Use more varied positions around the crystal
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * this.config.emitterRadius;
                
                // Distribute particles all around the crystal, not just at bottom
                const height = -0.3 + Math.random() * 0.6; // From lower to higher than crystal
                
                const px = position.x + Math.cos(angle) * radius;
                const py = position.y + height;
                const pz = position.z + Math.sin(angle) * radius;
                
                // Set position
                positions[i * 3] = px;
                positions[i * 3 + 1] = py;
                positions[i * 3 + 2] = pz;
                
                // Get crystal configuration for spread and speed
                const spreadMultiplier = crystal.userData.particleSpread || 
                                        this.config.particleSpread || 0.3;
                                        
                const speedMultiplier = crystal.userData.particleSpeedMultiplier || 
                                       this.config.particleSpeedMultiplier || 1.0;
                
                // Determine base speed with the multiplier applied
                const baseSpeed = (this.config.minVelocity + Math.random() * 
                                 (this.config.maxVelocity - this.config.minVelocity)) * speedMultiplier;
                
                // Log once in a while for debugging
                if (i === 0) {
                    console.log(`[CRYSTAL-PARTICLES] Creating particles with spread: ${spreadMultiplier}, speed: ${speedMultiplier}`);
                }
                              
                // Create more dynamic movement patterns - 3 types of particles
                // 1. Orbital particles (40%)
                // 2. Rising particles (30%)
                // 3. Falling particles (30%)
                const particleType = Math.random();
                
                let vx, vy, vz;
                
                if (particleType < 0.4) {
                    // TYPE 1: Orbital motion around the crystal
                    const orbitAngle = angle + Math.PI/2; // Perpendicular to radius for orbital motion
                    const orbitSpeed = baseSpeed * 0.6;
                    
                    vx = Math.cos(orbitAngle) * orbitSpeed;
                    vy = (Math.random() - 0.3) * baseSpeed * 0.3; // Slight vertical motion
                    vz = Math.sin(orbitAngle) * orbitSpeed;
                } 
                else if (particleType < 0.7) {
                    // TYPE 2: Rising particles (faster upward)
                    vx = (Math.random() - 0.5) * baseSpeed * spreadMultiplier;
                    vy = baseSpeed * 1.2; // Faster upward motion
                    vz = (Math.random() - 0.5) * baseSpeed * spreadMultiplier;
                }
                else {
                    // TYPE 3: Falling particles (slower downward)
                    vx = (Math.random() - 0.5) * baseSpeed * spreadMultiplier;
                    vy = -baseSpeed * 0.4; // Slower downward motion
                    vz = (Math.random() - 0.5) * baseSpeed * spreadMultiplier;
                }
                
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
            
            // Get any additional configuration passed from CrystalShardManager
            const intensityMultiplier = crystal.userData.particleIntensity || 
                                      this.config.glowIntensity || 1.0;
            
            // Debug log the intensity being used
            console.log(`[CRYSTAL-PARTICLES] Creating particles with intensity: ${intensityMultiplier}`);
            
            // Create material for the particles with enhanced sparkle and glow
            const material = new this.THREE.PointsMaterial({
                color: this.config.particleColor,
                size: this.config.particleSize,
                transparent: true,
                opacity: 1.0,                // Full opacity for stronger effect
                alphaTest: 0.1,              // Helps with transparency rendering
                depthWrite: false,           // Prevents particles from hiding each other
                depthTest: true,             
                blending: this.THREE.AdditiveBlending, // Additive for bright glow when overlapping
                map: this.particleTexture,
                sizeAttenuation: true        // Size changes with distance for 3D effect
            });
            
            // Log the material configuration
            console.log('[CRYSTAL-PARTICLES] Particle material created with:', {
                color: '#' + this.config.particleColor.toString(16).padStart(6, '0'),
                size: this.config.particleSize,
                blending: material.blending === this.THREE.AdditiveBlending ? 'Additive' : 'Normal'
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
    /**
     * Update all particle systems for animation
     * @param {number} deltaTime - Time elapsed since last update in seconds
     */
    update(deltaTime) {
        if (this.particleSystems.length === 0) {
            // No particle systems to update
            return;
        }
        
        // Ensure we have a valid deltaTime to prevent animation issues
        if (!deltaTime || isNaN(deltaTime) || deltaTime > 1) {
            // If deltaTime is invalid, calculate it from elapsed time
            const now = Date.now();
            deltaTime = (now - this.lastUpdateTime) / 1000;
            this.lastUpdateTime = now;
            
            // Still validate it's reasonable
            if (deltaTime > 0.1) deltaTime = 0.016; // Cap at ~60fps for large jumps
        } else {
            // Track last update time
            this.lastUpdateTime = Date.now();
        }
        
        // Log performance metrics periodically
        if (Math.random() < 0.005) { // Reduced to log less frequently (every ~200 frames)
            console.log(`[CRYSTAL-PARTICLES] Updating ${this.particleSystems.length} particle systems`, {
                deltaTime: deltaTime.toFixed(4) + 's',
                fps: (1/deltaTime).toFixed(1),
                particleCount: this.particleSystems.length * this.config.particleCount
            });
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
                
                // Add a more dynamic animation system based on particle lifetime
                const lifeStage = lifetimes[lifeIdx] / lifetimes[lifeIdx + 1]; // 0-1 range representing life progress
                const crystal = system.userData.crystal;
                
                if (crystal && crystal.position) {
                    // Calculate vector from crystal center to particle
                    const dx = positions[posIdx] - crystal.position.x;
                    const dy = positions[posIdx + 1] - crystal.position.y;
                    const dz = positions[posIdx + 2] - crystal.position.z;
                    const distanceFromCenter = Math.sqrt(dx*dx + dz*dz);
                    
                    // Get direction to center for creating attractive/repulsive forces
                    let dirX = 0, dirZ = 0;
                    if (distanceFromCenter > 0.001) {
                        dirX = dx / distanceFromCenter;
                        dirZ = dz / distanceFromCenter;
                    }
                    
                    // Different behavior based on particle lifetime stage
                    if (lifeStage < 0.3) {
                        // PHASE 1: Initial expansion/burst phase
                        // Accelerate outward from crystal
                        const burstFactor = 2.0 * deltaTime * (1 - lifeStage/0.3);
                        velocities[posIdx] += dirX * burstFactor;
                        velocities[posIdx + 2] += dirZ * burstFactor;
                    } 
                    else if (lifeStage < 0.7) {
                        // PHASE 2: Orbital/swirling phase
                        // Calculate angle and apply orbital motion
                        const angle = Math.atan2(dz, dx);
                        const orbitalFactor = 3.0 * deltaTime;
                        
                        // Orbital velocity perpendicular to radius
                        positions[posIdx] += Math.cos(angle + Math.PI/2) * orbitalFactor * distanceFromCenter;
                        positions[posIdx + 2] += Math.sin(angle + Math.PI/2) * orbitalFactor * distanceFromCenter;
                    }
                    else {
                        // PHASE 3: Return to crystal/fade phase
                        // Slowly drift back toward crystal center
                        const attractFactor = deltaTime * 0.8 * (lifeStage - 0.7) / 0.3;
                        positions[posIdx] -= dirX * attractFactor * distanceFromCenter;
                        positions[posIdx + 2] -= dirZ * attractFactor * distanceFromCenter;
                    }
                }
                
                // Add randomized sparkle effect that increases based on life stage
                // More sparkle/jitter as the particle ages
                const sparkleIntensity = 0.3 + lifeStage * 0.7; // Increases over lifetime
                const jitterAmount = deltaTime * sparkleIntensity * 0.5;
                
                positions[posIdx] += (Math.random() - 0.5) * jitterAmount;
                positions[posIdx + 1] += (Math.random() - 0.5) * jitterAmount;
                positions[posIdx + 2] += (Math.random() - 0.5) * jitterAmount;
                
                // Enhanced size/opacity animation over lifetime
                // Calculate opacity based on lifetime with a sharper curve
                let opacity = 1.0;
                let sizeScale = 1.0;
                
                if (lifeRatio < 0.15) {
                    // Quick fade in with size burst
                    opacity = Math.pow(lifeRatio / 0.15, 0.7); // Faster fade in with power curve
                    sizeScale = 0.5 + Math.pow(lifeRatio / 0.15, 0.5) * 1.5; // Grow from 50% to 200%
                } 
                else if (lifeRatio > 0.85) {
                    // Slower fade out with size reduction
                    opacity = Math.pow(1.0 - ((lifeRatio - 0.85) / 0.15), 0.7);
                    sizeScale = 1.0 + (1.0 - Math.pow((lifeRatio - 0.85) / 0.15, 2)) * 0.5; // Shrink from 150% to 100%
                }
                else {
                    // Middle life - pulsate size slightly for sparkle effect
                    const pulseFreq = 5.0; // Higher gives more rapid pulsation
                    const pulseAmp = 0.3;  // Size variation in pulsation
                    sizeScale = 1.0 + Math.sin(lifeRatio * Math.PI * pulseFreq) * pulseAmp;
                }
                
                // Apply the size change with opacity simulation
                const baseSize = sizes[j];
                system.geometry.attributes.size.array[j] = baseSize * sizeScale * opacity;
                
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
        
        // Get configuration from crystal if available
        const spreadMultiplier = crystal.userData.particleSpread || this.config.particleSpread || 0.3;
        const speedMultiplier = crystal.userData.particleSpeedMultiplier || this.config.particleSpeedMultiplier || 1.0;
        
        // Distribute particles in a full sphere around the crystal for more coverage
        const phi = Math.random() * Math.PI * 2; // Horizontal angle (full circle)
        const theta = Math.random() * Math.PI;   // Vertical angle (hemisphere)
        const radius = Math.random() * this.config.emitterRadius * spreadMultiplier;
        
        // Calculate position using spherical coordinates for better distribution
        const posIdx = index * 3;
        positions[posIdx] = crystalPos.x + Math.sin(theta) * Math.cos(phi) * radius;
        positions[posIdx + 1] = crystalPos.y + Math.cos(theta) * radius; // Vertical distribution
        positions[posIdx + 2] = crystalPos.z + Math.sin(theta) * Math.sin(phi) * radius;
        
        // Randomize starting positions more dramatically
        if (Math.random() < 0.3) {
            // 30% of particles start further out
            positions[posIdx] += (Math.random() - 0.5) * radius * 0.5;
            positions[posIdx + 2] += (Math.random() - 0.5) * radius * 0.5;
        }
        
        // Create more varied and dynamic velocities
        const baseSpeed = (this.config.minVelocity + Math.random() * 
                         (this.config.maxVelocity - this.config.minVelocity)) * speedMultiplier;
        
        // Different velocity patterns for visual variety
        const pattern = Math.random();
        
        if (pattern < 0.33) {
            // Pattern 1: Mostly upward motion
            velocities[posIdx] = (Math.random() - 0.5) * baseSpeed * 0.5;
            velocities[posIdx + 1] = baseSpeed * (0.8 + Math.random() * 0.4); // Stronger upward
            velocities[posIdx + 2] = (Math.random() - 0.5) * baseSpeed * 0.5;
        } 
        else if (pattern < 0.66) {
            // Pattern 2: Orbital/spiral motion
            const angle = Math.atan2(
                positions[posIdx + 2] - crystalPos.z,
                positions[posIdx] - crystalPos.x
            );
            velocities[posIdx] = Math.cos(angle + Math.PI/2) * baseSpeed * 0.8;
            velocities[posIdx + 1] = (Math.random() - 0.3) * baseSpeed * 0.4; // Slight vertical
            velocities[posIdx + 2] = Math.sin(angle + Math.PI/2) * baseSpeed * 0.8;
        }
        else {
            // Pattern 3: Explosive outward
            const dx = positions[posIdx] - crystalPos.x;
            const dy = positions[posIdx + 1] - crystalPos.y;
            const dz = positions[posIdx + 2] - crystalPos.z;
            
            // Normalize the direction vector
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 0.001; // Avoid division by zero
            
            velocities[posIdx] = (dx / dist) * baseSpeed * 1.2;
            velocities[posIdx + 1] = (dy / dist) * baseSpeed * 1.2;
            velocities[posIdx + 2] = (dz / dist) * baseSpeed * 1.2;
        }
        
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
