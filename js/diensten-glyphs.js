/* ==========================================================================
   Diensten: per dienst een eigen vorm uit bits, licht op een donker vak.
   1 websites  2 webshops  3 platformen  4 apps  5 software  6 AI-workflows

   Elke vorm is een wolk van punten. Terwijl de cel in beeld schuift, vliegen de
   bits van een losse wolk naar hun plaats (gekoppeld aan de scroll, dus terug
   scrollen haalt ze weer uit elkaar). Beweeg je over de cel, dan draait de vorm
   naar je cursor, wijken de bits en kleuren ze oranje.

   Gewoon script, geen module: een module wordt geweigerd als je de site lokaal
   opent (file://). Three komt via een dynamische import van de CDN.
   ========================================================================== */
(function () {
  var slots = Array.prototype.slice.call(document.querySelectorAll('[data-glyph]'));
  if (!slots.length) return;

  import('https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js')
    .then(function (THREE) {
      try {
        init(THREE);
      } catch (e) {
        document.documentElement.classList.add('no-glyphs');
      }
    })
    .catch(function () {
      document.documentElement.classList.add('no-glyphs');
    });

  function init(THREE) {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia('(pointer: fine)').matches;
    var N = window.matchMedia('(max-width: 760px)').matches ? 1800 : 2600;

    /* ---------------------------------------------------------------- */
    /* Vormen: opgebouwd uit lijnen, vlakken, bogen en dozen             */
    /* ---------------------------------------------------------------- */
    var seed = 7;
    function rnd() { return ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; }
    function jit(a) { return (rnd() - 0.5) * a; }

    function line(a, b, j) {
      j = j == null ? 0.012 : j;
      return function () {
        var t = rnd();
        return [a[0] + (b[0] - a[0]) * t + jit(j), a[1] + (b[1] - a[1]) * t + jit(j), a[2] + (b[2] - a[2]) * t + jit(j)];
      };
    }
    function rectLines(x, y, w, h, z, k) {
      k = k || 1;
      return [
        [w * k, line([x, y, z], [x + w, y, z])],
        [w * k, line([x, y + h, z], [x + w, y + h, z])],
        [h * k, line([x, y, z], [x, y + h, z])],
        [h * k, line([x + w, y, z], [x + w, y + h, z])],
      ];
    }
    function fill(x, y, w, h, z, j) {
      j = j == null ? 0.02 : j;
      return function () { return [x + rnd() * w, y + rnd() * h, z + jit(j)]; };
    }
    function arc(cx, cy, z, r, a0, a1, j) {
      j = j == null ? 0.015 : j;
      return function () {
        var a = a0 + (a1 - a0) * rnd();
        return [cx + Math.cos(a) * r + jit(j), cy + Math.sin(a) * r + jit(j), z + jit(j)];
      };
    }
    function ball(c, r) {
      return function () {
        var u = rnd() * 2 - 1, t = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u);
        return [c[0] + r * s * Math.cos(t), c[1] + r * s * Math.sin(t), c[2] + r * u];
      };
    }
    function boxEdges(c, s, weight) {
      weight = weight || 1;
      var a = s[0] / 2, b = s[1] / 2, d = s[2] / 2, e = [];
      function P(i, j, k) { return [c[0] + i * a, c[1] + j * b, c[2] + k * d]; }
      [-1, 1].forEach(function (i) {
        [-1, 1].forEach(function (j) {
          e.push([s[2] * weight, line(P(i, j, -1), P(i, j, 1))]);
          e.push([s[1] * weight, line(P(i, -1, j), P(i, 1, j))]);
          e.push([s[0] * weight, line(P(-1, i, j), P(1, i, j))]);
        });
      });
      return e;
    }
    function boxFace(c, s) {
      return function () {
        var f = (rnd() * 6) | 0, u = rnd() - 0.5, v = rnd() - 0.5, side = f % 2 ? 0.5 : -0.5;
        var p = f < 2 ? [side, u, v] : f < 4 ? [u, side, v] : [u, v, side];
        return [c[0] + p[0] * s[0], c[1] + p[1] * s[1], c[2] + p[2] * s[2]];
      };
    }

    function sample(prims, rot) {
      var total = prims.reduce(function (a, p) { return a + p[0]; }, 0);
      var out = new Float32Array(N * 3);
      var c0 = Math.cos(rot[0]), s0 = Math.sin(rot[0]), c1 = Math.cos(rot[1]), s1 = Math.sin(rot[1]);
      for (var i = 0; i < N; i++) {
        var r = rnd() * total, k = 0;
        while (r > prims[k][0] && k < prims.length - 1) r -= prims[k++][0];
        var p = prims[k][1]();
        // Een vaste kanteling per vorm, zodat ze op zich al diepte heeft.
        var y = p[1] * c0 - p[2] * s0, z = p[1] * s0 + p[2] * c0;
        var x = p[0] * c1 + z * s1;
        z = -p[0] * s1 + z * c1;
        out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z;
      }
      return out;
    }

    var builders = {
      // Websites: twee browservensters achter elkaar, met een layout erin.
      1: function () {
        var W = 2.5, H = 1.72, x = -W / 2, y = -H / 2 - 0.05, p = [];
        p = p.concat(rectLines(x, y, W, H, 0.15, 2.2));
        p.push([W * 1.4, line([x, y + H - 0.2, 0.15], [x + W, y + H - 0.2, 0.15])]);
        [0, 1, 2].forEach(function (i) { p.push([0.25, arc(x + 0.13 + i * 0.12, y + H - 0.1, 0.15, 0.035, 0, Math.PI * 2, 0.004)]); });
        p.push([2.4, fill(x + 0.14, y + H - 0.78, W - 0.28, 0.46, 0.15)]);
        p.push([0.5, fill(x + 0.14, y + H - 0.93, 1.2, 0.05, 0.15, 0.005)]);
        p.push([0.4, fill(x + 0.14, y + H - 1.03, 0.9, 0.035, 0.15, 0.005)]);
        [0, 1, 2].forEach(function (i) {
          p = p.concat(rectLines(x + 0.14 + i * 0.77, y + 0.12, 0.66, 0.5, 0.15));
          p.push([0.35, fill(x + 0.2 + i * 0.77, y + 0.42, 0.4, 0.14, 0.15)]);
        });
        p = p.concat(rectLines(x + 0.3, y + 0.3, W, H, -0.45, 0.8));
        return sample(p, [0.08, -0.22]);
      },
      // Webshops: een draagtas met twee hengsels en een prijskaartje.
      2: function () {
        var c = [0, -0.25, 0], s = [1.5, 1.45, 0.62], p = [];
        p = p.concat(boxEdges(c, s, 2.4));
        p.push([4, boxFace(c, s)]);
        p.push([1.3, arc(0, c[1] + s[1] / 2, s[2] / 2, 0.38, 0, Math.PI)]);
        p.push([1.3, arc(0, c[1] + s[1] / 2, -s[2] / 2, 0.38, 0, Math.PI)]);
        p = p.concat(rectLines(0.35, -0.55, 0.42, 0.26, s[2] / 2 + 0.02, 0.8));
        p.push([0.3, arc(0.43, -0.42, s[2] / 2 + 0.02, 0.03, 0, Math.PI * 2, 0.004)]);
        p.push([0.6, line([-0.2, 0.2, s[2] / 2 + 0.02], [0.45, -0.42, s[2] / 2 + 0.02], 0.006)]);
        return sample(p, [0.3, 0.55]);
      },
      // Platformen: drie losse lagen boven elkaar, elk iets verschoven.
      3: function () {
        var p = [];
        [[-0.78, -0.18], [0, 0], [0.78, 0.18]].forEach(function (l, i) {
          var y = l[0], dx = l[1], w = 2 - i * 0.2, d = 1.35 - i * 0.15;
          p = p.concat(boxEdges([dx, y, 0], [w, 0.05, d], 2.2));
          p.push([i === 1 ? 2.4 : 1.6, function () { return [dx - w / 2 + rnd() * w, y + jit(0.015), -d / 2 + rnd() * d]; }]);
        });
        p = p.concat(boxEdges([0.3, 0.2, 0.05], [0.5, 0.36, 0.45], 1.4));
        return sample(p, [0.42, 0.62]);
      },
      // Apps: een telefoon met een raster van apps.
      4: function () {
        var W = 1.05, H = 2.1, x = -W / 2, y = -H / 2, p = [];
        p = p.concat(rectLines(x, y, W, H, 0.06, 2.4));
        p = p.concat(rectLines(x, y, W, H, -0.06, 0.9));
        p.push([0.4, fill(-0.18, H / 2 - 0.12, 0.36, 0.035, 0.06, 0.004)]);
        for (var r = 0; r < 5; r++) for (var c = 0; c < 4; c++) {
          p.push([0.32, fill(x + 0.11 + c * 0.22, y + 0.5 + r * 0.26, 0.15, 0.15, 0.06, 0.01)]);
        }
        p.push([0.8, fill(x + 0.11, y + 0.14, W - 0.22, 0.2, 0.06)]);
        return sample(p, [0.05, 0.42]);
      },
      // Software: één pakket (de buitenste doos) met precies één gevulde module erin.
      5: function () {
        var p = [];
        p = p.concat(boxEdges([0, 0, 0], [1.8, 1.8, 1.8], 2.4));
        p = p.concat(boxEdges([0.25, -0.3, 0.2], [0.8, 0.8, 0.8], 1.6));
        p.push([3.2, boxFace([0.25, -0.3, 0.2], [0.8, 0.8, 0.8])]);
        p.push([0.8, boxFace([0, 0, 0], [1.8, 1.8, 1.8])]);
        return sample(p, [0.5, 0.62]);
      },
      // AI-workflows: knopen en verbindingen, met een splitsing en een samenkomst.
      6: function () {
        var n = [
          [-1.45, 0.55, 0], [-0.8, 0.55, 0.15], [-0.2, 0.55, -0.1],
          [0.35, 0.95, 0.2], [0.35, 0.15, -0.2], [0.95, 0.55, 0],
          [1.45, 0.55, 0.1], [1.45, -0.35, -0.15], [0.9, -0.85, 0.1], [0.1, -0.7, -0.1],
        ].map(function (q) { return [q[0] * 0.78 - 0.05, q[1] * 0.85 + 0.05, q[2]]; });
        var e = [[0, 1], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5], [5, 6], [6, 7], [7, 8], [7, 9]];
        var p = n.map(function (c, i) { return [i === 2 || i === 7 ? 1.6 : 1.1, ball(c, i === 2 || i === 7 ? 0.14 : 0.1)]; });
        e.forEach(function (ab) { p.push([0.9, line(n[ab[0]], n[ab[1]], 0.01)]); });
        return sample(p, [0.15, -0.3]);
      },
    };

    /* ---------------------------------------------------------------- */
    /* Shader: van losse wolk naar vorm, wijken voor de cursor           */
    /* ---------------------------------------------------------------- */
    var vertexShader = [
      'attribute vec3 aFrom; attribute vec4 aRand; attribute vec3 aDir;',
      'uniform float uAssemble, uTime, uSize, uDpr, uCamZ, uHover, uPointerOn;',
      'uniform vec3 uPointer;',
      'varying float vHot; varying float vAlpha; varying float vPick;',
      'void main() {',
      // Elk bit vertrekt op een ander moment: zo zwermt de vorm samen.
      '  float a = clamp(uAssemble * 1.6 - aRand.x * 0.6, 0.0, 1.0);',
      '  a = 1.0 - pow(1.0 - a, 3.0);',
      '  vec3 p = mix(aFrom, position, a);',
      '  p += aDir * 0.02 * sin(uTime * 1.3 + aRand.w * 40.0);',
      '  vec4 world = modelMatrix * vec4(p, 1.0);',
      '  vec2 d = world.xy - uPointer.xy;',
      '  float f = smoothstep(0.6, 0.0, length(d)) * uPointerOn;',
      '  world.xy += normalize(d + 1e-4) * f * 0.28;',
      '  world.z += f * 0.3;',
      '  vec4 mv = viewMatrix * world;',
      '  gl_Position = projectionMatrix * mv;',
      '  gl_PointSize = uSize * uDpr * (0.55 + aRand.y * 0.9) * (uCamZ / -mv.z);',
      '  vHot = max(f, (1.0 - a) * 0.8);',
      '  vPick = aRand.z;',
      '  vAlpha = smoothstep(uCamZ + 2.6, uCamZ - 1.9, -mv.z) * (0.35 + 0.65 * a);',
      '}',
    ].join('\n');

    var fragmentShader = [
      'uniform vec3 uInk, uOrange; uniform float uHover;',
      'varying float vHot; varying float vAlpha; varying float vPick;',
      'void main() {',
      // Vierkante punten: het zijn bits. Bij hover kleuren er meer oranje.
      '  float accent = step(0.93 - uHover * 0.12, vPick);',
      '  vec3 col = mix(uInk, uOrange, clamp(accent + vHot, 0.0, 1.0));',
      '  gl_FragColor = vec4(col, (0.72 + 0.28 * accent) * vAlpha);',
      '}',
    ].join('\n');

    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var CAMZ = 6.4;

    function makeGlyph(slot) {
      var kind = +slot.getAttribute('data-glyph');
      if (!builders[kind]) return null;
      var cell = slot.closest('.case-tile') || slot;
      var canvas = document.createElement('canvas');
      slot.appendChild(canvas);

      var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true });
      renderer.setPixelRatio(dpr);
      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
      camera.position.z = CAMZ;

      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(builders[kind](), 3));
      var from = new Float32Array(N * 3), rand = new Float32Array(N * 4), dir = new Float32Array(N * 3);
      for (var i = 0; i < N; i++) {
        var u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
        var r = 1.6 + Math.random() * 1.6;
        dir.set([s * Math.cos(t), s * Math.sin(t), u], i * 3);
        from.set([s * Math.cos(t) * r * 1.4, s * Math.sin(t) * r, u * r], i * 3);
        rand.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
      }
      geo.setAttribute('aFrom', new THREE.BufferAttribute(from, 3));
      geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));
      geo.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));

      var uniforms = {
        uAssemble: { value: reduce ? 1 : 0 },
        uTime: { value: 0 },
        uSize: { value: 2.6 },
        uDpr: { value: dpr },
        uCamZ: { value: CAMZ },
        uHover: { value: 0 },
        uPointer: { value: new THREE.Vector3(99, 99, 0) },
        uPointerOn: { value: 0 },
        uInk: { value: new THREE.Color('#fafbfc') },
        uOrange: { value: new THREE.Color('#f05522') },
      };
      var points = new THREE.Points(geo, new THREE.ShaderMaterial({
        uniforms: uniforms, vertexShader: vertexShader, fragmentShader: fragmentShader,
        transparent: true, depthWrite: false,
      }));
      var group = new THREE.Group();
      group.add(points);
      scene.add(group);

      var g = {
        slot: slot, renderer: renderer, scene: scene, camera: camera, uniforms: uniforms, group: group,
        visible: false, hover: 0, hoverTarget: 0, tiltX: 0, tiltY: 0, tx: 0, ty: 0,
        phase: kind * 1.7,
      };

      g.resize = function () {
        var r = slot.getBoundingClientRect();
        if (!r.width || !r.height) return;
        renderer.setSize(r.width, r.height, false);
        camera.aspect = r.width / r.height;
        // Past de vorm altijd in het vak, ook als dat smal en hoog is.
        // Zo dicht dat de vorm (zo'n 2,6 eenheden groot) ~90% van de kortste zijde vult.
        camera.position.z = 5.2 / Math.min(1, camera.aspect);
        uniforms.uCamZ.value = camera.position.z;
        // Kleinere vakken, kleinere bits.
        uniforms.uSize.value = clamp(1.6, 2.8, r.height / 110);
        camera.updateProjectionMatrix();
      };

      if (!reduce && finePointer) {
        var ndc = new THREE.Vector2(), ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        cell.addEventListener('pointerenter', function () { g.hoverTarget = 1; });
        cell.addEventListener('pointerleave', function () { g.hoverTarget = 0; g.tx = 0; g.ty = 0; });
        cell.addEventListener('pointermove', function (e) {
          var r = slot.getBoundingClientRect();
          ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
          ray.setFromCamera(ndc, camera);
          ray.ray.intersectPlane(plane, uniforms.uPointer.value);
          g.tx = Math.max(-1, Math.min(1, ndc.x));
          g.ty = Math.max(-1, Math.min(1, ndc.y));
        });
      }
      return g;
    }

    function clamp(a, b, v) { return Math.min(b, Math.max(a, v)); }

    var glyphs = slots.map(makeGlyph).filter(Boolean);
    glyphs.forEach(function (g) { g.resize(); });

    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(function (entries) {
        entries.forEach(function (en) {
          glyphs.forEach(function (g) { if (g.slot === en.target) { g.resize(); if (reduce) draw(g, 0, 0); } });
        });
      });
      glyphs.forEach(function (g) { ro.observe(g.slot); });
    }

    /* ---------------------------------------------------------------- */
    /* Loop: alleen de vormen die in beeld zijn                          */
    /* ---------------------------------------------------------------- */
    function assembleFor(slot) {
      // 0 als het vak onderaan binnenkomt, 1 als het op 65% van de hoogte staat.
      var r = slot.getBoundingClientRect(), vh = window.innerHeight;
      var t = (vh - r.top) / (vh * 0.55);
      t = Math.max(0, Math.min(1, t));
      return t * t * (3 - 2 * t);
    }

    function draw(g, t, dt) {
      var u = g.uniforms;
      if (!reduce) {
        var k = 1 - Math.pow(0.004, dt);
        u.uAssemble.value += (assembleFor(g.slot) - u.uAssemble.value) * k;
        g.hover += (g.hoverTarget - g.hover) * (1 - Math.pow(0.01, dt));
        g.tiltX += (g.tx - g.tiltX) * (1 - Math.pow(0.02, dt));
        g.tiltY += (g.ty - g.tiltY) * (1 - Math.pow(0.02, dt));
        u.uTime.value = t;
        u.uHover.value = g.hover;
        u.uPointerOn.value = g.hover;
        g.group.rotation.y = Math.sin(t * 0.3 + g.phase) * 0.22 + g.tiltX * 0.45 * g.hover;
        g.group.rotation.x = -g.tiltY * 0.3 * g.hover + Math.sin(t * 0.21 + g.phase) * 0.05;
        g.group.scale.setScalar(1 + g.hover * 0.05);
      }
      g.renderer.render(g.scene, g.camera);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        glyphs.forEach(function (g) { if (g.slot === en.target) g.visible = en.isIntersecting; });
      });
    }, { rootMargin: '100px 0px' });
    glyphs.forEach(function (g) { io.observe(g.slot); });

    if (reduce) {
      glyphs.forEach(function (g) { draw(g, 0, 0); });
      return;
    }

    var last = performance.now(), t0 = last;
    (function frame() {
      requestAnimationFrame(frame);
      if (document.hidden) return;
      var now = performance.now(), dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      for (var i = 0; i < glyphs.length; i++) {
        if (glyphs[i].visible) draw(glyphs[i], (now - t0) / 1000, dt);
      }
    })();
  }
})();
