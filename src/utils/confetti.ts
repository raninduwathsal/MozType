/**
 * Lightweight zero-dependency canvas confetti effect for celebrating Personal Bests
 */
export function triggerConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '999999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    document.body.removeChild(canvas);
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const colors = ['#e2b714', '#00fff5', '#ff007f', '#06d6a0', '#bd93f9', '#ffffff', '#ff7e67'];
  const particleCount = 120;
  const particles: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    vx: number;
    vy: number;
    angle: number;
    angularVelocity: number;
    color: string;
    opacity: number;
  }> = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: width * 0.5 + (Math.random() * 200 - 100),
      y: height * 0.4 + (Math.random() * 100 - 50),
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 3,
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -12 - 4,
      angle: Math.random() * Math.PI * 2,
      angularVelocity: (Math.random() - 0.5) * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 1
    });
  }

  let animationFrameId: number;
  const startTime = performance.now();

  function render(time: number) {
    const elapsed = time - startTime;
    ctx?.clearRect(0, 0, width, height);

    let activeCount = 0;
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25; // gravity
      p.vx *= 0.98; // air resistance
      p.angle += p.angularVelocity;

      if (elapsed > 1800) {
        p.opacity = Math.max(0, 1 - (elapsed - 1800) / 1000);
      }

      if (p.opacity > 0 && p.y < height + 50) {
        activeCount++;
        ctx?.save();
        ctx?.translate(p.x, p.y);
        ctx?.rotate(p.angle);
        ctx!.fillStyle = p.color;
        ctx!.globalAlpha = p.opacity;
        ctx?.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx?.restore();
      }
    });

    if (activeCount > 0 && elapsed < 3200) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
    }
  }

  animationFrameId = requestAnimationFrame(render);
}
