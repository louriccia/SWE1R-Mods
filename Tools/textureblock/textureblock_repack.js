const fs = require('fs');
const Jimp = require('jimp');
const texdata = require('./textures/texdata.json')

let replacements = []

const rp = async _ => {
    for (r = 0; r < 1648; r++) {
        console.log(r)
        let replacement = { index: r }
        if (fs.existsSync('textures/rep/' + r + '.png')) {
            console.log("found " + r + " replacement")
            const image = await Jimp.read('textures/rep/' + r + '.png').then(image => {
                console.log('r', r)
                replacement.width = texdata[r].width
                replacement.height = texdata[r].height
                replacement.format = texdata[r].format
                replacement.palette_offset = 0
                replacement.palette = []
                replacement.pages = 1
                replacement.page_width = image.bitmap.width
                replacement.page_height = image.bitmap.height
                replacement.page_offset = 28
                replacement.pixels = []
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
                            if (pindex == null && ((replacement.format == 512 && replacement.palette.length < 16) || (replacement.format == 513 && replacement.palette.length < 255))) {
                                replacement.palette.push(color)
                                replacement.pixels.push(replacement.palette.length - 1)
                            } else {
                                if (pindex == null) {
                                    pindex = 0
                                }
                                replacement.pixels.push(pindex)
                            }
                        } else if (replacement.format == 1024) {
                            replacement.pixels.push(Math.floor(color[0] / 16) * 16)
                        } else if (replacement.format == 1025) {
                            replacement.pixels.push(color[0])
                        } else if (replacement.format == 3) {
                            replacement.pixels.push(color)
                        }
                    }
                }
            })
            replacements[r] = replacement
        } else if (fs.existsSync('textures/' + r + '.png')) {
            replacements[r] = texdata[r]
        }
    }
}

rp()

Promise.all(replacements).then(async replacements => {
    console.log("writing modified in_textureblock.bin...")
    let total = Object.keys(replacements).length

    let cursor = 0
    let file = Buffer.alloc(3000000)

    file.writeInt32BE(total, cursor) //write total number of textures
    cursor += total * 8 + 8

    async function writeTexture(cursor, index) {
        let rep = replacements[index]
        console.log('writing binary for ', index, rep.format)

        file.writeInt32BE(cursor, (4 + index * 8))

        if ([512, 1024].includes(rep.format)) {
            for (let i = 0; i < rep.pixels.length / 2; i++) {
                if (rep.format == 512) {
                    file.writeUInt8(parseInt((rep.pixels[i * 2]) << 4) | parseInt((rep.pixels[i * 2 + 1])), cursor)
                } else if (rep.format == 1024) {
                    file.writeUInt8((parseInt((rep.pixels[i * 2]) / 0x11) << 4) | (parseInt((rep.pixels[i * 2 + 1]) / 0x11)), cursor)
                }
                cursor++
            }
        } else if ([513, 1025, 3].includes(rep.format)) {
            for (let i = 0; i < rep.pixels.length; i++) {
                let pixel = rep.pixels[i]
                if (rep.format == 3) {
                    for (let j = 0; j < 4; j++) {
                        file.writeUInt8((rep.pixels[i][j]), cursor)
                        cursor++
                    }
                } else {
                    file.writeUInt8(pixel, cursor)
                    cursor++
                }
            }
        }
        if ([512, 513].includes(rep.format)) {
            file.writeInt32BE(cursor, (8 + index * 8))
            for (let j = 0; j < rep.palette.length; j++) {
                let p = rep.palette[j]
                let r = parseInt(((p[0]) / 255) * 0x1F) << 11
                let g = parseInt(((p[1]) / 255) * 0x1F) << 6
                let b = parseInt(((p[2]) / 255) * 0x1F) << 1
                let a = parseInt((p[3]) / 255)
                let pal = (((r | g) | b) | a)
                file.writeUInt16BE(pal, cursor)
                cursor += 2
            }
            if (index < Object.keys(replacements).length - 1) {
                writeTexture(cursor, index + 1)
            }
        } else {
            file.writeInt32BE(0, (8 + index * 8))
            if (index < Object.keys(replacements).length - 1) {
                writeTexture(cursor, index + 1)
            } else {
                file.writeInt32BE(cursor, (4 + total * 8))
            }
        }
        return cursor
    }

    writeTexture(cursor, 0)

    fs.writeFileSync('textures/out/out_textureblock.bin', file);

})