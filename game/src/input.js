// Velvet Vault Heist — keyboard + mouse input, one small job: tell the
// game which keys are held, where the mouse clicked, and what was pressed.
export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  let clickTarget = null;

  function codeOf(e) {
    return e.code || e.key;
  }

  window.addEventListener("keydown", (e) => {
    const code = codeOf(e);
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(code)) {
      e.preventDefault();
    }
    if (!e.repeat) pressed.add(code);
    keys.add(code);
  });
  window.addEventListener("keyup", (e) => {
    keys.delete(codeOf(e));
  });
  window.addEventListener("blur", () => {
    keys.clear();
  });
  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    clickTarget = {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  });

  return {
    isDown(code) {
      return keys.has(code);
    },
    wasPressed(code) {
      return pressed.has(code);
    },
    clearPressed() {
      pressed.clear();
    },
    takeClick() {
      const t = clickTarget;
      clickTarget = null;
      return t;
    },
    axis() {
      let x = 0;
      let y = 0;
      if (keys.has("KeyA") || keys.has("ArrowLeft")) x -= 1;
      if (keys.has("KeyD") || keys.has("ArrowRight")) x += 1;
      if (keys.has("KeyW") || keys.has("ArrowUp")) y -= 1;
      if (keys.has("KeyS") || keys.has("ArrowDown")) y += 1;
      if (x !== 0 && y !== 0) {
        x *= Math.SQRT1_2;
        y *= Math.SQRT1_2;
      }
      return { x, y };
    },
    sneaking() {
      return keys.has("ShiftLeft") || keys.has("ShiftRight");
    },
  };
}
