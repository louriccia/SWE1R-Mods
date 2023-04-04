# SWE1R Modding Tools

For each block, there is an unpack and repack script. Unpack scripts dump the game's bin files into human-readable json structure and png files (for sprites and textures). Repack scripts take the extracted data from the unpack script and compile them into game-readable bin format while allowing for replacements and in-place modifications. These tools build off of the work of [JayFoxRox's swe1r-tools](https://github.com/OpenSWE1R/swe1r-tools) and [Olganix's Sw_Racer](https://github.com/Olganix/Sw_Racer/). 

## Requirements

* [node js](https://nodejs.org/en)
* [jimp](https://www.npmjs.com/package/jimp) package for working with images
* bin files from `Star Wars Episode I Racer / data / lev01 /` must be coppied to their respective folders in tools. (`out_modelblock.bin` goes in `modelblock`, etc.)

## How to use

* Run the 'unpack' script using `node modelblock_unpack.js` in the terminal to dump the contents of the provided .bin file into the `models` folder. 
* Add any replacements to the `rep` subfolder while mimicking the structure of an existing dump. The replacement should be named the index of whatever resource it wishes to replace. Texture and sprite replacements expect a png of specific size, width, and color depth. 
* Run the 'repack' script using `node modelblock_repack.js` to repack the dumped resources and any replacements into a .bin block. The output will appear in the `out` subfolder.