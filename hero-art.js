function drawStarfield(canvas) {
  const context = canvas.getContext("2d");
  if (!context) return;

  function render() {
    const { width, height } = canvas.getBoundingClientRect();
    const scale = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.scale(scale, scale);

    // Use the same sky whenever the viewport is resized.
    let seed = 4721;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    const count = Math.round(width * height / 3200);
    for (let index = 0; index < count; index++) {
      const x = random() * width;
      const y = random() * height;
      const brightness = random();
      const radius = 0.35 + brightness ** 3 * 0.85;
      const color = index % 9 === 0 ? "197, 137, 232" : "255, 255, 255";
      const opacity = (0.14 + brightness ** 2 * 0.72) * (0.62 + 0.38 * x / width);

      if (brightness > 0.94) {
        const halo = radius * 7;
        const glow = context.createRadialGradient(x, y, 0, x, y, halo);
        glow.addColorStop(0, `rgba(${color}, .46)`);
        glow.addColorStop(0.34, `rgba(${color}, .14)`);
        glow.addColorStop(1, `rgba(${color}, 0)`);
        context.fillStyle = glow;
        context.fillRect(x - halo, y - halo, 2 * halo, 2 * halo);
      }

      context.fillStyle = `rgba(${color}, ${opacity})`;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
  }

  new ResizeObserver(render).observe(canvas);
}

drawStarfield(document.querySelector(".space-field"));
