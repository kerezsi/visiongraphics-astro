// src/lib/hero-depth.ts
// 2.5D parallax for the home hero: a render and its depth map on one WebGL quad.
// Pointer, idle drift and scroll displace near pixels more than far ones, so the
// still reads as a slow camera move. The caller falls back to a CSS image when this
// rejects: no WebGL, image failed to load, or a CORS-tainted texture (R2 without a
// CORS rule) — production degrades to the static hero, never to a blank one.

import './build-stamp'; // §4.8: fresh chunk hash every build

const VS = `attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
const FS = `precision mediump float;uniform sampler2D img,dep;uniform vec2 fit,off,pan;uniform float zoom;varying vec2 v;
void main(){vec2 uv=(v-.5)*fit*zoom+.5+pan;float d=texture2D(dep,uv).r;gl_FragColor=texture2D(img,uv+off*(d-.5));}`;

// Motion budget, all in UV units of the source image. MARGIN is cropped from every
// edge so panned + displaced samples never leave the texture: PAN + DEPTH*0.8 < MARGIN.
// DEPTH is how far near and far pixels drift apart at full swing — 2.5D tears at
// silhouettes past ~5%, so make the *whole-frame* camera (pan + zoom) carry the
// visible motion and keep the depth term as the 3D cue.
const MARGIN = 0.07;
const DEPTH  = 0.05;
const PAN    = 0.012;

const load = (src: string) =>
  new Promise<HTMLImageElement>((ok, err) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => ok(i);
    i.onerror = () => err(new Error(`hero image failed: ${src}`));
    i.src = src;
  });

export async function heroDepth(canvas: HTMLCanvasElement, imgSrc: string, depthSrc: string, onLost: () => void) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
  if (!gl) throw new Error('no webgl');
  const [img, dep] = await Promise.all([load(imgSrc), load(depthSrc)]);

  const prog = gl.createProgram()!;
  for (const [type, src] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, FS]] as const) {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src); gl.compileShader(s); gl.attachShader(prog, s);
  }
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'shader link failed'); // → still, not a black hero
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const p = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(p); gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  [img, dep].forEach((im, i) => {
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    for (const k of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE);
    for (const k of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im); // throws SecurityError on a tainted image
  });
  gl.uniform1i(gl.getUniformLocation(prog, 'img'), 0);
  gl.uniform1i(gl.getUniformLocation(prog, 'dep'), 1);
  const uFit = gl.getUniformLocation(prog, 'fit');
  const uOff = gl.getUniformLocation(prog, 'off');
  const uPan = gl.getUniformLocation(prog, 'pan');
  const uZoom = gl.getUniformLocation(prog, 'zoom');

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5), w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const ia = img.width / img.height, ca = w / h, z = 1 - 2 * MARGIN; // cover-fit, then crop the motion margin
    gl.uniform2f(uFit, (ca < ia ? ca / ia : 1) * z, (ca < ia ? 1 : ia / ca) * z);
  };

  let px = 0, py = 0, cx = 0, cy = 0, raf = 0, running = false;
  const frame = (t: number) => {
    raf = requestAnimationFrame(frame);
    cx += (px - cx) * 0.05; cy += (py - cy) * 0.05;                  // ease towards the pointer
    const s = t / 1000;
    const camX = Math.sin(s * 0.42) * 0.5, camY = Math.cos(s * 0.31) * 0.25; // idle camera orbit, ~15 s
    const dx = camX + cx;
    const dy = camY - cy + (scrollY / canvas.clientHeight) * 0.6;    // + scroll parallax
    gl.uniform2f(uOff, dx * DEPTH, dy * DEPTH);
    gl.uniform2f(uPan, camX * PAN, camY * PAN);                      // whole frame follows the camera
    gl.uniform1f(uZoom, 1 - 0.03 * (1 - Math.cos(s * 0.13)));        // slow push-in, up to 6 %, ~48 s
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  const run = (on: boolean) => {
    if (on === running) return;
    running = on;
    if (on) raf = requestAnimationFrame(frame); else cancelAnimationFrame(raf);
  };

  new ResizeObserver(resize).observe(canvas); // also covers a hero that was 0×0 while hidden
  addEventListener('pointermove', e => { px = e.clientX / innerWidth - 0.5; py = e.clientY / innerHeight - 0.5; }, { passive: true });
  new IntersectionObserver(([e]) => run(e.isIntersecting)).observe(canvas); // rAF already pauses in hidden tabs
  canvas.addEventListener('webglcontextlost', () => { run(false); onLost(); });
  resize();
  run(true);
}
