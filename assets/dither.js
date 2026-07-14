// Vanilla WebGL2 port of ReactBits "Dither" — two-pass shader:
//   1) wave (Perlin FBM) rendered into a framebuffer
//   2) 8x8 Bayer dither pixelizes and quantizes it to `colorNum` levels
// No Three.js / R3F / postprocessing dependency.

const OPTS = {
  waveSpeed: 0.05,
  waveFrequency: 3.0,
  waveAmplitude: 0.3,
  waveColor: [0.24, 0.62, 0.28],
  colorNum: 4.0,
  pixelSize: 2.0,
  disableAnimation: false,
  enableMouseInteraction: true,
  mouseRadius: 0.85,
};

const VS = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const WAVE_FS = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 resolution;
uniform float time;
uniform float waveSpeed;
uniform float waveFrequency;
uniform float waveAmplitude;
uniform vec3 waveColor;
uniform vec2 mousePos;
uniform int enableMouseInteraction;
uniform float mouseRadius;

vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
vec2 fade(vec2 t){return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec2 P){
  vec4 Pi=floor(P.xyxy)+vec4(0.0,0.0,1.0,1.0);
  vec4 Pf=fract(P.xyxy)-vec4(0.0,0.0,1.0,1.0);
  Pi=mod289(Pi);
  vec4 ix=Pi.xzxz; vec4 iy=Pi.yyww;
  vec4 fx=Pf.xzxz; vec4 fy=Pf.yyww;
  vec4 i=permute(permute(ix)+iy);
  vec4 gx=fract(i*(1.0/41.0))*2.0-1.0;
  vec4 gy=abs(gx)-0.5;
  vec4 tx=floor(gx+0.5); gx=gx-tx;
  vec2 g00=vec2(gx.x,gy.x);
  vec2 g10=vec2(gx.y,gy.y);
  vec2 g01=vec2(gx.z,gy.z);
  vec2 g11=vec2(gx.w,gy.w);
  vec4 norm=taylorInvSqrt(vec4(dot(g00,g00),dot(g01,g01),dot(g10,g10),dot(g11,g11)));
  g00*=norm.x; g01*=norm.y; g10*=norm.z; g11*=norm.w;
  float n00=dot(g00,vec2(fx.x,fy.x));
  float n10=dot(g10,vec2(fx.y,fy.y));
  float n01=dot(g01,vec2(fx.z,fy.z));
  float n11=dot(g11,vec2(fx.w,fy.w));
  vec2 f=fade(Pf.xy);
  vec2 nx=mix(vec2(n00,n01),vec2(n10,n11),f.x);
  return 2.3*mix(nx.x,nx.y,f.y);
}

const int OCTAVES=4;
float fbm(vec2 p){
  float value=0.0; float amp=1.0; float freq=waveFrequency;
  for(int i=0;i<OCTAVES;i++){
    value+=amp*abs(cnoise(p));
    p*=freq;
    amp*=waveAmplitude;
  }
  return value;
}
float pattern(vec2 p){
  vec2 p2=p-time*waveSpeed;
  return fbm(p+fbm(p2));
}

void main(){
  vec2 uv=gl_FragCoord.xy/resolution.xy;
  uv-=0.5;
  uv.x*=resolution.x/resolution.y;
  float f=pattern(uv);
  f=smoothstep(0.28,0.92,f);
  if(enableMouseInteraction==1){
    vec2 mouseNDC=(mousePos/resolution-0.5)*vec2(1.0,-1.0);
    mouseNDC.x*=resolution.x/resolution.y;
    float dist=length(uv-mouseNDC);
    float erase=1.0-smoothstep(mouseRadius*0.15,mouseRadius*1.35,dist);
    erase=pow(erase,1.6);
    f*=1.0-erase;
  }
  vec3 col=mix(vec3(0.0),waveColor,f);
  outColor=vec4(col,1.0);
}`;

const DITHER_FS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uTex;
uniform vec2 resolution;
uniform float colorNum;
uniform float pixelSize;

const float bayerMatrix8x8[64]=float[64](
  0.0/64.0,48.0/64.0,12.0/64.0,60.0/64.0, 3.0/64.0,51.0/64.0,15.0/64.0,63.0/64.0,
  32.0/64.0,16.0/64.0,44.0/64.0,28.0/64.0,35.0/64.0,19.0/64.0,47.0/64.0,31.0/64.0,
  8.0/64.0,56.0/64.0, 4.0/64.0,52.0/64.0,11.0/64.0,59.0/64.0, 7.0/64.0,55.0/64.0,
  40.0/64.0,24.0/64.0,36.0/64.0,20.0/64.0,43.0/64.0,27.0/64.0,39.0/64.0,23.0/64.0,
  2.0/64.0,50.0/64.0,14.0/64.0,62.0/64.0, 1.0/64.0,49.0/64.0,13.0/64.0,61.0/64.0,
  34.0/64.0,18.0/64.0,46.0/64.0,30.0/64.0,33.0/64.0,17.0/64.0,45.0/64.0,29.0/64.0,
  10.0/64.0,58.0/64.0, 6.0/64.0,54.0/64.0, 9.0/64.0,57.0/64.0, 5.0/64.0,53.0/64.0,
  42.0/64.0,26.0/64.0,38.0/64.0,22.0/64.0,41.0/64.0,25.0/64.0,37.0/64.0,21.0/64.0
);

vec3 dither(vec2 uv,vec3 color){
  vec2 scaled=floor(uv*resolution/pixelSize);
  int x=int(mod(scaled.x,8.0));
  int y=int(mod(scaled.y,8.0));
  float threshold=bayerMatrix8x8[y*8+x]-0.25;
  float stepv=1.0/(colorNum-1.0);
  color+=threshold*stepv;
  float bias=0.2;
  color=clamp(color-bias,0.0,1.0);
  return floor(color*(colorNum-1.0)+0.5)/(colorNum-1.0);
}

void main(){
  vec2 normalizedPixelSize=pixelSize/resolution;
  vec2 uvPixel=normalizedPixelSize*floor(vUv/normalizedPixelSize);
  vec4 color=texture(uTex,uvPixel);
  float lum=max(max(color.r,color.g),color.b);
  if(lum<0.05){
    outColor=vec4(0.0,0.0,0.0,color.a);
    return;
  }
  color.rgb=dither(vUv,color.rgb);
  outColor=color;
}`;

