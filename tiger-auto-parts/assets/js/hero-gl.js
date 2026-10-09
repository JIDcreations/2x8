// Hero signature: the Tiger wall, live. Rain on the glass, ripples on the wet asphalt,
// and a headlight beam that follows the cursor across the wall.
// Progressive enhancement: the <img> underneath stays visible until the first frame renders.
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const canvas = document.querySelector("[data-gl]");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { return false; }
}

if (canvas && !reduce && supportsWebGL()) init();

function init() {
  const hero = canvas.closest(".hero");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  const dpr = Math.min(window.devicePixelRatio || 1, matchMedia("(max-width: 640px)").matches ? 1 : 1.5);
  renderer.setPixelRatio(dpr);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uTex: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uImg: { value: new THREE.Vector2(1920, 1280) },
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.62, 0.6) },
    uIntro: { value: 0 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform sampler2D uTex;
      uniform vec2 uRes, uImg, uMouse;
      uniform float uTime, uIntro;
      varying vec2 vUv;

      float hash11(float p) { return fract(sin(p * 12345.564) * 7658.76); }
      float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      vec3 hash31(float p) {
        vec3 p3 = fract(vec3(p) * vec3(0.1031, 0.11369, 0.13787));
        p3 += dot(p3, p3.yzx + 19.19);
        return fract(vec3((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y, (p3.y + p3.z) * p3.x));
      }
      float saw(float b, float t) { return smoothstep(0.0, b, t) * smoothstep(1.0, b, t); }

      // Running drops with trails (after BigWings' "Heartfelt", simplified)
      vec2 dropLayer(vec2 uv, float t) {
        vec2 UV = uv;
        uv.y += t * 0.75;
        vec2 a = vec2(6.0, 1.0);
        vec2 grid = a * 2.0;
        vec2 id = floor(uv * grid);
        uv.y += hash11(id.x);
        id = floor(uv * grid);
        vec3 n = hash31(id.x * 35.2 + id.y * 2376.1);
        vec2 st = fract(uv * grid) - vec2(0.5, 0.0);
        float x = n.x - 0.5;
        float y = UV.y * 20.0;
        float wiggle = sin(y + sin(y));
        x += wiggle * (0.5 - abs(x)) * (n.z - 0.5);
        x *= 0.7;
        float ti = fract(t + n.z);
        y = (saw(0.85, ti) - 0.5) * 0.9 + 0.5;
        vec2 p = vec2(x, y);
        float d = length((st - p) * a.yx);
        float mainDrop = smoothstep(0.4, 0.0, d);
        float r = sqrt(smoothstep(1.0, y, st.y));
        float cd = abs(st.x - x);
        float trail = smoothstep(0.23 * r, 0.15 * r * r, cd);
        float trailFront = smoothstep(-0.02, 0.02, st.y - y);
        trail *= trailFront * r * r;
        y = UV.y;
        y = fract(y * 10.0) + (st.y - 0.5);
        float dd = length(st - vec2(x, y));
        float droplets = smoothstep(0.3, 0.0, dd);
        return vec2(mainDrop + droplets * r * trailFront, trail);
      }

      float staticDrops(vec2 uv, float t) {
        uv *= 26.0;
        vec2 id = floor(uv);
        uv = fract(uv) - 0.5;
        vec3 n = hash31(id.x * 107.45 + id.y * 3543.654);
        vec2 p = (n.xy - 0.5) * 0.7;
        float d = length(uv - p);
        float fade = saw(0.025, fract(t + n.z));
        return smoothstep(0.3, 0.0, d) * fract(n.z * 10.0) * fade;
      }

      vec2 drops(vec2 uv, float t) {
        float s = staticDrops(uv, t) * 0.7;
        vec2 m1 = dropLayer(uv, t);
        vec2 m2 = dropLayer(uv * 1.6, t) * 0.8;
        float c = s + m1.x + m2.x;
        c = smoothstep(0.3, 1.0, c);
        return vec2(c, max(m1.y, m2.y));
      }

      vec2 coverUv(vec2 uv) {
        float rs = uRes.x / uRes.y;
        float ri = uImg.x / uImg.y;
        vec2 s = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
        return (uv - 0.5) * s + vec2(0.5, 0.52);
      }

      void main() {
        vec2 uv = vUv;
        vec2 fc = uv * uRes;
        vec2 duv = (fc - 0.5 * uRes) / uRes.y;
        float t = uTime * 0.18;

        // Rain on the glass: refraction normals from finite differences
        vec2 c = drops(duv, t);
        vec2 e = vec2(0.0012, 0.0);
        float cx = drops(duv + e, t).x;
        float cy = drops(duv + e.yx, t).x;
        vec2 n = vec2(cx - c.x, cy - c.x);

        vec2 iuv = coverUv(uv + n * 0.4);

        // Ripples on the wet asphalt (lower band of the photo)
        float ground = smoothstep(0.34, 0.2, iuv.y);
        vec2 rip = vec2(0.0);
        for (int i = 0; i < 5; i++) {
          float fi = float(i);
          float cyc = uTime * 0.45 + fi * 0.37;
          float id = floor(cyc);
          float ph = fract(cyc);
          vec2 cen = vec2(hash11(id * 1.7 + fi * 13.1), mix(0.06, 0.3, hash11(id * 3.1 + fi * 7.7)));
          vec2 d = (iuv - cen) * vec2(uImg.x / uImg.y, 2.4);
          float r = length(d);
          float w = exp(-pow((r - ph * 0.22) * 34.0, 2.0)) * (1.0 - ph);
          rip += normalize(d + 1e-4) * w * 0.006;
        }
        iuv += rip * ground;

        // Misted glass between drops: a light blur, sharp inside drops and trails
        vec3 sharp = texture2D(uTex, iuv).rgb;
        float b = 0.0048;
        vec3 blur = (texture2D(uTex, iuv + vec2(b, 0.0)).rgb + texture2D(uTex, iuv - vec2(b, 0.0)).rgb +
                     texture2D(uTex, iuv + vec2(0.0, b)).rgb + texture2D(uTex, iuv - vec2(0.0, b)).rgb) * 0.25;
        float focus = clamp(c.x + c.y * 0.6, 0.0, 1.0);
        vec3 col = mix(blur, sharp, 0.35 + focus * 0.65);

        // Headlight beam
        vec2 asp = vec2(uRes.x / uRes.y, 1.0);
        vec2 dl = (uv - uMouse) * asp;
        dl.y *= 1.35;
        float d = length(dl);
        float spot = smoothstep(0.62, 0.0, d);
        spot *= spot;
        float core = smoothstep(0.16, 0.0, d);

        col *= mix(0.34, 1.32, spot);
        col += vec3(1.0, 0.94, 0.84) * core * 0.05;

        // The tiger answers the light: orange pixels glow under the beam
        float orange = smoothstep(0.06, 0.22, col.r - col.b) * smoothstep(0.02, 0.1, col.r - col.g);
        col += vec3(1.0, 0.42, 0.04) * orange * spot * 0.45;

        // Drops catch the beam: a soft lift inside each drop, no rims
        col += sharp * focus * spot * 0.18;

        // Vignette, grain, lights-on intro
        col *= smoothstep(1.3, 0.3, length((uv - 0.5) * vec2(1.15, 1.0)));
        col += (hash12(fc + fract(uTime * 7.0) * 100.0) - 0.5) * 0.03;
        col *= uIntro;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  // Size
  const resize = () => {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w * dpr, h * dpr);
  };
  new ResizeObserver(resize).observe(hero);
  resize();

  // Pointer: the beam eases toward the cursor; when idle it sweeps across the wall on its own
  const target = new THREE.Vector2(0.62, 0.6);
  let lastMove = -1e9;
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    target.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    lastMove = performance.now();
  });

  // Lights-on flicker
  const intro = (s) => {
    if (s < 0.12) return 0.0;
    if (s < 0.2) return 0.55;
    if (s < 0.27) return 0.12;
    if (s < 0.33) return 0.8;
    if (s < 0.4) return 0.35;
    return Math.min(1, 0.35 + (s - 0.4) * 1.6);
  };

  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) loop(); }, { threshold: 0 }).observe(hero);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) loop(); });

  const clock = new THREE.Clock(false);
  let raf = 0;
  function loop() {
    cancelAnimationFrame(raf);
    if (!visible || document.hidden || !uniforms.uTex.value) return;
    raf = requestAnimationFrame(tick);
  }
  function tick() {
    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;
    uniforms.uIntro.value = intro(t);
    if (performance.now() - lastMove > 2500) {
      target.set(0.5 + 0.26 * Math.sin(t * 0.32), 0.6 + 0.1 * Math.sin(t * 0.51 + 1.2));
    }
    uniforms.uMouse.value.lerp(target, 0.06);
    renderer.render(scene, camera);
    if (visible && !document.hidden) raf = requestAnimationFrame(tick);
  }

  new THREE.TextureLoader().load(canvas.parentElement.querySelector("img").currentSrc || "assets/img/hero-garage.jpg", (tex) => {
    tex.minFilter = THREE.LinearFilter;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    uniforms.uTex.value = tex;
    uniforms.uImg.value.set(tex.image.width, tex.image.height);
    clock.start();
    renderer.render(scene, camera);
    canvas.classList.add("is-on");
    loop();
  });
}
