import std.fxpt;
import std.mem;
import std.io;

struct Float4x3TransformMatrix {
    float m11; float m12; float m13; float m14;
    float m21; float m22; float m23; float m24;
    float m31; float m32; float m33; float m34;
};

struct Float4x4TransformMatrix {
    float m11; float m12; float m13; float m14;
    float m21; float m22; float m23; float m24;
    float m31; float m32; float m33; float m34;
    float m41; float m42; float m43; float m44;
};

struct TextureName {
    char name[64];
};

fn min(s32 a, s32 b) {
    if (a > b)
        return b;
    else
        return a;
};

fn getChunk6ATail(u8 c) {
    u32 length = c * 3;
    u32 size = length / 4;
    float remainder = length % 4;
    if (remainder) {
        return (size + 1) * 4 - length;
    }
    
    return size * 4 - length;
};

struct Normal {
    s8 a;
    s8 b;
    s8 c;
};

struct SmallVert {
    s16 x;
    s16 y;
    s16 z;
    s16 flag;  
};

struct Chunk {
    std::print("{}", std::mem::read_unsigned($+3, 1));
    if (std::mem::read_unsigned($+3, 1) != 0x65 && std::mem::read_unsigned($+3, 1) != 0x6A && std::mem::read_unsigned($+3, 1) != 0x6C && std::mem::read_unsigned($+3, 1) != 0x6D && std::mem::read_unsigned($+3, 1) != 0x6E && std::mem::read_unsigned($+3, 1) != 0x17 ) {
        break;
    }

    u16 headerFlags [[color("0")]];
    u8  count       [[color("0")]];
    u8  type        [[color("FFFFFF")]];

    if (type == 0x6D) {
        SmallVert verts[count] [[color("AAFFAA")]];
    }
    else if (type == 0x6E) {
        float table[count] [[color("0000FF")]];
    }
    else if (type == 0x6C) {
        if (headerFlags == 0xDC76) {
            u32 words6C[5] [[color("FF0000")]];
        } else if (headerFlags == 0x8001) {
            u32 words6C[count*4];
        } else {
            u8 something;
            u8 nothing[3];
            u32 words6C[3] [[color("FF0000")]];
        }
    }
    else if (type == 0x6A) {
        Normal normals[count] [[color("00FFFF")]];
        u8 p[getChunk6ATail(count)] [[color("0")]];
    }
    else if (type == 0x65) {
        u32 payload65[count] [[color("FF00FF")]];
    }
    else if (type == 0x17) {
        // maybe 'end marker' chunk — keep as-is
    } else {
        // unknown type → bail out of the array
        break;
    }
};


struct Bone {
    char name[128];
    Float4x4TransformMatrix rootMatrix [[color("99CCFF")]];
    float bounds[7];
    u32 parent_id;
};

struct Mesh {
    u32 id;
    u32 unk2;
    float unkfloat;
    u16 unk3;
    u16 unk4;
    u32 size;

    // Keep reading chunks while the next u32 is not 0x00000000
    try {
        Chunk chunks[while(std::mem::read_unsigned($ + 4, 4) != 0x00000000)];
    } catch {
        break;
    }
    
    std::print("size: {} $: {} addressof(size): {} {}", size, $, addressof(size), $-addressof(size));
    std::print("{}", size - ($ - addressof(size)) + 4);

    try {
        u8 tail[size - ($ - addressof(size)) + 4];
    } catch {
        break;
    }
};

struct Object {
    u32 flags;
    u32 mesh_count;
    Mesh meshes[mesh_count];
};

struct BatchTailEntry {
    u32 one;        // always 1 (so far)
    u32 length;     // L
    u8  data[length];
    u32 index_or_id;
};

struct Pattern {
    char file_ext[4]            [[color("FFCC00")]];
    u32  version                [[color("FFCC00")]];
    u32 bone_count                [[color("FFCCFF")]];
    Bone bones[bone_count];
    
    u32 texture_count                [[color("FFCCFF")]];

    TextureName textureTable[texture_count];

    float unkFloats4[4]         [[color("6666FF")]];
    u32   unkWords4[4]          [[color("6666FF")]];

    u32   object_count        [[color("FF6666")]];
    Object objects[object_count];
    
    try {
        BatchTailEntry tail;
    } catch {
        
    }
};

Pattern psg @ 0x00;