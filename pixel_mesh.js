'use strict';
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const THREE = require('three');

const ALPHA_THRESHOLD = 20;
const DEFAULT_THICKNESS = 0.10;
const MAX_QUADS = 500000;

class Float32Builder {
    constructor(size = 4096) { this.data = new Float32Array(size); this.length = 0; }
    push(...values) {
        const needed = this.length + values.length;
        if (needed > this.data.length) {
            let size = this.data.length;
            while (size < needed) size *= 2;
            const next = new Float32Array(size);
            next.set(this.data.subarray(0, this.length));
            this.data = next;
        }
        for (const value of values) this.data[this.length++] = value;
    }
    finish() { return this.data.slice(0, this.length); }
}
class Uint32Builder {
    constructor(size = 4096) { this.data = new Uint32Array(size); this.length = 0; }
    push(...values) {
        const needed = this.length + values.length;
        if (needed > this.data.length) {
            let size = this.data.length;
            while (size < needed) size *= 2;
            const next = new Uint32Array(size);
            next.set(this.data.subarray(0, this.length));
            this.data = next;
        }
        for (const value of values) this.data[this.length++] = value;
    }
    finish() { return this.data.slice(0, this.length); }
}

function installFileReaderPolyfill() {
    if (typeof globalThis.FileReader !== 'undefined') return;
    globalThis.FileReader = class NodeFileReader {
        constructor() { this.result = null; this.onload = null; this.onloadend = null; this.onerror = null; }
        readAsArrayBuffer(blob) {
            blob.arrayBuffer().then(buffer => {
                this.result = buffer;
                const event = { target: this };
                if (this.onload) this.onload(event);
                if (this.onloadend) this.onloadend(event);
            }).catch(error => { if (this.onerror) this.onerror(error); });
        }
        readAsDataURL(blob) {
            blob.arrayBuffer().then(buffer => {
                const mime = blob.type || 'application/octet-stream';
                this.result = 'data:' + mime + ';base64,' + Buffer.from(buffer).toString('base64');
                const event = { target: this };
                if (this.onload) this.onload(event);
                if (this.onloadend) this.onloadend(event);
            }).catch(error => { if (this.onerror) this.onerror(error); });
        }
    };
}

function createGreedyRectangles(mask, width, height) {
    const remaining = mask.slice();
    const rectangles = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            if (!remaining[index]) continue;
            let rectWidth = 1;
            while (x + rectWidth < width && remaining[index + rectWidth]) rectWidth++;
            let rectHeight = 1;
            outer: while (y + rectHeight < height) {
                const row = (y + rectHeight) * width + x;
                for (let dx = 0; dx < rectWidth; dx++) {
                    if (!remaining[row + dx]) break outer;
                }
                rectHeight++;
            }
            for (let dy = 0; dy < rectHeight; dy++) {
                const row = (y + dy) * width + x;
                remaining.fill(0, row, row + rectWidth);
            }
            rectangles.push({ x, y, width: rectWidth, height: rectHeight });
        }
    }
    return rectangles;
}

