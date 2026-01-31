// Star Wars: Racer Revenge (.res) – exploratory ImHex pattern
// Based on observed layout: header -> pointer to (prelude + entry list + filenames)
// NOTE: Entry count is not confirmed, so set ENTRY_COUNT manually as needed.

#pragma endian little
#include <std/mem.pat>
#include <std/string.pat>

// ---- Tweak these ----
const u32 PRELUDE_SIZE = 0x14;
const u32 ENTRY_COUNT  = 112;   // <-- change this per file as needed (e.g., 10, 244, etc.)


// ---- Structures ----
struct ResHeader {
    u32 version;      // always 3 in your samples
    u32 unk1;         // varies (NOT confirmed count)
    u32 unk2;         // you often see 0x340 here, but meaning unknown
    u32 unk3;         // often 0
    u32 dir_ptr;      // points to PRELUDE_SIZE bytes before first filename
};

struct DirPrelude {
    // You’ve seen “random-looking” 16-bit values here.
    // In one file it looked like 10 u16; in another it looked like 8 u16 + u32.
    // We’ll just model a full 0x20-byte blob and you can inspect patterns.
    u8 raw[PRELUDE_SIZE];
    u32 total_entries;
};

struct DirEntry {
    
    u32 data_size;    // size-ish
    u32 name_len;

    // NOTE: name_len is dynamic. ImHex supports this style.
    char name[name_len];
    u32 data_off;     // offset-ish (absolute or relative base still TBD)
};

// ---- Parse ----
ResHeader header @ 0x0;

// Jump to directory pointer
DirPrelude prelude @ header.dir_ptr;

// Entries start right after the prelude
// If this doesn’t line up in a given file, try changing PRELUDE_SIZE (0x10, 0x18, 0x20)
u64 entries_start = header.dir_ptr + PRELUDE_SIZE +0x4;

// Parse a fixed number of entries so you can tune ENTRY_COUNT
DirEntry entries[prelude.total_entries] @ entries_start;

// ---- Optional: quick validation view ----
// This creates a list of just the filenames (helpful for scanning).
// If your ImHex build complains about this section, you can delete it.
struct NameOnly {
    
    u32 size;
    u32 len;
    char s[len];
    u32 off;
};

//NameOnly names[ENTRY_COUNT] @ entries_start;