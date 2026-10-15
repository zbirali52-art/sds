/**
 * Aware Cosmic Oceanic Canvas
 * Interactive bioluminescent water ripple & cosmic plankton simulation
 * Generates floating light motes that interact with touch and cursor movements.
 */

class OceanCanvas {
  constructor() {
    this.canvas = document.getElementById('zen-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.ripples = [];
    this.mouse = { x: -1000, y: -1000, active: false };
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Adapt particle count for mobile vs desktop
    const isMobile = window.innerWidth < 768;
    this.maxParticles = isMobile ? 45 : 90;

    this.init();
    this.bindEvents();
    this.animate();
  }

  init() {
    this.resize();
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle());
    }
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  createParticle() {
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.2 - Math.random() * 0.5, // gentle upward oceanic current
      radius: 0.8 + Math.random() * 2.2,
      baseAlpha: 0.15 + Math.random() * 0.55,
      alpha: 0.2,
      pulseSpeed: 0.015 + Math.random() * 0.025,
      pulseOffset: Math.random() * Math.PI * 2,
      color: Math.random() > 0.25 
        ? { r: 56, g: 189, b: 248 }  // Oceanic Cyan
        : (Math.random() > 0.5 ? { r: 0, g: 245, b: 212 } : { r: 245, g: 158, b: 11 }) // Bioluminescent Aqua / Gold
    };
  }

  addRipple(x, y, strength = 1.0) {
    if (this.ripples.length > 8) this.ripples.shift();
    this.ripples.push({
      x,
      y,
      radius: 5,
      maxRadius: 120 * strength,
      alpha: 0.45 * strength,
      speed: 1.8 * strength
    });
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.active = true;
      if (Math.random() < 0.12) {
        this.addRipple(e.clientX, e.clientY, 0.6);
      }
    }, { passive: true });

    window.addEventListener('click', (e) => {
      this.addRipple(e.clientX, e.clientY, 1.2);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        const t = e.touches[0];
        this.mouse.x = t.clientX;
        this.mouse.y = t.clientY;
        this.mouse.active = true;
        if (Math.random() < 0.15) {
          this.addRipple(t.clientX, t.clientY, 0.7);
        }
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.mouse.active = false;
    }, { passive: true });
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const time = Date.now() * 0.001;

    // 1. Draw & Expand Water Ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.radius += rip.speed;
      rip.alpha *= 0.965;

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(56, 189, 248, ${rip.alpha * 0.6})`;
      this.ctx.lineWidth = 1.5;
      this.ctx.shadowColor = 'rgba(0, 245, 212, 0.5)';
      this.ctx.shadowBlur = 8;
      this.ctx.stroke();
      this.ctx.restore();

      if (rip.alpha < 0.01 || rip.radius > rip.maxRadius) {
        this.ripples.splice(i, 1);
      }
    }

    // 2. Draw Bioluminescent Particles
    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      // Mouse repulsion / wake
      if (this.mouse.active) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100 && dist > 0) {
          const force = (100 - dist) / 100;
          p.x += (dx / dist) * force * 1.5;
          p.y += (dy / dist) * force * 1.5;
        }
      }

      // Wrap around bounds
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      // Breathing glow
      const currentAlpha = p.baseAlpha * (0.6 + 0.4 * Math.sin(time * 2.0 + p.pulseOffset));

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${currentAlpha})`;
      this.ctx.shadowColor = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.8)`;
      this.ctx.shadowBlur = p.radius * 4;
      this.ctx.fill();
      this.ctx.restore();
    }

    requestAnimationFrame(() => this.animate());
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.oceanCanvas = new OceanCanvas();
});
