const fs = require('fs');
const { write_block, write_sprite, unmake_image } = require('./block');

let replacements = []
for (let s = 0; s < 179; s++) {
    replacements[s] = new Promise((resolve, reject) => {
        fs.readFile(`sprites/${s}.json`, async (err, data) => {
            if (err) throw err;
            resolve(JSON.parse(data))
            return JSON.parse(data)
        })
    });
}

Promise.all(replacements).then((sprites) => {
    for (let s = 0; s < sprites.length; s++) {
        if (fs.existsSync('sprites/rep/' + s + '.png')) {
            console.log("found " + s + " replacement")
            sprites[s] = unmake_image({ path: 'sprites/rep/' + s + '.png', format: sprites[s].format, sprite: true })
        }
    }

    Promise.all(sprites).then((sprites) => {
        let file = write_block(
            {
                arr:
                    [
                        sprites.map(sprite => write_sprite(sprite)),
                    ]
            }
        )
        fs.writeFileSync('out/out_spriteblock.bin', file);
        console.log(`successfully repacked ${sprites.length} sprites to out/spriteblock.bin`)
    })
})




