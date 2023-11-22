const fs = require('fs');
const Jimp = require('jimp');
const filePath = './in/pc/out_textureblock.bin'

if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
}

const file = fs.readFileSync(filePath) //this is the file located in the game's data/lev01/ folder
const { read_texture, read_block } = require('../block');
let [pixel_buffers, palette_buffers] = read_block({ file, arr: [[], []] })

/*
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
    */

for (t = 0; t < Object.keys(texdata).length; t++) {
    

    //get pixels
    tex.pixels = []

    if (tex.format == 513) {
        for (let i = tex.pixels_offset; i < tex.pixels_offset + (tex.width * tex.height); i++) {
            let pixel = null
            pixel = file.readUInt8(i)
            tex.pixels.push(pixel)
        }
    } else if (tex.format == 512) {
        for (let i = tex.pixels_offset; i < tex.pixels_offset + (tex.width * tex.height) / 2; i++) {
            let p = file.readUInt8(i)
            pixel_0 = (p >> 4) & 0xF
            pixel_1 = p & 0xF
            tex.pixels.push(pixel_0, pixel_1)
        }
    } else if (tex.format == 1024) {
        for (let i = tex.pixels_offset; i < tex.pixels_offset + (tex.width * tex.height) / 2; i++) {
            let p = file.readUInt8(i)
            pixel_0 = ((p >> 4) & 0xF) * 0x11
            pixel_1 = (p & 0xF) * 0x11
            tex.pixels.push(pixel_0, pixel_1)
        }
    } else if (tex.format == 1025) {
        for (let i = tex.pixels_offset; i < tex.pixels_offset + (tex.width * tex.height); i++) {
            let pixel = null
            pixel = file.readUInt8(i)
            tex.pixels.push(pixel)
        }
    } else if (tex.format == 3) {
        for (let i = tex.pixels_offset; i < tex.pixels_offset + (tex.width * tex.height) * 4; i += 4) {
            let pixel = null
            let r = file.readUInt8(i)
            let g = file.readUInt8(i + 1)
            let b = file.readUInt8(i + 2)
            let a = file.readUInt8(i + 3)
            pixel = [r, g, b, a]
            tex.pixels.push(pixel)
        }
    }
}

fs.writeFile("textures/texdata.json", JSON.stringify(texdata), (err) => {
    if (err) console.error(err)
});

console.log("drawing images...")
Object.keys(texdata).forEach((t, ind) => {
    let tex = texdata[t]
    console.log(tex.index)
    if (![undefined, null, ""].includes(tex.format) && ![tex.width, tex.height].includes("")) {
        let img = new Jimp(tex.width, tex.height, (err, image) => {
            console.log("drawing texture " + (ind + 1) + " of " + Object.keys(texdata).length + " : f: " + tex.format + " w: " + tex.width + " h: " + tex.height)

            for (let i = 0; i < tex.height; i++) {
                for (j = 0; j < tex.width; j++) {
                    let index = i * tex.width + j
                    let p = null
                    let color = null
                    if ([512, 513].includes(tex.format)) {
                        p = tex.palette[tex.pixels[index]]
                        color = Jimp.rgbaToInt(p[0], p[1], p[2], p[3])
                    } else if ([1024, 1025].includes(tex.format)) {
                        p = tex.pixels[index]
                        color = Jimp.rgbaToInt(p, p, p, 255)
                    } else if (tex.format == 3) {
                        p = tex.pixels[index]
                        color = Jimp.rgbaToInt(p[0], p[1], p[2], p[3])
                    }
                    let x = 0
                    //certain textures in the pc release are scrambled and must use the following code to be drawn correctly
                    if (i % 2 == 1 && [49, 58, 99, 924, 966, 972, 991, 992, 1000, 1048, 1064].includes(ind)) {
                        if (Math.floor(j / 8) % 2 == 0) {
                            x = 8
                        } else {
                            x = -8
                        }
                    }
                    image.setPixelColor(color, j + x, tex.height - 1 - i);

                }
            }

            img.write('textures/' + ind + '.png', (err) => {
                if (err) throw err;
            });
        })
    }
})