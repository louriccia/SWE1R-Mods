const fs = require('fs');
const { read_texture, write_pixels, write_palette, write_block } = require('../block');

let replacements = []
for (r = 0; r < 1648; r++) {
    if (fs.existsSync('rep/' + r + '.png')) {
        console.log("found " + r + " replacement")
        replacements[r] = read_texture({ path: 'rep/' + r + '.png' })
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

Promise.all(replacements).then((textures) => {
    let file = write_block(
        {
            arr:
                [
                    textures.map(texture => write_pixels({ pixels: texture.pixels, format: texture.format })),
                    textures.map(texture => write_palette({ palette: texture.palette }))
                ]
        }
    )
    fs.writeFileSync('out/out_textureblock.bin', file);
    console.log(`successfully repacked ${textures.length} textures to out/textureblock.bin`)

})