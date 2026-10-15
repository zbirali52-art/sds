/**
 * CanvasBackground: Interactive Living Cosmos & Sacred Geometry Engine
 * High-performance 60fps moving background with interactive stardust filaments,
 * rotating sacred geometry (Flower of Life / Metatron / Sri Yantra wireframe),
 * and breath-synchronized cosmic ripples.
 */
class CosmicZenCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.numParticles = window.innerWidth < 768 ? 45 : 85;
    this.mouse = { x: -1000, y: -1000, radius: 140 };
    this.angle = 0;
    this.pulse = 0;
    this.pulseSpeed = 0.015;
    this.activeTheme = 'cosmic'; // 'cosmic' | 'gold' | 'emerald'
    this.isRunning = true;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    });

    // Populate particles
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push(this.createParticle());
    }

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  createParticle() {
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 2.2 + 0.8,
      baseRadius: Math.random() * 2.2 + 0.8,
      alpha: Math.random() * 0.6 + 0.2,
      pulseOffset: Math.random() * Math.PI * 2,
      colorRgb: Math.random() > 0.4 ? '0, 245, 212' : '121, 40, 202'
    };
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
  }

  setTheme(theme) {
    this.activeTheme = theme;
  }

  drawSacredGeometry(cx, cy, radius, rotation, breathScale) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.scale(breathScale, breathScale);

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.4);
    grad.addColorStop(0, 'rgba(0, 245, 212, 0.25)');
    grad.addColorStop(0.5, 'rgba(121, 40, 202, 0.12)');
    grad.addColorStop(1, 'rgba(10, 11, 20, 0)');

    // Ambient radial glow behind geometry
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Outer Concentric Rings
    ctx.strokeStyle = 'rgba(0, 245, 212, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(121, 40, 202, 0.22)';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 183, 3, 0.15)';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.42, 0, Math.PI * 2);
    ctx.stroke();

    // 12-Fold Sacred Flower of Life nodes
    const petals = 12;
    for (let i = 0; i < petals; i++) {
      const a = (i * Math.PI * 2) / petals;
      const x = Math.cos(a) * (radius * 0.55);
      const y = Math.sin(a) * (radius * 0.55);

      ctx.strokeStyle = (i % 2 === 0) ? 'rgba(0, 245, 212, 0.12)' : 'rgba(255, 183, 3, 0.10)';
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.55, 0, Math.PI * 2);
      ctx.stroke();

      // Delicate ray from center to perimeter
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
      ctx.stroke();
    }

    // Interlaced sacred triangles (Merkaba / Star of David)
    ctx.strokeStyle = 'rgba(0, 245, 212, 0.28)';
    ctx.lineWidth = 1.2;
    this.drawPolygon(ctx, 0, 0, radius * 0.82, 3, -Math.PI / 2);
    ctx.strokeStyle = 'rgba(247, 37, 133, 0.25)';
    this.drawPolygon(ctx, 0, 0, radius * 0.82, 3, Math.PI / 2);

    // Inner dodecagram
    ctx.strokeStyle = 'rgba(255, 183, 3, 0.25)';
    this.drawPolygon(ctx, 0, 0, radius * 0.35, 6, 0);

    // Center stillness nucleus
    ctx.fillStyle = 'rgba(0, 245, 212, 0.7)';
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawPolygon(ctx, x, y, radius, sides, startAngle) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = startAngle + (i * 2 * Math.PI) / sides;
      const px = x + radius * Math.cos(a);
      const py = y + radius * Math.sin(a);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }

  animate() {
    if (!this.isRunning) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.angle += 0.0018;
    this.pulse += this.pulseSpeed;
    const breathScale = 1 + Math.sin(this.pulse) * 0.06;

    // Draw Sacred Geometry in center
    const geomRadius = Math.min(this.canvas.width, this.canvas.height) * 0.36;
    this.drawSacredGeometry(this.centerX, this.centerY, geomRadius, this.angle, breathScale);

    // Animate and render interactive particles & filaments
    const pts = this.particles;
    const maxDist = 110;

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Wrap edges
      if (p.x < -10) p.x = this.canvas.width + 10;
      if (p.x > this.canvas.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.canvas.height + 10;
      if (p.y > this.canvas.height + 10) p.y = -10;

      // Mouse gentle interaction
      const dxMouse = this.mouse.x - p.x;
      const dyMouse = this.mouse.y - p.y;
      const distMouse = Math.hypot(dxMouse, dyMouse);
      if (distMouse < this.mouse.radius && distMouse > 0) {
        const force = (1 - distMouse / this.mouse.radius) * 1.5;
        p.x -= (dxMouse / distMouse) * force;
        p.y -= (dyMouse / distMouse) * force;
      }

      // Draw particle
      const pAlpha = p.alpha * (0.6 + 0.4 * Math.sin(this.pulse + p.pulseOffset));
      this.ctx.fillStyle = `rgba(${p.colorRgb}, ${pAlpha})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Inter-particle glowing filaments
      for (let j = i + 1; j < pts.length; j++) {
        const p2 = pts[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.hypot(dx, dy);

        if (dist < maxDist) {
          const lineAlpha = (1 - dist / maxDist) * 0.16;
          this.ctx.strokeStyle = `rgba(0, 245, 212, ${lineAlpha})`;
          this.ctx.lineWidth = 0.7;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }

    requestAnimationFrame(this.animate);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.cosmicZenCanvas = new CosmicZenCanvas('zen-canvas');
});
