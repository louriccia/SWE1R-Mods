/**
 * Walk a folder tree and convert all .pst -> .png(s) or .ipu files.
 *
 * - Palettized PSTs (format 0 / 1) -> PNGs via ./block draw_texture()
 * - No-palette PSTs (format 2) -> raw IPU files (`.ipu`) suitable for ffmpeg.
 *
 * Output files are written next to the .pst, in the same directory.
 *
 * Usage:
 *   node pst-to-png-tree.js "C:\\path\\to\\root"
 *
 * Notes:
 * - If a palettized .pst contains multiple textures,
 *   writes <name>_0.png, <name>_1.png, ...
 * - For no-palette .pst (format === 2), writes
 *   <name>_mip<index>_<width>x<height>.ipu for each mip / texture.
 */

"use strict";

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const { draw_texture } = require("../block");

const ROOT = process.argv[2] || "C:/Users/louri/Documents/rr";
const VERBOSE = process.argv.includes("--verbose");

// ---------------------------------------------
// Walk filesystem
// ---------------------------------------------
async function* walkFiles(rootDir) {
  const dir = await fsp.opendir(rootDir);
  for await (const dirent of dir) {
    const full = path.join(rootDir, dirent.name);
    if (dirent.isDirectory()) {
      yield* walkFiles(full);
    } else if (dirent.isFile()) {
      yield full;
    }
  }
}

// ---------------------------------------------
// Helpers: palettes, indices
// ---------------------------------------------
function readPaletteRGBA(buffer, entries) {
  // returns [ [r,g,b,a], ... ]
  const pal = new Array(entries);
  for (let i = 0; i < entries; i++) {
    pal[i] = [
      buffer.readUInt8(i * 4 + 0),
      buffer.readUInt8(i * 4 + 1),
      buffer.readUInt8(i * 4 + 2),
      buffer.readUInt8(i * 4 + 3),
    ];
  }
  return pal;
}

function unswizzleClut256(pal256) {
  // pal is array of 256 RGBA entries in file order
  // returns pal in logical index order
  const out = pal256.slice();
  for (let base = 0; base < 256; base += 32) {
    // swap entries 8..15 with 16..23
    for (let i = 0; i < 8; i++) {
      const a = base + 8 + i;
      const b = base + 16 + i;
      const tmp = out[a];
      out[a] = out[b];
      out[b] = tmp;
    }
  }
  return out;
}

function decode4bppToIndices(pixelBuffer, pixelCount) {
  // Each byte = two pixels: low nibble then high nibble
  const out = new Array(pixelCount);
  let k = 0;
  for (let i = 0; i < pixelBuffer.length && k < pixelCount; i++) {
    const b = pixelBuffer[i];
    out[k++] = b & 0x0f;
    if (k < pixelCount) out[k++] = (b >> 4) & 0x0f;
  }
  return out;
}

function decode8bppToIndices(pixelBuffer, pixelCount) {
  // 1 byte per pixel
  const len = Math.min(pixelBuffer.length, pixelCount);
  const out = new Array(pixelCount);
  for (let i = 0; i < len; i++) out[i] = pixelBuffer[i];
  return out;
}

// ---------------------------------------------
// PST parsing helpers
// ---------------------------------------------
function parsePstHeader(file) {
  if (file.length < 0x0c) throw new Error("File too small for PST header");

  const unk0 = file.readUInt32LE(0x0);
  const format = file.readUInt32LE(0x4);
  const textureCount = file.readUInt32LE(0x8);

  return { unk0, format, textureCount };
}

/**
 * Decide palette entry count based on format.
 * format == 1 => 256-color (8bpp)
 * format == 0 => 16-color (4bpp)
 * otherwise  => no palette (format == 2 for the IPU case)
 */
function paletteEntryCountForFormat(format) {
  if (format === 1) return 256;
  if (format === 0) return 16;
  return 0;
}

