const hero = document.querySelector(".hero");
drawStarfield(document.querySelector(".space-field"));
const bracelet = hero.querySelector(".hero-bracelet");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const tiltInput = window.matchMedia("(hover: hover) and (pointer: fine)");

const pitch = { angle: 0, target: 0, velocity: 0 };
const yaw = { angle: 0, target: 0, velocity: 0 };
let tiltFrame = 0;
let lastTiltTime = 0;

function advanceTilt(axis, elapsed) {
  // A critically damped spring eases into each change and settles without bouncing.
  const rate = 10;
  const offset = axis.angle - axis.target;
  const impulse = axis.velocity + rate * offset;
  const decay = Math.exp(-rate * elapsed);

  axis.angle = axis.target + (offset + impulse * elapsed) * decay;
  axis.velocity = (axis.velocity - rate * impulse * elapsed) * decay;

  if (Math.abs(axis.angle - axis.target) < 0.01 && Math.abs(axis.velocity) < 0.04) {
    axis.angle = axis.target;
    axis.velocity = 0;
  }
}

function animateTilt(time) {
  const elapsed = Math.min((time - lastTiltTime) / 1000, 0.05);
  lastTiltTime = time;
  advanceTilt(pitch, elapsed);
  advanceTilt(yaw, elapsed);
  bracelet.style.setProperty("--bracelet-x", `${pitch.angle}deg`);
  bracelet.style.setProperty("--bracelet-y", `${yaw.angle}deg`);

  const moving = pitch.angle !== pitch.target || yaw.angle !== yaw.target
    || pitch.velocity !== 0 || yaw.velocity !== 0;
  tiltFrame = moving ? requestAnimationFrame(animateTilt) : 0;
}

function aimBracelet(x, y) {
  pitch.target = -y * 10;
  yaw.target = x * 14;

  if (!tiltFrame) {
    lastTiltTime = performance.now();
    tiltFrame = requestAnimationFrame(animateTilt);
  }
}

hero.addEventListener("pointermove", (event) => {
  if (reducedMotion.matches || !tiltInput.matches || event.pointerType !== "mouse") return;

  const bounds = hero.getBoundingClientRect();
  aimBracelet(
    (event.clientX - bounds.left) / bounds.width - 0.5,
    (event.clientY - bounds.top) / bounds.height - 0.5,
  );
});

hero.addEventListener("pointerleave", () => {
  if (!reducedMotion.matches && tiltInput.matches) aimBracelet(0, 0);
});

reducedMotion.addEventListener("change", () => aimBracelet(0, 0));

const shops = document.querySelector("#shops");
let stopScroll;

function scrollToShops(event) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey
    || event.shiftKey || event.altKey) return;

  stopScroll?.();
  if (reducedMotion.matches) return;

  event.preventDefault();
  const start = window.scrollY;
  const gap = Number.parseFloat(getComputedStyle(shops).scrollMarginBlockStart) || 0;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const end = Math.max(0, Math.min(start + shops.getBoundingClientRect().top - gap, maxScroll));
  const distance = end - start;
  const duration = Math.min(1600, 850 + Math.abs(distance) * 0.8);
  const began = performance.now();
  const interruptions = new AbortController();
  let frame;

  stopScroll = () => {
    cancelAnimationFrame(frame);
    interruptions.abort();
    stopScroll = undefined;
  };

  function step(time) {
    const progress = Math.min((time - began) / duration, 1);
    const eased = progress * progress * progress * (10 + progress * (-15 + 6 * progress));
    window.scrollTo(0, start + distance * eased);

    if (progress < 1 && Math.abs(distance) > 1 && !reducedMotion.matches) {
      frame = requestAnimationFrame(step);
      return;
    }

    window.scrollTo(0, end);
    stopScroll();
    if (location.hash !== "#shops") history.pushState(null, "", "#shops");
    shops.focus({ preventScroll: true });
  }

  const options = { passive: true, signal: interruptions.signal };
  window.addEventListener("wheel", stopScroll, options);
  window.addEventListener("touchstart", stopScroll, options);
  window.addEventListener("keydown", stopScroll, options);
  window.addEventListener("popstate", stopScroll, options);
  frame = requestAnimationFrame(step);
}

document.querySelectorAll('a[href="#shops"]').forEach((link) => {
  link.addEventListener("click", scrollToShops);
});
