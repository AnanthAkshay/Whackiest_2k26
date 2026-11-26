import { useEffect, useRef } from "react";

const VERT_SRC = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG_SRC = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_dark;

void main() {
  vec2 uv = gl_FragCoord.xy / max(u_res, vec2(1.0));
  float t = u_time * 0.35;
  float wave1 = sin(uv.x * 3.4 + t + sin(uv.y * 2.2 - t * 0.6));
  float wave2 = cos(uv.y * 3.0 - t * 0.8 + cos(uv.x * 2.6 + t * 0.4));
  float field = (wave1 + wave2) * 0.25 + 0.5;

  vec3 lightBase = vec3(0.965, 0.969, 0.976);
  vec3 lightAccent = vec3(0.76, 0.94, 0.87);
  vec3 darkBase = vec3(0.043, 0.051, 0.063);
  vec3 darkAccent = vec3(0.06, 0.22, 0.17);

  vec3 col = mix(
    mix(lightBase, lightAccent, smoothstep(0.32, 0.88, field) * 0.55),
    mix(darkBase, darkAccent, smoothstep(0.32, 0.88, field) * 0.75),
    u_dark
  );
  gl_FragColor = vec4(col, 1.0);
}
`;

export function ShaderHeroCanvas(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, powerPreference: "low-power" });
    if (!gl) return;

    const compile = (type: number, src: string): WebGLShader | null => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT_SRC);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      return;
    }

    const prog = gl.createProgram();
    if (!prog) {
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return;
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const locPos = gl.getAttribLocation(prog, "a_pos");
    const locRes = gl.getUniformLocation(prog, "u_res");
    const locTime = gl.getUniformLocation(prog, "u_time");
    const locDark = gl.getUniformLocation(prog, "u_dark");

    let visible = true;
    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver((entries) => {
            visible = entries.some((e) => e.isIntersecting);
          })
        : null;
    observer?.observe(canvas);

    const resize = (): void => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    let rafId = 0;
    const start = performance.now();

    const render = (now: number): void => {
      rafId = window.requestAnimationFrame(render);
      if (!visible) return;
      const isDark =
        document.documentElement.dataset.theme === "dark" ||
        (document.documentElement.dataset.theme !== "light" &&
          window.matchMedia?.("(prefers-color-scheme: dark)").matches);

      gl.useProgram(prog);
      gl.enableVertexAttribArray(locPos);
      gl.vertexAttribPointer(locPos, 2, gl.FLOAT, false, 0, 0);
      if (locRes) gl.uniform2f(locRes, canvas.width, canvas.height);
      if (locTime) gl.uniform1f(locTime, (now - start) / 1000);
      if (locDark) gl.uniform1f(locDark, isDark ? 1.0 : 0.0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    rafId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      observer?.disconnect();
      if (buf) gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return <canvas ref={canvasRef} className="am-shader-canvas" aria-hidden="true" />;
}
