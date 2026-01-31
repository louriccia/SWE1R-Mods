// Unpack all .RES files under a folder (recursively).
// Writes ALL extracted files relative to OUTPUT_ROOT using the internal entry path.
// Logs per-RES summary: inflated chunks success/fail + files written success/fail.

const fs = require("fs");
const fsp = require("fs/promises");
const zlib = require("zlib");
const path = require("path");

// --- CONFIG ---
// Usage:
//   node unpack-res-tree.js "C:\path\to\game\folder" "C:\path\to\output"
const INPUT_ROOT = process.argv[2] || "C:/Users/louri/Documents/Racer Revenge";
const OUTPUT_ROOT = process.argv[3] || INPUT_ROOT;

// Your format appears to use 0x6000 fixed inflated pages.
const PAGE_SIZE = 24576; // 0x6000

// --- Helpers ---
async function* walkFiles(rootDir) {
    const dir = await fsp.opendir(rootDir);
    for await (const dirent of dir) {
        const full = path.join(rootDir, dirent.name);
        if (dirent.isDirectory()) yield* walkFiles(full);
        else if (dirent.isFile()) yield full;
    }
}

function normalizeGamePath(p) {
    // Convert PS2-ish backslashes to forward slashes, then let path.resolve handle it.
    return p.replace(/\\/g, "/");
}

function safeJoin(base, target) {
    // Prevent weird paths like ../../evil
    const resolvedBase = path.resolve(base);
    const resolvedTarget = path.resolve(base, target);
    if (!resolvedTarget.startsWith(resolvedBase)) {
        throw new Error(`Path traversal attempt: ${target}`);
    }
    return resolvedTarget;
}

function inflateChunk(chunk) {
    // Common zlib headers include 78 01 / 78 5E / 78 9C / 78 DA
    // but you've mostly seen 78 9C. We'll search for 78 ?? where ?? is one of these.
    const candidates = [0x01, 0x5e, 0x9c, 0xda];

    let start = -1;
    for (let i = 0; i < chunk.length - 1; i++) {
        if (chunk[i] === 0x78 && candidates.includes(chunk[i + 1])) {
            start = i;
            break;
        }
    }
    if (start === -1) throw new Error("No zlib header (78 ??) found in chunk");

    return zlib.inflateSync(chunk.slice(start));
}

// --- Core unpacker for one RES ---
function unpackResBuffer(file, outputRootForAllFiles, resManifestDir) {
    const stats = {
        inflated_ok: 0,
        inflated_fail: 0,
        files_ok: 0,
        files_fail: 0,
        total_files: 0,
        total_chunks_expected: 0,
    };

    const endOfTable = file.readUInt32LE(0x4) + 0x8;

    const chunkSizes = [];
    for (let i = 0x14; i < endOfTable; i += 0x2) {
        chunkSizes.push(file.readUInt16LE(i));
    }

    const totalEntries = file.readUInt32LE(endOfTable);
    const fileTableSize = file.readUInt32LE(endOfTable + 0x4);

    const fileTableOffset = endOfTable + 0x8;
    let cursor = fileTableOffset;

    const files = [];
    for (let i = 0; i < totalEntries; i++) {
        const nameLength = file.readUInt32LE(cursor);
        const name = file
            .slice(cursor + 0x4, cursor + 0x4 + nameLength)
            .toString("utf-8");

        const pageOffset = file.readUInt32LE(cursor + 0x4 + nameLength);
        const uncompressedSize = file.readUInt32LE(cursor + 0x8 + nameLength);
        const chunksNeeded = Math.ceil(uncompressedSize / PAGE_SIZE);

        // IMPORTANT CHANGE:
        // Write relative to OUTPUT_ROOT only, using the internal entry path.
        const relOut = normalizeGamePath(name);
        const outPath = safeJoin(outputRootForAllFiles, relOut);

        files.push({
            name,
            pageOffset,
            uncompressedSize,
            chunks: chunksNeeded,
            outPath,
        });

        cursor += 0xC + nameLength;
    }

    stats.total_files = files.length;
    stats.total_chunks_expected = files.reduce((a, f) => a + f.chunks, 0);

    // Optional manifest (per RES) so you can debug later, without affecting output paths
    if (resManifestDir) {
        fs.mkdirSync(resManifestDir, { recursive: true });
        fs.writeFileSync(
            path.join(resManifestDir, "files.json"),
            JSON.stringify(files, null, 2)
        );
    }

    const endOfFileTable = fileTableOffset + fileTableSize;
    cursor = endOfFileTable;

    for (let i = 0; i < files.length; i++) {
        const f = files[i];

        const inflatedPages = [];
        let ok = true;

        for (let j = 0; j < f.chunks; j++) {
            const compressedSize = chunkSizes.shift();
            if (compressedSize === undefined) {
                stats.inflated_fail++;
                ok = false;
                break;
            }

            const start = cursor;
            const end = start + compressedSize;

            // Preserve your observed "+ 1" skip (separator/padding)
            cursor += compressedSize + 1;

            const chunk = file.slice(start, end);

            try {
                const inflated = inflateChunk(chunk);
                inflatedPages.push(inflated);
                stats.inflated_ok++;
            } catch (e) {
                stats.inflated_fail++;
                ok = false;
                break;
            }
        }

        if (!ok) {
            stats.files_fail++;
            continue;
        }

        // Crop once after concatenation
        const buffer = Buffer.concat(inflatedPages);
        const cropped = buffer.slice(0, f.uncompressedSize);

        try {
            fs.mkdirSync(path.dirname(f.outPath), { recursive: true });
            fs.writeFileSync(f.outPath, cropped);
            stats.files_ok++;
        } catch (e) {
            stats.files_fail++;
        }
    }

    return stats;
}

async function unpackResFile(resPath, rootInputDir, rootOutputDir) {
    const buf = fs.readFileSync(resPath);

    // Keep manifests organized by where the RES came from, but DON'T affect output paths.
    const relRes = path.relative(rootInputDir, resPath);
    const manifestDir = safeJoin(
        rootOutputDir,
        path.join("_res_manifests", relRes.replace(/\.[^.]+$/, ""))
    );

    const stats = unpackResBuffer(buf, rootOutputDir, manifestDir);
    return { relRes, stats, manifestDir };
}

// --- Main ---
(async () => {
    const resFiles = [];
    for await (const p of walkFiles(INPUT_ROOT)) {
        if (p.toLowerCase().endsWith(".res")) resFiles.push(p);
    }

    console.log(`Found ${resFiles.length} .res files under: ${INPUT_ROOT}`);
    console.log(`Output root: ${OUTPUT_ROOT}\n`);

    for (const resPath of resFiles) {
        const rel = path.relative(INPUT_ROOT, resPath);
        console.log(`=== Unpacking ${rel} ===`);

        try {
            const result = await unpackResFile(resPath, INPUT_ROOT, OUTPUT_ROOT);
            const s = result.stats;

            console.log(
                `Done ${result.relRes}\n` +
                `  Inflated chunks: ${s.inflated_ok} ok, ${s.inflated_fail} failed (expected ~${s.total_chunks_expected})\n` +
                `  Files written:   ${s.files_ok} ok, ${s.files_fail} failed (total ${s.total_files})\n` +
                `  Manifest dir:    ${result.manifestDir}\n`
            );
        } catch (e) {
            console.error(`FAILED to unpack ${rel}\n  ${e?.stack || e}\n`);
        }
    }

    console.log("All done.");
})().catch((e) => {
    console.error(e?.stack || e);
    process.exit(1);
});
