# PSG Format
The 3D model format - containing armature and vertex data including coordinates, UV, normals, and colors.

## Overall File Structure
| type                   | values | note                                             |
| ---------------------- | ------ | ------------------------------------------------ |
| char[4]                | "psg " | The file type                                    |
| u32                    | 3      | file version?                                    |
| u32                    | 1 - 33 | bone count                                       |
| bone[bone_count]       | -      | bone data                                        |
| u32                    | 1 - 15 | texture count                                    |
| texture[texture_count] | -      | texture data                                     |
| float[4]               | -      | unknown                                          |
| u32[4]                 | -      | unknown, blank padding?                          |
| u32                    | 1 or 4 | object count                                     |
| object[object_count]   | -      | object data                                      |
| tail                   | -      | extra bone data, only exists when bone count > 1 |


## Bones
Each bone has the following structure:

| type      | values              | note                                      |
| --------- | ------------------- | ----------------------------------------- |
| char[128] | bone name           | the text id of each bone                  |
| float[16] | 4x4 tranform matrix | the initial position of the bone?         |
| float[3]  | xyz                 | bone position                             |
| float[4]  | -1 to +1            | possibly the bounding area for this bone? |
| u32       | -1 to n bones       | The index of the parent bone              |

If there is more than one bone, the file will end with a small sequential index table of the same number of bones.

## Textures
The number of textures always matches the number of meshes (streams). Texture name may (and often do) repeat.

| type     | values       | note                        |
| -------- | ------------ | --------------------------- |
| char[64] | texture name | the text id of each texture |

## Object
| type             | values | note       |
| ---------------- | ------ | ---------- |
| u32              | -      | flags?     |
| u32              | -      | mesh count |
| Mesh[mesh_count] | -      | mesh data  |

## Mesh
| type   | values | note            |
| ------ | ------ | --------------- |
| u32    | -      | id?             |
| u32    | -      | unk2            |
| float? | -      | unk3            |
| u32    | -      | unk4            |
| u32    | -      | size (in bytes) |

## Chunk

### Chunk Types
**65**
count: 3 - 16
unk: 0x80[count * 2 + 1]
size: count * 4

The 0x65 chunk contains UV data. The UV coordinates are each stored as unsigned 16bit integers as a range between 0-2048 (in pairs of U, V). 

**6A**
count: 3 - 16
unk: count + 1
size: 3 * count ( + padding )

The 0x6A chunk seems to have 3 bytes of data per count? Could mean normals or vertex colors? Some kind of data that is 3 per vertex.


**6C**
count: 1, 3-16
unk: 0 when count = 1, else 1
size: count * 16

A 0x6C chunk may act as an initial chunk when its count is 1.
An initial chunk always contains:
The data size of the following chunks

Otherwise, a 0x6C chunk contains a set of `count` vertex coordinates, stored as signed 32 bit integers (possibly divided?)

**6D**
count: 3 - 16
unk: 1
size: count * 8

A 0x6D chunk contains a set of `count` vertex coordinates, stored as signed 16bit integers (possibly divided by 4096.0?)

**6E**
count: 3-16
unk: 0xC0[count * 3 + 1]
size: 4 * count

0x6E chunks definitely seem to fit a 4-byte stride full of high bytes (always > 0x28). Every 1st byte (little endian) is always 0x3F. Perhaps these are weights? As floats they all fall between 0.6 - 0.99, usually with a lot of repeating values. I'm not sure if that pattern makes sense. Would it make sense that this chunk is only sometimes included?

### Chunk Sequences
**First Chunk**
Chunk sequences always begin with 0x6C, 1, 8000, size: 16

**Second Chunk**
The second chunk may be another 0x6C or a 0x6D, always containing a set of vertex coordinates.

**Third Chunk**
The third chunk is always a 0x6A chunk with the same count as the chunk before it.

**Fourth Chunk**
The fourth chunk is always a 0x65 chunk with the same count as the 0x6A chunk before it.

**Fifth Chunk**
The fifth chunk is an optional 0x6E chunk.

**Sequence End**
Chunk sequences always end with the 0x17 chunk. 