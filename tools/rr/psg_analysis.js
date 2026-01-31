const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");


const ROOT = process.argv[2] || "C:/Users/louri/Documents/rr";

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

function readMatrix(file, cursor) {
    const matrix = [];
    for (let i = 0; i < 4; i++) {
        const row = [];
        for (let j = 0; j < 4; j++) {
            row.push(file.readFloatLE(cursor));
            cursor += 4;
        }
        matrix.push(row);
    }
    return [matrix, cursor];
}

function processBone(file, cursor) {
    const bone = {}
    bone.name = file.toString('ascii', cursor, cursor + 128).replace(/\0.*$/g, '');
    cursor += 128;
    const [matrix, newCursor] = readMatrix(file, cursor);
    bone.matrix = matrix;
    cursor = newCursor;
    bone.x = file.readFloatLE(cursor);
    cursor += 4
    bone.y = file.readFloatLE(cursor);
    cursor += 4
    bone.z = file.readFloatLE(cursor);
    cursor += 4
    bone.bounds = [];
    for (let i = 0; i < 4; i++) {
        let bound = file.readFloatLE(cursor)
        cursor += 4;
        bone.bounds.push(bound);
    }
    bone.parent = file.readInt32LE(cursor)
    cursor += 4;
    return [bone, cursor]
}

const chunkMap = {
    0x65: 'uv',
    0x6A: 'normal',
    0x6E: 'colors'
}

function processChunk(file, cursor, data) {
    const c = ['x', 'y', 'z', 'flag'];
    const chunk = {}
    chunk.flags = file.readUInt16LE(cursor);
    cursor += 2;
    chunk.count = file.readUInt8(cursor)
    cursor += 1;
    chunk.type = file.readUInt8(cursor)
    cursor += 1;

    if (![0x65, 0x6A, 0x6C, 0x6D, 0x6E, 0x17].includes(chunk.type)) {
        //console.log(`Unknown chunk type ${chunk.type}`);
        return [{}, cursor]
    }

    chunk.data = []
    switch (chunk.type) {
        case 0x65:
            for (let i = 0; i < chunk.count; i++) {
                chunk.data.push({
                    x: file.readUInt16LE(cursor) / 2048.0,
                    y: file.readUInt16LE(cursor + 2) / 2048.0
                })
                cursor += 4;
            }
            break;
        case 0x6A:
            let cursorBefore = cursor
            for (let i = 0; i < chunk.count; i++) {
                const vector = {}
                for (let j = 0; j < 3; j++) {
                    vector[c[j]] = file.readInt8(cursor) / 127.0
                    cursor++;
                }
                chunk.data.push(vector)
            }
            cursor = cursorBefore + Math.ceil(3 * chunk.count / 4) * 4
            break;
        case 0x6C:
            if (chunk.flags == 0x8001) {
                for (let i = 0; i < chunk.count; i++) {
                    const coord = {}
                    for (let j = 0; j < 4; j++) {
                        if (j < 3) {
                            coord[c[j]] = file.readInt32LE(cursor) / 1048576
                            cursor += 4;
                        } else {
                            const flag = file.readInt32LE(cursor)
                            coord.flag = flag
                            coord.emitTri = coord.flag > 0;
                            coord.boneId = Math.abs(coord.flag >> 4) - 1;
                            cursor += 4
                        }
                    }
                    chunk.data.push(coord)
                }
            } else {
                for (let i = 0; i < chunk.count * 16; i++) {
                    chunk.data.push(file.readUInt8(cursor))
                    cursor++;
                }
                chunk.something = chunk.data[0]
            }
            break;
        case 0x6D:
            for (let i = 0; i < chunk.count; i++) {
                const coord = {}
                for (let j = 0; j < 4; j++) {
                    if (j < 3) {
                        coord[c[j]] = file.readInt16LE(cursor) / 4096.0
                        cursor += 2
                    } else {
                        coord.flag = file.readInt16LE(cursor)
                        coord.emitTri = coord.flag > 0;
                        coord.boneId = Math.abs(coord.flag >> 4) - 1;
                        cursor += 2
                    }
                }
                chunk.data.push(coord);
            }
            break;
        case 0x6E:
            for (let i = 0; i < chunk.count; i++) {
                chunk.data.push(file.readFloatLE(cursor))
                cursor += 4;
            }
            break;
        case 0x17:
            break;
    }

    return [chunk, cursor]
}