function compile(gl, type, source) {
  const s = gl.createShader(type);
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s), source);
    throw new Error('shader compile failed');
  }
  return s;
}
function program(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(p));
    throw new Error('program link failed');
  }
  return p;
}

export function initCoverDither(canvas, opts = {}) {
  const cfg = { ...OPTS, ...opts };
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: false });
  if (!gl) return null;

  const waveProg = program(gl, VS, WAVE_FS);
  const ditherProg = program(gl, VS, DITHER_FS);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
  const bindQuad = (prog) => {
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  };

  const u = {
    wave: {
      resolution: gl.getUniformLocation(waveProg, 'resolution'),
      time: gl.getUniformLocation(waveProg, 'time'),
      waveSpeed: gl.getUniformLocation(waveProg, 'waveSpeed'),
      waveFrequency: gl.getUniformLocation(waveProg, 'waveFrequency'),
      waveAmplitude: gl.getUniformLocation(waveProg, 'waveAmplitude'),
      waveColor: gl.getUniformLocation(waveProg, 'waveColor'),
      mousePos: gl.getUniformLocation(waveProg, 'mousePos'),
      enableMouseInteraction: gl.getUniformLocation(waveProg, 'enableMouseInteraction'),
      mouseRadius: gl.getUniformLocation(waveProg, 'mouseRadius'),
    },
    dither: {
      uTex: gl.getUniformLocation(ditherProg, 'uTex'),
      resolution: gl.getUniformLocation(ditherProg, 'resolution'),
      colorNum: gl.getUniformLocation(ditherProg, 'colorNum'),
      pixelSize: gl.getUniformLocation(ditherProg, 'pixelSize'),
    },
  };

  const tex = gl.createTexture();
  const fbo = gl.createFramebuffer();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

  const mouse = { x: 0, y: 0 };
  let w = 0, h = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    const rect = canvas.getBoundingClientRect();
    const nw = Math.max(1, Math.floor(rect.width * dpr));
    const nh = Math.max(1, Math.floor(rect.height * dpr));
    if (nw === w && nh === h) return;
    w = nw; h = nh;
    canvas.width = w;
    canvas.height = h;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  };
  resize();

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const onPointerMove = (e) => {
    if (!cfg.enableMouseInteraction) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    mouse.x = (e.clientX - rect.left) * dpr;
    mouse.y = (e.clientY - rect.top) * dpr;
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  const start = performance.now();
  let running = true;
  let visible = true;
  const io = new IntersectionObserver(
    ([entry]) => { visible = entry.isIntersecting; },
    { threshold: 0 }
  );
  io.observe(canvas);

  const frame = () => {
    if (!running) return;
    if (visible) {
      const t = cfg.disableAnimation ? 0 : (performance.now() - start) / 1000;

      // Pass 1: wave -> FBO
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, w, h);
      gl.useProgram(waveProg);
      bindQuad(waveProg);
      gl.uniform2f(u.wave.resolution, w, h);
      gl.uniform1f(u.wave.time, t);
      gl.uniform1f(u.wave.waveSpeed, cfg.waveSpeed);
      gl.uniform1f(u.wave.waveFrequency, cfg.waveFrequency);
      gl.uniform1f(u.wave.waveAmplitude, cfg.waveAmplitude);
      gl.uniform3fv(u.wave.waveColor, cfg.waveColor);
      gl.uniform2f(u.wave.mousePos, mouse.x, mouse.y);
      gl.uniform1i(u.wave.enableMouseInteraction, cfg.enableMouseInteraction ? 1 : 0);
      gl.uniform1f(u.wave.mouseRadius, cfg.mouseRadius);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // Pass 2: dither -> screen
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
      gl.useProgram(ditherProg);
      bindQuad(ditherProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(u.dither.uTex, 0);
      gl.uniform2f(u.dither.resolution, w, h);
      gl.uniform1f(u.dither.colorNum, cfg.colorNum);
      gl.uniform1f(u.dither.pixelSize, cfg.pixelSize);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  return {
    destroy() {
      running = false;
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
    },
  };
}
