# SWE1R Mods
 
This is a collection of mods for Star Wars Episode I: Racer using mass manipulation of the game's archives:  
`out_modelblock.bin`  
`out_textureblock.bin`  
`out_splineblock.bin`  
`out_spriteblock.bin`  

To install these mods, just swap out your files in `Star Wars Episode I Racer / data / lev01 /` with the files included in the mod. To apply the mod, you do not need to completely restart your game. You can swap out files on the fly while the game is running and they will take effect at the next restart/start  of a race.

Send me some truguts:  
https://ko-fi.com/lightningpirate

## Tools

For each block, there is an unpack and repack script. Unpack scripts dump the game's bin files into human-readable json structure and png files (for sprites and textures). Repack scripts compile extracted json/png files into game-readable bin format while allowing for replacements and in-place modifications. These tools build off of the work of [JayFoxRox's swe1r-tools](https://github.com/OpenSWE1R/swe1r-tools) and [Olganix's Sw_Racer](https://github.com/Olganix/Sw_Racer/). 

### Requirements

* [node js](https://nodejs.org/en)
* [jimp](https://www.npmjs.com/package/jimp) package for working with images
* bin files from `Star Wars Episode I Racer / data / lev01 /` must be copied to their respective folders in tools. (`out_modelblock.bin` goes in `modelblock`, etc.)

### How to use

* Run the 'unpack' script using `node modelblock_unpack.js` in the terminal to dump the contents of a .bin file into the `models` folder. 
* Add any replacements to the `rep` subfolder while mimicking the structure of an existing dump. The replacement should be named the index of whatever resource it wishes to replace. Texture and sprite replacements expect a png of specific size, width, and color depth. 
* Run the 'repack' script using `node modelblock_repack.js` to repack the dumped resources and any replacements into a .bin block. The output will appear in the `out` subfolder.
* Copy the .bin to your game folder at `Star Wars Episode I Racer / data / lev01 /`

## Documentation
The structure of each archive is documented in `docs`. 

[out_modelblock.bin](https://github.com/louriccia/SWE1R-Mods/blob/main/docs/modelblock.md)

## Texture Packs

### [Bumpy's Broken Textures (Vol. 1)](https://github.com/louriccia/SWE1R-Mods/tree/main/Texture%20Packs/BumpysBrokenTexturesVol1)
A collection of weird texture packs that mess with the colors of the existing textures including inverted, greyscale, randomized, and more. 

**Dark Mode** - all textures completely blacked out  
**Gray Area** - all textures converted to grayscale  
**Inverted Mode** - all texture colors inverted  
**Light Mode** - all textures completely whitewashed  
**Magic Eye** - texture pixels are scrambled  
**PaintBall Arena** - colors are randomized  

### [Bumpy's Broken Textures (Vol. 2)](https://github.com/louriccia/SWE1R-Mods/tree/main/Texture%20Packs/BumpysBrokenTexturesVol2)
Even more broken texture packs! Grids, checkerboards, old-school graphics, simplified, and more!

**Dark Mode** - all textures completely blacked out  
**Gray Area** - all textures converted to grayscale  
**Inverted Mode** - all texture colors inverted  
**Light Mode** - all textures completely whitewashed  
**Magic Eye** - texture pixels are scrambled  
**PaintBall Arena** - colors are randomized  


## Track Mods

### [Size Matters Not](https://github.com/louriccia/SWE1R-Mods/tree/main/Track%20Mods/SizeMattersNot)

**Ronto-Sized** - Tracks are 1.9x scale (tilting should help resolve issues with falling through collision)  
**Jawa-Sized** - Tracks are 0.4x scale  
**Squash & Stretch** - Tracks squashed on x axis, stretched on y axis  
**Hallways & Hairpins** - Tracks stretched on x axis, squashed on y axis  
**Rise Over Run** - Tracks are on a 0.33x slope  
**Low Clearance** - Tracks squished on z axis  
**Head Room** - Tracks exaggerated on z axis  
**Bumpy Ride** - Track vertices are randomly offset  
**Flatooine** - Tracks are completely flattened, fall collision tag is removed  
**Australia Be Like** - Tracks are inverted on z axis (mostly playable except a handful of soft locks and janky respawns)  
