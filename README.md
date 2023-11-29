# SWE1R Mods

Welcome to the SWE1R Mods repository, a collection of modifications and tools for Star Wars Episode I: Racer assets. This repository focuses on enhancing your gaming experience by providing texture packs, track modifications, and tools for exporting and importing game assets.

## Installation

To install the mods, simply replace the corresponding files in `Star Wars Episode I Racer / data / lev01 /` with the mod files provided. You don't need to restart the game entirely; the changes take effect at the next restart or the start of a race.



## Tools

This repo contains unpack and repack scripts for each block, leveraging the groundwork laid by [JayFoxRox's swe1r-tools](https://github.com/OpenSWE1R/swe1r-tools) and [Olganix's Sw_Racer](https://github.com/Olganix/Sw_Racer/). Follow these steps to use the tools:

### Requirements

- [Node.js](https://nodejs.org/en)
- [Jimp](https://www.npmjs.com/package/jimp) package for image processing
- Place the asset files from `Star Wars Episode I Racer/data/lev01/` in the `tools/in/` folder

### How to Use

1. Run the `*_unpack.js` scripts in `tools/` using `node modelblock_unpack.js`, `node textureblock_unpack.js`, etc. to extract the contents of a .bin file into its respective asset folder.
2. Make any replacements in the `tools/../rep/` subfolder, following the structure of an existing dump. Texture and sprite replacements are expected to be PNG files.
3. Run the 'repack' script using `node modelblock_repack.js` to reserialize the extracted resources and replacements into a .bin block.
4. Copy the generated `.bin` file from `tools/out/` to your game folder at `Star Wars Episode I Racer / data / lev01 /`.

## Documentation

Explore the structure of each archive in the `docs` folder:

- [out_modelblock.bin](https://github.com/louriccia/SWE1R-Mods/blob/main/docs/modelblock.md)

## Texture Packs

### [Restored Textures](https://github.com/louriccia/SWE1R-Mods/tree/main/texture_packs/RestoredTextures)

Restore scrambled textures to their intended appearance in the N64 version of the game.

https://github.com/louriccia/SWE1R-Mods/blob/main/misc/restored_comparison.mp4

### [Bumpy's Broken Textures (Vol. 1)](https://github.com/louriccia/SWE1R-Mods/tree/main/texture_packs/BumpysBrokenTexturesVol1)

A collection of texture packs that alter colors, including inverted, greyscale, randomized, and more.

![grayarea](https://github.com/louriccia/SWE1R-Mods/assets/15792206/e8192093-4963-45f5-bf5c-e4e8767b47fc)
![darkmode](https://github.com/louriccia/SWE1R-Mods/assets/15792206/d286d6f7-b711-4708-8650-0e0918760812)
![magiceye](https://github.com/louriccia/SWE1R-Mods/assets/15792206/cab7b831-20c8-4ca6-a360-18a017d5c89e)
![invertedmode](https://github.com/louriccia/SWE1R-Mods/assets/15792206/bfc435d8-23df-4d81-9f00-116318ee90c3)


- **Dark Mode**: All textures completely blacked out
- **Gray Area**: All textures converted to grayscale
- **Inverted Mode**: All texture colors inverted
- **Light Mode**: All textures completely whitewashed
- **Magic Eye**: Texture pixels are scrambled
- **PaintBall Arena**: Colors are randomized

### [Bumpy's Broken Textures (Vol. 2)](https://github.com/louriccia/SWE1R-Mods/tree/main/texture_packs/BumpysBrokenTexturesVol2)

More broken texture packs with unique themes.

![simpleshading](https://github.com/louriccia/SWE1R-Mods/assets/15792206/eab0d8c7-52bb-4a4c-ade7-59b2c0e237e6)
![gamegreen](https://github.com/louriccia/SWE1R-Mods/assets/15792206/2f4d1337-e65e-4546-b5f3-a8147ce08feb)
![trongazza](https://github.com/louriccia/SWE1R-Mods/assets/15792206/e81df6b9-2166-4641-8556-183a1df8f0a5)

- **TronGazza**: Vaporwave aesthetic
- **GridBlock**: White fill, black outlines
- **SimpleShading**: Average color
- **ChubaCheckers**: Checkered pattern
- **BlueSand**: Hue shifted
- **PinkSand**: Hue shifted again
- **ThePhantomMatrix**: You are the one
- **GameGreen**: Original Game Boy colors
- **NintendoPodracingSystem**: NES colors

## Track Mods

### [Reversed Tracks](https://github.com/louriccia/SWE1R-Mods/tree/main/track_mods/Reverse%20Tracks)

Play your favorite tracks in reverse!

### [Size Matters Not](https://github.com/louriccia/SWE1R-Mods/tree/main/track_mods/SizeMattersNot)

Various track modifications to challenge your racing skills.

https://github.com/louriccia/SWE1R-Mods/blob/main/misc/smn_promo.mp4

- **Ronto-Sized**: Tracks are 1.9x scale
- **Jawa-Sized**: Tracks are 0.4x scale
- **Squash & Stretch**: Tracks squashed on x-axis, stretched on y-axis
- **Hallways & Hairpins**: Tracks stretched on x-axis, squashed on y-axis
- **Rise Over Run**: Tracks are on a 0.33x slope
- **Low Clearance**: Tracks squished on z-axis
- **Head Room**: Tracks exaggerated on z-axis
- **Bumpy Ride**: Track vertices are randomly offset
- **Flatooine**: Tracks are completely flattened
- **Australia Be Like**: Tracks are inverted on z-axis (mostly playable with some exceptions)

Enjoy the enhanced Star Wars Episode I: Racer experience with these mods!

Support the project by sending some truguts</br>

[![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/lightningpirate)