function createGeometry(rectangles, mask, width, height, thickness) {
    const positions = new Float32Builder();
    const normals = new Float32Builder();
    const uvs = new Float32Builder();
    const indices = new Uint32Builder();
    const halfW = width / 2;
    const halfH = height / 2;
    const frontZ = thickness / 2;
    const backZ = -thickness / 2;
    let quadCount = 0;

    const uv = (x, y) => [x / width, 1 - y / height];
    const addQuad = (points, normal, texcoords) => {
        quadCount++;
        if (quadCount > MAX_QUADS) {
            throw new Error('La imagen produce más de ' + MAX_QUADS +
                ' caras. Simplifica las zonas transparentes o usa una resolución menor.');
        }
        const base = positions.length / 3;
        for (let i = 0; i < 4; i++) {
            positions.push(points[i][0], points[i][1], points[i][2]);
            normals.push(normal[0], normal[1], normal[2]);
            uvs.push(texcoords[i][0], texcoords[i][1]);
        }
        indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };
    const visible = (x, y) =>
        x >= 0 && y >= 0 && x < width && y < height && mask[y * width + x] === 1;

    for (const rect of rectangles) {
        const x0 = rect.x - halfW;
        const x1 = rect.x + rect.width - halfW;
        const yTop = halfH - rect.y;
        const yBottom = halfH - (rect.y + rect.height);
        const u0 = uv(rect.x, rect.y);
        const u1 = uv(rect.x + rect.width, rect.y);
        const u2 = uv(rect.x + rect.width, rect.y + rect.height);
        const u3 = uv(rect.x, rect.y + rect.height);

        addQuad(
            [[x0,yBottom,frontZ],[x1,yBottom,frontZ],[x1,yTop,frontZ],[x0,yTop,frontZ]],
            [0,0,1], [u3,u2,u1,u0]
        );
        addQuad(
            [[x0,yBottom,backZ],[x0,yTop,backZ],[x1,yTop,backZ],[x1,yBottom,backZ]],
            [0,0,-1], [u3,u0,u1,u2]
        );
    }

    // Side walls are emitted only where a visible pixel borders transparency or the image edge.
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (!visible(x, y)) continue;
            const x0 = x - halfW, x1 = x + 1 - halfW;
            const yTop = halfH - y, yBottom = halfH - y - 1;
            const uvTL = uv(x, y), uvTR = uv(x + 1, y);
            const uvBR = uv(x + 1, y + 1), uvBL = uv(x, y + 1);

            if (!visible(x - 1, y)) addQuad(
                [[x0,yBottom,frontZ],[x0,yTop,frontZ],[x0,yTop,backZ],[x0,yBottom,backZ]],
                [-1,0,0], [uvBL,uvTL,uvTL,uvBL]
            );
            if (!visible(x + 1, y)) addQuad(
                [[x1,yBottom,frontZ],[x1,yBottom,backZ],[x1,yTop,backZ],[x1,yTop,frontZ]],
                [1,0,0], [uvBR,uvBR,uvTR,uvTR]
            );
            if (!visible(x, y - 1)) addQuad(
                [[x0,yTop,frontZ],[x1,yTop,frontZ],[x1,yTop,backZ],[x0,yTop,backZ]],
                [0,1,0], [uvTL,uvTR,uvTR,uvTL]
            );
            if (!visible(x, y + 1)) addQuad(
                [[x0,yBottom,frontZ],[x0,yBottom,backZ],[x1,yBottom,backZ],[x1,yBottom,frontZ]],
                [0,-1,0], [uvBL,uvBL,uvBR,uvBR]
            );
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions.finish(), 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals.finish(), 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs.finish(), 2));
    geometry.setIndex(new THREE.BufferAttribute(indices.finish(), 1));
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return { geometry, quadCount };
}

async function generatePixelMeshGLB(imagePath, outputPath, options = {}) {
    if (!fs.existsSync(imagePath)) throw new Error('No existe la imagen original: ' + imagePath);
    const thickness = Number(options.thickness ?? DEFAULT_THICKNESS);
    if (!Number.isFinite(thickness) || thickness <= 0) {
        throw new Error('El grosor del mesh debe ser un número positivo.');
    }

    const result = await sharp(imagePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const data = result.data;
    const width = result.info.width;
    const height = result.info.height;
    if (!width || !height || width !== height) {
        throw new Error('La imagen debe ser cuadrada; recibida: ' + width + 'x' + height + '.');
    }
    if (width > 512 || height > 512) {
        throw new Error('Resolución máxima admitida: 512x512; recibida: ' + width + 'x' + height + '.');
    }

    const mask = new Uint8Array(width * height);
    let visiblePixels = 0;
    for (let i = 0; i < mask.length; i++) {
        if (data[i * 4 + 3] > 20) { mask[i] = 1; visiblePixels++; }
    }
    if (!visiblePixels) throw new Error('La imagen no contiene píxeles visibles con alpha superior a 20.');

    const rectangles = createGreedyRectangles(mask, width, height);
    const built = createGeometry(rectangles, mask, width, height, thickness);
    const mesh = new THREE.Mesh(
        built.geometry,
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, side: THREE.DoubleSide })
    );
    mesh.name = 'KodaMeshPixelArt';
    mesh.rotation.set(
        THREE.MathUtils.degToRad(Number(options.rotationX ?? 90)),
        THREE.MathUtils.degToRad(Number(options.rotationY ?? -45)),
        THREE.MathUtils.degToRad(Number(options.rotationZ ?? 0))
    );
    const scene = new THREE.Scene();
    scene.add(mesh);

    installFileReaderPolyfill();
    const exporterModule = await import('three/examples/jsm/exporters/GLTFExporter.js');
    const exporter = new exporterModule.GLTFExporter();
    const glb = await exporter.parseAsync(scene, { binary: true, onlyVisible: true, truncateDrawRange: true });
    const buffer = Buffer.isBuffer(glb) ? glb : Buffer.from(glb);
    if (buffer.length < 20 || buffer.toString('ascii', 0, 4) !== 'glTF') {
        throw new Error('Three.js no generó un archivo GLB válido.');
    }
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.promises.writeFile(outputPath, buffer);

    console.log('[THREE] GLB creado: ' + buffer.length + ' bytes | ' +
        visiblePixels + ' píxeles visibles | ' + rectangles.length +
        ' rectángulos | ' + built.quadCount + ' caras');

    return {
        outputPath,
        bytes: buffer.length,
        visiblePixels,
        rectangleCount: rectangles.length,
        quadCount: built.quadCount
    };
}

module.exports = { generatePixelMeshGLB };