// ---------------------------------------------
// Palettized textures (to PNG)
// ---------------------------------------------
function convertPalettizedPstToPngs(file, pstPath, header) {
  const { format, textureCount } = header;
  const paletteEntries = paletteEntryCountForFormat(format);
  const paletteBytes = paletteEntries * 4;

  const paletteStart = 0x0c;
  const paletteEnd = paletteStart + paletteBytes;
  if (file.length < paletteEnd) throw new Error("EOF: missing palette");

  const paletteBuffer = file.slice(paletteStart, paletteEnd);
  const palette = readPaletteRGBA(paletteBuffer, paletteEntries);
  const effectivePalette =
    paletteEntries === 256 ? unswizzleClut256(palette) : palette;

  let cursor = paletteEnd;

  const dir = path.dirname(pstPath);
  const base = path.basename(pstPath, path.extname(pstPath));

  let written = 0;

  for (let i = 0; i < textureCount; i++) {
    // Observed per-texture header for palettized PSTs:
    // u16 height; skip 2; u16 width; skip 0xC; then pixel buffer
    if (cursor + 0x10 > file.length) {
      throw new Error(`EOF: texture header ${i}`);
    }

    const height = file.readUInt16LE(cursor);
    cursor += 4;

    const width = file.readUInt16LE(cursor);
    cursor += 0x0c;

    const pixelCount = width * height;
    if (pixelCount <= 0) {
      throw new Error(`Bad dimensions at tex ${i}: ${width}x${height}`);
    }

    const expectedBytes =
      paletteEntries === 16 ? Math.ceil(pixelCount / 2) : pixelCount;

    if (cursor + expectedBytes > file.length) {
      throw new Error(
        `EOF: pixels tex ${i} need ${expectedBytes} bytes, have ${file.length - cursor
        }`
      );
    }

    const pixelBuffer = file.slice(cursor, cursor + expectedBytes);

    // Decode indices
    const indices =
      paletteEntries === 16
        ? decode4bppToIndices(pixelBuffer, pixelCount)
        : decode8bppToIndices(pixelBuffer, pixelCount);

    // Map indices -> RGBA (force alpha=255)
    const pixels = indices.map((idx) => {
      const p = effectivePalette[idx] || [0, 255, 255, 255];
      return [p[0], p[1], p[2], 255];
    });

    const outPath = path.join(dir, `${base}.png`);

    // draw_texture expects format=3 for “RGBA array”
    draw_texture({ pixels, format: 3, width, height, path: outPath, index: i });

    written++;
    cursor += expectedBytes;
  }

  return written;
}