function processMesh(file, cursor, data) {
    const mesh = {}
    mesh.id = file.readUInt32LE(cursor);
    cursor += 4;
    mesh.unk2 = file.readUInt32LE(cursor);
    cursor += 4;
    mesh.unkFloat = file.readFloatLE(cursor);
    cursor += 4;
    mesh.unk3 = file.readUInt32LE(cursor);
    cursor += 4;
    mesh.size = file.readUInt32LE(cursor);
    cursor += 4;
    let endOfStream = cursor + mesh.size;
    mesh.chunks = []
    while (cursor < endOfStream) {
        const [chunk, newCursor] = processChunk(file, cursor, data);
        if (Object.keys(chunk).length) {
            mesh.chunks.push(chunk);
        }

        cursor = newCursor;
    }
    return [mesh, cursor]
}

function processObject(file, cursor, data) {
    const object = {}
    object.flags = file.readUInt32LE(cursor);
    cursor += 4;
    object.mesh_count = file.readUInt32LE(cursor);
    cursor += 4;
    object.meshes = [];
    for (let i = 0; i < object.mesh_count; i++) {
        const [mesh, newCursor] = processMesh(file, cursor, data);
        object.meshes.push(mesh);
        cursor = newCursor;
    }
    return [object, cursor]
}

function processTail(file, cursor) {
    const tail = {}
    tail.unk1 = file.readUInt32LE(cursor);
    cursor += 4;
    tail.length = file.readUInt32LE(cursor);
    cursor += 4;
    tail.data = [];
    for (let i = 0; i < tail.length; i++) {
        tail.data.push(file.readUInt8(cursor));
        cursor++;
    }
    tail.end = file.readUInt32LE(cursor);
    cursor += 4
    return [tail, cursor]
}

function processPsg(psgPath) {
    const data = { path: psgPath };
    const file = fs.readFileSync(psgPath);
    data.file_extension = file.toString('ascii', 0, 4).replace(/\0.*$/g, '');
    data.version = file.readUInt32LE(4);
    data.bone_count = file.readUInt32LE(8);
    let cursor = 12;

    data.bones = []
    for (let i = 0; i < data.bone_count; i++) {
        const [bone, newCursor] = processBone(file, cursor);
        data.bones.push(bone);
        cursor = newCursor;
    }

    data.texture_count = file.readUInt32LE(cursor);
    cursor += 4;

    data.textures = []
    for (let i = 0; i < data.texture_count; i++) {
        const name = file.toString('ascii', cursor, cursor + 64).replace(/\0.*$/g, '');
        cursor += 64;
        data.textures.push({ name });
    }

    data.unkFloats = []
    for (let i = 0; i < 4; i++) {
        data.unkFloats.push(file.readFloatLE(cursor));
        cursor += 4;
    }

    data.unkPadding = []
    for (let i = 0; i < 4; i++) {
        data.unkPadding.push(file.readUInt32LE(cursor));
        cursor += 4;
    }

    data.object_count = file.readUInt32LE(cursor);
    cursor += 4;

    data.objects = []
    for (let i = 0; i < data.object_count; i++) {
        const [object, newCursor] = processObject(file, cursor, data);
        data.objects.push(object);
        cursor = newCursor;
    }

    if (cursor < file.length) {
        const [tail, newCursor] = processTail(file, cursor);
        data.tail = tail;
        cursor = newCursor;
    }

    return data

}

(async () => {
    if (!fs.existsSync(ROOT)) {
        console.error(`Root does not exist: ${ROOT}`);
        process.exit(1);
    }

    const psgFiles = [];
    for await (const p of walkFiles(ROOT)) {
        if (p.toLowerCase().endsWith(".psg")) psgFiles.push(p);
    }

    console.log(`Found ${psgFiles.length} .psg files under: ${ROOT}\n`);

    for (const psgPath of psgFiles) {
        const rel = path.relative(ROOT, psgPath);
        console.log(`Processing ${rel}`);
        const data = processPsg(psgPath);

        data.objects.forEach(object => {
            object.meshes.forEach(mesh => {
                mesh.verts = []
                let verts = []
                let index = 0;
                mesh.chunks.forEach((chunk, c) => {
                    if (chunk.type == 0x17) {
                        mesh.verts = [...mesh.verts, ...verts]
                        verts = []
                        index = -1
                    } else if (index == 1) {
                        verts = chunk.data
                        verts[0].chunk = c
                    } else if (index > 1) {
                        chunk.data.forEach((item, i) => {
                            verts[i][chunkMap[chunk.type]] = item
                        })
                    }
                    index++
                })
                delete mesh.chunks
            })
        })

        data.path = rel;
        //write json to psg folder
        const outPath = ROOT + "/" + rel.replace(/\.psg$/i, '') + ".json";
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
    }

    console.log(
        `Done.`
    );

})().catch((e) => {
    console.error(e?.stack || e);
    process.exit(1);
});
