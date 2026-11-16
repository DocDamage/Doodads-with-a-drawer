'use strict';

// Manual WebGL regression probe for MZ/NW.js. It compiles the production Water3D GLSL chunks in a
// tiny offscreen shader, with an all-water looping mask and ground-capture UVs from -0.25 to 1.25.
// Run in a disposable playtest DevTools console:
//   await require('C:/dev/dans doodads/scratch/qa_water_capture.js')({ env: window })
module.exports = async function qaWaterCapture(options = {}) {
    const env = options.env || global.window || global;
    const D = env.DocsDoodads;
    const document = env.document;
    if (!D || !D.Water3D || !document) throw new Error('Run this probe in an MZ playtest with Doc\'s Doodads loaded.');

    const width = Number(options.width) || 192;
    const height = Number(options.height) || 64;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: true });
    if (!gl) throw new Error('WebGL 1 is unavailable.');

    const vertex = [
        'attribute vec2 aPosition;',
        'varying vec2 vUv;',
        'void main() {',
        '    vec2 q = aPosition * 0.5 + 0.5;',
        '    vUv = vec2(-0.25 + q.x * 1.5, 0.25 + q.y * 0.5);',
        '    gl_Position = vec4(aPosition, 0.0, 1.0);',
        '}'
    ].join('\n');
    const fragment = [
        'precision highp float;',
        'varying vec2 vUv;',
        'uniform sampler2D uSampler;',
        'uniform vec3 uVoid;',
        'uniform vec3 uCam;',
        'uniform vec2 uGround;',
        D.Water3D.glsl,
        'void main() {',
        '    vec2 uv = vUv;',
        '    vec2 p = vUv * uGround;',
        D.Water3D.applyGlsl,
        '    vec4 c = vec4(0.0);',
        '    if (uv.x >= 0.0 && uv.y >= 0.0 && uv.x <= 1.0 && uv.y <= 1.0) c = texture2D(uSampler, uv);',
        '    vec3 rgb = (c.rgb + uVoid * (1.0 - c.a)) * docsWaterShade + vec3(docsWaterSpec);',
        '    gl_FragColor = vec4(rgb, 1.0);',
        '}'
    ].join('\n');

    const compile = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Shader compile failed.');
        return shader;
    };
    const program = gl.createProgram();
    const vertexShader = compile(gl.VERTEX_SHADER, vertex);
    const fragmentShader = compile(gl.FRAGMENT_SHADER, fragment);
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Shader link failed.');
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniform = (name, values) => {
        const location = gl.getUniformLocation(program, name);
        if (location === null) return;
        if (values.length === 1) gl.uniform1f(location, values[0]);
        else if (values.length === 2) gl.uniform2fv(location, values);
        else if (values.length === 3) gl.uniform3fv(location, values);
        else if (values.length === 4) gl.uniform4fv(location, values);
    };
    const texture = (unit, name, w, h, pixels) => {
        const out = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, out);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        gl.uniform1i(gl.getUniformLocation(program, name), unit);
        return out;
    };

    const size = 64;
    const groundPixels = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const checker = ((x >> 2) + (y >> 2)) & 1;
        groundPixels[i] = checker ? 24 : 8;
        groundPixels[i + 1] = checker ? 130 : 55;
        groundPixels[i + 2] = checker ? 220 : 145;
        groundPixels[i + 3] = 255;
    }
    const groundTexture = texture(0, 'uSampler', size, size, groundPixels);
    const maskTexture = texture(1, 'uWaterMask', 1, 1, new Uint8Array([255, 0, 0, 255]));
    const voidRgb = [7, 11, 19];
    uniform('uVoid', voidRgb.map(v => v / 255));
    uniform('uCam', [32, 32, 100]);
    uniform('uGround', [size, size]);
    uniform('uWater', [1, 2, 1, 1]);
    uniform('uMapTiles', [1, 1]);
    uniform('uTile', [size, size]);
    uniform('uOrigin', [0, 0]);
    uniform('uLoop', [1, 1]);
    uniform('uLightDir', [-0.45, -0.55, 0.7]);
    const wakes = gl.getUniformLocation(program, 'uWakes[0]');
    if (wakes !== null) gl.uniform4fv(wakes, new Float32Array(D.Water3D.maxWakes * 4));
    gl.viewport(0, 0, width, height);

    const render = time => {
        uniform('uWaterTime', [time]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        const pixels = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        return pixels;
    };
    const first = render(0.25);
    const second = render(2.75);
    let outsideSamples = 0, outsideWrong = 0, outsideChanged = 0, insideSamples = 0, insideChanged = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const uvx = -0.25 + ((x + 0.5) / width) * 1.5;
        const outside = uvx < 0 || uvx > 1;
        const i = (y * width + x) * 4;
        const changed = Math.abs(first[i] - second[i]) + Math.abs(first[i + 1] - second[i + 1]) + Math.abs(first[i + 2] - second[i + 2]) > 3;
        if (outside) {
            outsideSamples++;
            if (changed) outsideChanged++;
            const wrongFirst = Math.abs(first[i] - voidRgb[0]) + Math.abs(first[i + 1] - voidRgb[1]) + Math.abs(first[i + 2] - voidRgb[2]) > 3;
            const wrongSecond = Math.abs(second[i] - voidRgb[0]) + Math.abs(second[i + 1] - voidRgb[1]) + Math.abs(second[i + 2] - voidRgb[2]) > 3;
            if (wrongFirst || wrongSecond) outsideWrong++;
        } else {
            insideSamples++;
            if (changed) insideChanged++;
        }
    }

    gl.deleteTexture(groundTexture);
    gl.deleteTexture(maskTexture);
    gl.deleteBuffer(buffer);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    gl.deleteProgram(program);
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();

    const result = { ok: outsideWrong === 0 && outsideChanged === 0 && insideChanged > 0, outsideSamples, outsideWrong, outsideChanged, insideSamples, insideChanged };
    if (!result.ok && options.assert !== false) {
        const error = new Error(`Water escaped the ground capture: ${JSON.stringify(result)}`);
        error.result = result;
        throw error;
    }
    return result;
};