// ---------------------------------------------
// No-palette textures (to IPU)
// ---------------------------------------------
function extractIpuStreamsFromPst(file, pstPath, header) {
  const { textureCount } = header;

  let cursor = 0x0c; // after main PST header
  const dir = path.dirname(pstPath);
  const base = path.basename(pstPath, path.extname(pstPath));

  let written = 0;

  for (let i = 0; i < textureCount; i++) {
    // Per-texture header for no-palette PSTs (from your notes / dumps):
    //
    // u32 width
    // u32 height
    // u32 unk0
    // u32 unk1
    // u32 outerSize   (size of the entire block starting at 'ipum',
    //                  including 8 bytes of trailing PST-specific u32s)
    // then:
    //   "ipum" (ASCII)
    //   ... IPU-ish header + payload ...
    //   trailer0 (u32)
    //   trailer1 (u32)
    //
    // We want to carve out the IPU stream as:
    //   [ 'ipum' ... ]  of length (outerSize - 8)
    // which drops the final two trailer u32s.

    if (cursor + 0x14 > file.length) {
      throw new Error(`EOF: IPU texture header ${i}`);
    }

    const width = file.readUInt32LE(cursor);
    cursor += 4;

    const height = file.readUInt32LE(cursor);
    cursor += 4;

    const unk0 = file.readUInt32LE(cursor);
    cursor += 4;

    const unk1 = file.readUInt32LE(cursor);
    cursor += 4;

    const outerSize = file.readUInt32LE(cursor);
    cursor += 4;

    if (outerSize <= 0) {
      throw new Error(
        `Bad outerSize for IPU tex ${i} in ${path.basename(pstPath)}`
      );
    }

    if (cursor + outerSize > file.length) {
      throw new Error(
        `EOF: IPU block tex ${i} needs ${outerSize} bytes, have ${file.length - cursor
        }`
      );
    }

    const magicOffset = cursor;
    const magic = file.slice(magicOffset, magicOffset + 4).toString("ascii");

    if (magic !== "ipum") {
      throw new Error(
        `Expected 'ipum' at tex ${i} in ${path.basename(
          pstPath
        )}, got '${magic}'`
      );
    }

    // Drop the final 8 bytes (two u32 trailers) to get the "pure" IPU stream.
    const ipuLen = outerSize;
    if (ipuLen <= 0) {
      throw new Error(
        `Computed ipuLen <= 0 for tex ${i} in ${path.basename(pstPath)}`
      );
    }

    const ipuBuf = file.slice(magicOffset, magicOffset + ipuLen);

    const outName = `${base}.ipu`;
    const outPath = path.join(dir, outName);
    fs.writeFileSync(outPath, ipuBuf);

    if (VERBOSE) {
      console.log(
        `IPU  ${path.relative(ROOT, pstPath)}: tex ${i} -> ${outName} (outerSize=${outerSize}, ipuLen=${ipuLen}, unk0=${unk0}, unk1=${unk1})`
      );
    }

    written++;

    // Advance cursor past the whole block (including the 8-byte trailers)
    cursor += outerSize;
  }

  return written;
}

// ---------------------------------------------
// Main PST dispatcher
// ---------------------------------------------
function processPst(pstPath) {
  const file = fs.readFileSync(pstPath);
  const header = parsePstHeader(file);
  const paletteEntries = paletteEntryCountForFormat(header.format);

  // For bookkeeping / debugging if you still want:
  // (you can easily add back JSON dumps here if needed)

  if (paletteEntries === 0) {
    // No palette => IPU / IPUM-backed textures
    const ipuCount = extractIpuStreamsFromPst(file, pstPath, header);
    return { pngCount: 0, ipuCount };
  } else {
    // Palettized => use existing PNG conversion path
    const pngCount = convertPalettizedPstToPngs(file, pstPath, header);
    return { pngCount, ipuCount: 0 };
  }
}

// ---------------------------------------------
// Main
// ---------------------------------------------
(async () => {
  if (!fs.existsSync(ROOT)) {
    console.error(`Root does not exist: ${ROOT}`);
    process.exit(1);
  }

  const pstFiles = [];
  for await (const p of walkFiles(ROOT)) {
    if (p.toLowerCase().endsWith(".pst")) pstFiles.push(p);
  }

  console.log(`Found ${pstFiles.length} .pst files under: ${ROOT}\n`);

  let ok = 0;
  let fail = 0;
  let totalPng = 0;
  let totalIpu = 0;

  for (const pstPath of pstFiles) {
    const rel = path.relative(ROOT, pstPath);
    try {
      const { pngCount, ipuCount } = processPst(pstPath);
      ok++;
      totalPng += pngCount;
      totalIpu += ipuCount;

      if (VERBOSE) {
        console.log(
          `OK   ${rel} -> ${pngCount} png, ${ipuCount} ipu`
        );
      }
    } catch (e) {
      fail++;
      console.error(`FAIL ${rel}\n  ${e?.message || e}\n`);
    }
  }

  console.log(
    `Done.\n` +
    `  PST processed: ${ok} ok, ${fail} failed\n` +
    `  PNG written:   ${totalPng}\n` +
    `  IPU written:   ${totalIpu}\n`
  );
})().catch((e) => {
  console.error(e?.stack || e);
  process.exit(1);
});
