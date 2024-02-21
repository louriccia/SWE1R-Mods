# Overview
out_textureblock.bin is an archive containing 1648 pixel buffers and, for most textures, palette buffers and can be found in `Star Wars Episode I Racer/data/lev01`. Given an index, the game will load the corresponding model from this archive every time that it is needed.

The goal of this documentation is to give a comprehensive understanding of how out_textureblock.bin is structured and how its contents can be modified.

# Header
out_textureblock.bin's header contains the number of textures followed by a pair of offsets for every texture, each stored as UInt32. In this case, 'offset' refers to the number of bytes relative to the start of out_textureblock.bin. The first of each pair of offsets for each texture points to its pixel buffer. This is always a nonzero value since every texture must have a pixel buffer. The second of each pair of offsets points to the palette buffer. The palette buffer offset may be 0 since certain texture formats do not need a palette. After a pair of offsets is given for every texture, a final offset points to the end of out_textureblock.bin.

Note that nowhere in textureblock.bin is there width, height, or format data for textures. This data is kept in modelblock.bin within the texture data for a material. To properly construct a texture outside of the game, we need this data from modelblock.bin for each texture. This is provided in `../tools/_textures.js`.

# Texture Formats
There are 5 texture formats that SWE1RCR.EXE uses for textures and sprites:

| Decimal | Hex   | Pixel Buffer                                  | Palette | Colors | Usage                      |
| ------- | ----- | --------------------------------------------- | ------- | ------ | -------------------------- |
| 3       | 0x3   | tuple of R G B A values (each 2 byte integer) | No      | Any    | lens flares and suns       |
| 512     | 0x200 | 1 byte integer index of palette buffer        | Yes     |        | used for flags and engines |
| 513     | 0x201 | 8 bit integer index of palette buffer        | Yes     |        |                            |
| 1024    | 0x400 |                                               | No      |        |                            |
| 1025    | 0x401 |                                               | No      |        |                            |

Format 3 / 0x3: 
No palette
pixel data consists of tuple of R G B A values (each 2 byte integer)
used for lens flares and suns
Format 512 / 0x200:
Palette
16
each pixel (2 byte integer) points to a color in the palette
used for flags and engines
Format 513 / 0x201:
Palette
each pixel (1 byte integer) points to a color in the palette 
used for boost bar, position flags, racer/planet portraits, and logos
Format 1024 / 0x400
No palette
Only contains one channel (2 byte integer) (greyscale), acts as alpha
used for menu element borders and fills which are later tinted in-game
Format 1025 / 0x401
No palette
Only contains one channel (1 byte integer) (greyscale), acts as alpha
Only used for one sprite (168)

# Pixel Buffer

# Palette Buffer

