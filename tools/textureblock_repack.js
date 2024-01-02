const fs = require('fs');
const { read_texture, write_pixels, write_palette, write_block } = require('./block');
const {textures} = require('./_textures')

let replacements = []
for (r = 0; r < 1648; r++) {
    if (fs.existsSync('textures/rep/' + r + '.png')) {
        console.log("found " + r + " replacement")
        replacements[r] = read_texture({ path: 'textures/rep/' + r + '.png', data: textures[r] })
        
    } else if (fs.existsSync('textures/' + r + '.json')) {
        replacements[r] = new Promise((resolve, reject) => {
            fs.readFile(`textures/${r}.json`, async (err, data) => {
                if (err) throw err;
                resolve(JSON.parse(data))
                return JSON.parse(data)
            })
        });
    }
}

Promise.all(replacements).then((tex) => {
    let file = write_block(
        {
            arr:
                [
                    tex.map(texture => write_pixels({ pixels: texture.pixels, format: texture.format })),
                    tex.map(texture => write_palette({ palette: texture.palette }))
                ]
        }
    )
    fs.writeFileSync('out/out_textureblock.bin', file);
    console.log(`successfully repacked ${tex.length} textures to out/textureblock.bin`)
})