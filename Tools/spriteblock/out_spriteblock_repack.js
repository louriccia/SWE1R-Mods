const fs = require('fs');
const Jimp = require('jimp');
const sprites = require('./out_spriteblock.json')

async function getReplacements() {
    let replacements = []

    for (let s = 0; s < 179; s++) {

        if (fs.existsSync('sprites/rep/' + s + '.png')) {
            let replacement = { index: s }
            console.log("found " + s + " replacement")
            const rep = await Jimp.read('sprites/rep/' + s + '.png').then(image => {
                new Promise(resolve => {
                    replacement.width = image.bitmap.width
                    replacement.height = image.bitmap.height
                    replacement.format = s == 99 ? 3 : sprites.sprites[s].format
                    replacement.palette_offset = 0
                    replacement.palette = []
                    replacement.page_count = 1
                    replacement.page_width = image.bitmap.width
                    replacement.page_height = image.bitmap.height
                    replacement.page_offset = 28
                    replacement.pixels = []
                    replacement.pages = []
                    replacement.pages[0] = {
                        width: image.bitmap.width,
                        height: image.bitmap.height,
                        pixels: []
                    }
                    for (i = replacement.height - 1; i >= 0; i--) {
                        for (j = 0; j < replacement.width; j++) {
                            let color = Object.values(Jimp.intToRGBA(image.getPixelColor(j, i)))
                            if ([512, 513].includes(replacement.format)) { //build palette
                                let pindex = null
                                replacement.palette.forEach((p, index) => {
                                    if (p[0] == color[0] && p[1] == color[1] && p[2] == color[2] && p[3] == color[3]) {
                                        pindex = index
                                    }
                                })
                                if (pindex == null && ((replacement.format == 512 && replacement.palette.length < 16) || (replacement.format == 513 && replacement.palette.length < 256))) {
                                    replacement.palette.push(color)
                                    replacement.pages[0].pixels.push(replacement.palette.length - 1)
                                } else {
                                    if (pindex == null) {
                                        pindex = 0
                                    }
                                    replacement.pages[0].pixels.push(pindex)
                                }
                            } else if ([1024, 1024].includes(replacement.format)) {
                                replacement.pages[0].pixels.push(color[0])
                            } else if (replacement.format == 3) {
                                replacement.pages[0].pixels.push(color)
                            }
                        }
                    }
                })
            })
            replacements[s] = replacement
        } else {
            replacements[s] = sprites.sprites[s]
        }
    }
    await Promise.all(replacements)
    return replacements

}


getReplacements().then(async function (replacements) {
    console.log("writing modified in_spriteblock.bin...")
    let cursor = 0
    let file = Buffer.alloc(3000000)
    let total = Object.keys(replacements).length
    file.writeUInt32BE(total, cursor) //write total number of sprites
    cursor += total * 4 + 8

    async function writeSprite(cursor, index) {
        console.log('writing binary for ', index)
        console.log(replacements.length)
        let rep = replacements[index]
        rep.offset = cursor
        file.writeUInt32BE(cursor, (4 + index * 4)) //write initial pointer

        //write header
        file.writeUInt16BE(rep.width, cursor)
        cursor += 2
        file.writeUInt16BE(rep.height, cursor)
        cursor += 2
        file.writeUInt16BE(rep.format, cursor)
        cursor += 4
        rep.palette_offset = cursor
        cursor += 4
        file.writeUInt16BE(rep.page_count, cursor)
        cursor += 2
        file.writeUInt16BE(32, cursor)
        cursor += 2
        file.writeUInt32BE(20, cursor)
        cursor += 4

        //write page info
        for (let p = 0; p < rep.pages.length; p++) {
            let page = rep.pages[p]
            file.writeUInt16BE(page.width, cursor)
            cursor += 2
            file.writeUInt16BE(page.height, cursor)
            cursor += 2
            rep.pages[p].offset = cursor
            cursor += 4
        }

        //write palette
        if ([512, 513].includes(rep.format)) {
            file.writeUInt32BE(cursor - rep.offset, rep.palette_offset) //write palette offset
            for (let j = 0; j < rep.palette.length; j++) {
                let p = rep.palette[j]
                let r = parseInt((p[0] / 255) * 0x1F) << 11
                let g = parseInt((p[1] / 255) * 0x1F) << 6
                let b = parseInt((p[2] / 255) * 0x1F) << 1
                let a = parseInt(p[3] / 255)
                let pal = (((r | g) | b) | a)
                file.writeUInt16BE(pal, cursor)
                cursor += 2
            }
        }

        //write pixels
        for (let p = 0; p < rep.pages.length; p++) {
            let page = rep.pages[p]
            await file.writeUInt32BE(cursor - rep.offset, page.offset) // write page offset
            if ([512, 1024].includes(rep.format)) {
                for (let i = 0; i < page.pixels.length / 2; i++) {
                    if (rep.format == 512) {
                        let pixela = (page.pixels[i * 2]) << 4
                        let pixelb = (page.pixels[i * 2 + 1])
                        let pixel = parseInt(pixela) | parseInt(pixelb)
                        file.writeUInt8(pixel, cursor)
                        cursor += 1
                    } else if (rep.format == 1024) {
                        let pixela = parseInt((page.pixels[i * 2]) / 0x11) << 4
                        let pixelb = parseInt((page.pixels[i * 2 + 1]) / 0x11)
                        let pixel = pixela | pixelb
                        file.writeUInt8(pixel, cursor)
                        cursor += 1

                    }
                }
            } else if ([513, 1025, 3].includes(rep.format)) {
                for (let i = 0; i < page.pixels.length; i++) {
                    let pixel = page.pixels[i]
                    if (rep.format == 3) {
                        for (let j = 0; j < 4; j++) {
                            file.writeUInt8((page.pixels[i][j]), cursor)
                            cursor += 1
                        }
                    } else {
                        file.writeUInt8(pixel, cursor)
                        cursor += 1
                    }
                }
            }
        }

        if (index < Object.keys(replacements).length - 2) {
            writeSprite(cursor, index + 1)
        } else {
            file.writeUInt32BE(cursor, (4 + total * 8))
        }

        return cursor
    }
    writeSprite(cursor, 0)

    fs.writeFileSync('sprites/out/out_spriteblock.bin', file);

})

