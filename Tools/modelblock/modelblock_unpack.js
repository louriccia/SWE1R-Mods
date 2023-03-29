const fs = require('fs');

const file = fs.readFileSync('out_modelblock.bin') //this is the file located in the game's data/lev01/ folder
let out_block = {}

let names = [
  "Anakin Skywalker",
  "The Boonta Classic",
  "Anakin Skywalker",
  "Teemto Pagalies",
  "Teemto Pagalies",
  "Sebulba",
  "Sebulba",
  "Ratts Tyerell",
  "Ratts Tyerell",
  "Aldar Beedo",
  "Aldar Beedo",
  "Mawhonic",
  "Mawhonic",
  "Ark 'Bumpy' Roose",
  "Ark 'Bumpy' Roose",
  "Wan Sandage",
  "Mars Guo",
  "Wan Sandage",
  "Mars Guo",
  "Ebe Endocott",
  "Ebe Endocott",
  "Dud Bolt",
  "Dud Bolt",
  "Gasgano",
  "Gasgano",
  "Clegg Holdfast",
  "Clegg Holdfast",
  "Elan Mak",
  "Elan Mak",
  "Neva Kee",
  "Neva Kee",
  "Bozzie Baranta",
  "Bozzie Baranta",
  "Boles Roor",
  "Boles Roor",
  "Ody Mandrell",
  "Ody Mandrell",
  "Fud Sang",
  "Fud Sang",
  "Ben Quadinaros",
  "Ben Quadinaros",
  "Slide Paramita",
  "Slide Paramita",
  "Toy Dampner",
  "Toy Dampner",
  "Bullseye Navior",
  "Bullseye Navior",
  "Aquilaris Vehicle",
  "Vehicle Select Flag",
  "AnakinPod_LightningBolt",
  "Control Linkage",
  "Control Shift Plate",
  "Control Vectro-Jet",
  "Control Coupling",
  "Control Nozzle",
  "Upgrade (no upgrade stats)",
  "Upgrade (no upgrade stats)",
  "Upgrade (no upgrade stats)",
  "Upgrade (no upgrade stats)",
  "Upgrade (no upgrade stats)",
  "Coffer",
  "Upgrade (no upgrade stats)",
  "Upgrade (no upgrade stats)",
  "Upgrade (no upgrade stats)",
  "Control Stabilizer",
  "Upgrade (no upgrade stats)",
  "Upgrade (no upgrade stats)",
  "Upgrade (no upgrade stats)",
  "Double Coffer",
  "Quad Coffer",
  "Pit Droid Hover Platform",
  "Guide Arrow",
  "plane",
  "plane",
  "plane",
  "plane",
  "PlanetA",
  "PlanetB",
  "PlanetC",
  "Tatooine",
  "Baroonda",
  "Moon",
  "Ovoo IV (Asteroid)",
  "Hangar",
  "Watto's Shop",
  "Watto's Junkyard",
  "Teemto Pagalies",
  "Anakin Skywalker",
  "Gasgano",
  "Mawhonic",
  "Ody Mandrell",
  "Sebulba",
  "Mars Guo",
  "Ratts Tyerell",
  "Ben Quadinaros",
  "Ebe Endocott",
  "Ark 'Bumpy' Roose",
  "Clegg Holdfast",
  "Dud Bolt",
  "Wan Sandage",
  "Elan Mak",
  "Toy Dampner",
  "Fud Sang",
  "Neva Kee",
  "Slide Paramita",
  "Aldar Beedo",
  "Bozzie Baranta",
  "Boles Roor",
  "Bullseye Navior",
  "Pit Droid",
  "Watto",
  "Dewback",
  "Ronto",
  "Jabba",
  "",
  "0-Boonta Training Course",
  "Mon Gazza",
  "Ando Prime",
  "Aquilaris",
  "Baroonda",
  "Trugut",
  "Malastare",
  "0-Ando Prime Centrum",
  "Flag First Blue",
  "Winner's Platform",
  "Flag Second Red",
  "Flag Third White",
  "StartOfTatooine",
  "0-Ando Prime Centrum",
  "3-Inferno",
  "2-Beedo's Wild Ride",
  "1-Howler Gorge",
  "3-Andobi Mountain Run",
  "3-Aquilaris Classic",
  "0-Sunken City",
  "6-Bumpy's Breakers",
  "3-Scrapper's Run",
  "4-Dethro's Revenge",
  "1-Abyss",
  "5-Baroo Coast",
  "2-Grabvine Gateway",
  "5-Fire Mountain Rally",
  "1-Mon Gazza Speedway",
  "6-Spice Mine Run",
  "4-Zugga Challenge",
  "5-Vengeance",
  "AnakinPod_LB_2plane",
  "Ball For Explosion",
  "0-Executioner",
  "Jabba's Spectator Booth",
  "Sebulba",
  "texturedCircle",
  "Jabba's place + racers",
  "Anakin Skywalker",
  "Cantina",
  "Opee Sea Killer",
  "Pods",
  "Mark II Air Brake",
  "Mark III Air Brake",
  "Mark IV Air Brake",
  "Mark V Air Brake",
  "Tri-Jet Air Brake",
  "Quadrijet Air Brake",
  "Coolant Radiator",
  "Stack-3 Radiator",
  "Stack-6 Radiator",
  "Rod Coolant Pump",
  "Dual Coolant Pump",
  "Turbo Coolant Pump",
  "Plug2 Thrust Coil",
  "Plug3 Thrust Coil",
  "Plug5 Thrust Coil",
  "Plug8 Thrust Coil",
  "Block5 Thrust Coil",
  "Block6 Thrust Coil",
  "HoloTable",
  "AndoPrime IceStub",
  "2-Beedo's Wild Ride",
  "1-Howler Gorge",
  "3-Andobi Mountain Run",
  "3-Aquilaris Classic",
  "0-Sunken City",
  "4-Malastare 100",
  "2-Dug Derby",
  "1-Sebulba's Legacy",
  "6-Bumpy's Breakers",
  "3-Scrapper's Run",
  "4-Dethro's Revenge",
  "1-Abyss",
  "1-Mon Gazza Speedway",
  "6-Spice Mine Run",
  "3-Inferno",
  "4-Zugga Challenge",
  "5-Vengeance",
  "0-Executioner",
  "2-The Gauntlet",
  "marker flag",
  "marker flag",
  "Dual 20 PCX Injector",
  "44 PCX Injector",
  "Dual 32 PCX Injector",
  "Quad 32 PCX Injector",
  "Quad 44 Injector",
  "Mag 6 Injector",
  "R-20 Repulsorgirp",
  "R-60 Repulsorgirp",
  "R-80 Repulsorgirp",
  "Aldar Beedo",
  "Anakin Skywalker",
  "Ben Quadinaros",
  "Boles Roor",
  "Bozzie Baranta",
  "Bullseye Navior",
  "Ark 'Bumpy' Roose",
  "Clegg Holdfast",
  "Dud Bolt",
  "Ebe Endocott",
  "Elan Mak",
  "Fud Sang",
  "Gasgano",
  "Ratts Tyerell",
  "Mars Guo",
  "Mawhonic",
  "Neva Kee",
  "Ody Mandrell",
  "Sebulba",
  "Slide Paramita",
  "Teemto Pagalies",
  "Toy Dampner",
  "Wan Sandage",
  "R-100 Repulsorgirp",
  "2-The Gauntlet",
  "4-Malastare 100",
  "2-Dug Derby",
  "Single Power Cell",
  "Dual Power Cell",
  "5-Baroo Coast",
  "Quad Power Cell",
  "Cluster Power Plug",
  "Rotary Power Plug",
  "Control Stabilizer",
  "R-300 Repulsorgirp",
  "R-600 Repulsorgirp",
  "Cluster 2 Power Plug",
  "Hammerhead",
  "Anakin",
  "Jar Jar Binks",
  "Jawa",
  "R2D2",
  "2-Grabvine Gateway",
  "5-Fire Mountain Rally",
  "Big Rock Explosion",
  "Small Rock Explosion",
  "Ord Ibanna",
  "Ice Explosion",
  "Sebulba",
  "Anakin Skywalker",
  "Teemto Pagalies",
  "Ratts Tyerell",
  "Aldar Beedo",
  "Mawhonic",
  "Ark 'Bumpy' Roose",
  "Wan Sandage",
  "Mars Guo",
  "Ebe Endocott",
  "Dud Bolt",
  "Gasgano",
  "Clegg Holdfast",
  "Elan Mak",
  "Neva Kee",
  "Bozzie Baranta",
  "Boles Roor",
  "Ody Mandrell",
  "Fud Sang",
  "Ben Quadinaros",
  "Slide Paramita",
  "Toy Dampner",
  "Bullseye Navior",
  "Tatooine Starting Line Bridge",
  "0-Boonta Training Course",
  "6-Boonta Classic",
  "AquilarisStadium",
  "StartOfOrdIbanna",
  "StartOfBaronda",
  "StartofMonGazza",
  "Part Of Oovo_Iv ForVideo",
  "Jabba's Observation Booth",
  "Logo LucasArt",
  "Pods + Character",
  "Pods + Character",
  "Pods + Character",
  "Pods + Character",
  "Pods + Character",
  "Anakin Skywalker",
  "flames",
  "for explosion (for who)",
  "Baroonda Branch Explosion",
  "Baroonda's Beach Animatedsea",
  "Jinn Reeso",
  "Jinn Reeso",
  "Cy Yunga",
  "Cy Yunga",
  "Jinn Reeso",
  "Cy Yunga",
  "Jinn Reeso",
  "Cy Yunga",
  "Rock Explosion",
  "for explosion (for who)",
  "Tatooine Balloon",
  "methane gass effect",
  "Starting Line Object",
  "magma explosion",
  "Mon Gazza Dozer",
  "",
  "",
  "1-Sebulba's Legacy",
  "AnakinPod_LightningBolt",
  "flames",
  "AnakinPod Explosion",
  "Qui Gon Jinn",
  "Textured Circle",
  "",
  "N64 Memory Expansion Pak",
]

let cursor = 0
out_block.addresses = []
out_block.unkheader = []
out_block.model_count = file.readInt32BE(cursor)
out_block.models = []

//get list of model addresses
for (let j = 0; j < out_block.model_count * 2 + 1; j++) {
  cursor = (j + 1) * 4
  let read = file.readInt32BE(cursor)
  out_block.addresses.push(read)
}

//get models
for (let j = 0; j < out_block.addresses.length - 1; j++) {
  if (j % 2 == 1) {
    cursor = out_block.addresses[j]
    let data = {}
    data.offset = cursor

    let local_offset = 0
    let modelstrings = []
    let modelstring = "string, float, int32, int16_1, int16_2, int8_1, int8_2, int8_3, int8_4, offset"
    modelstrings.push(modelstring)
    for (let i = cursor; i < out_block.addresses[j + 1]; i += 4) {
      data[i] = {}
      cursor = i
      data[i].string = file.toString('utf8', cursor, cursor + 4)
      data[i].string = data[i].string.replace(/\t/g, "").replace(/\n/g, "").replace(/\r/g, "").replace(/,/g, "").replace(/=/g, "")
      data[i].float = file.readFloatBE(cursor)
      data[i].int32 = file.readInt32BE(cursor)
      data[i].int16_1 = file.readInt16BE(cursor)
      cursor += 2
      data[i].int16_2 = file.readInt16BE(cursor)
      cursor -= 2
      data[i].int8_1 = file.readUInt8(cursor)
      cursor++
      data[i].int8_2 = file.readUInt8(cursor)
      cursor++
      data[i].int8_3 = file.readUInt8(cursor)
      cursor++
      data[i].int8_4 = file.readUInt8(cursor)
      data[i].offset = local_offset
      cursor++
      local_offset += 4
      modelstrings.push([data[i].string, data[i].float, data[i].int32, data[i].int16_1, data[i].int16_2, data[i].int8_1, data[i].int8_2, data[i].int8_3, data[i].int8_4, data[i].offset].join(", "))
    }

    let name = Math.floor(j / 2)
    fs.writeFile("models/dump/" + name + "_" + out_block.addresses[j] + ".csv", modelstrings.join('\n'), (err) => {
      if (err) console.error(err)
    })

    let data_keys = Object.keys(data)
    console.log("Model: " + Math.floor(j / 2))
    let model = {
      model: Math.floor(j / 2),
      name: names[Math.floor(j / 2)],
      extension: null,
      header: { head: [] },
      data: {},
      materials: {},
      textures: {}
    }
    let repeattracker = []
    for (i = 0; i < data_keys.length; i++) {
      let key = data_keys[i]
      if (i == 0) {
        model.extension = data[data_keys[0]].string
        i++
        let k = data[data_keys[i]].int32
        while (k !== -1) {
          model.header.head.push(k)
          i++
          k = data[data_keys[i]].int32
        }
      } else if (data[key].string == "Data") { //collect data
        i++
        let size = data[data_keys[i]].int32
        i++
        model.header.data = {}
        model.header.data.size = size
        for (k = 0; k < size; k++) {
          if (data[data_keys[i + k]].string == "LStr") {
            if (model.header.data.lightstreaks == undefined) {
              model.header.data.lightstreaks = []
            }
            model.header.data.lightstreaks.push(
              [data[data_keys[i + k + 1]].float, data[data_keys[i + k + 2]].float, data[data_keys[i + k + 3]].float]
            )
            k += 3
          } else {
            if (!model.header.data.other) {
              model.header.data.other = []
            }
            model.header.data.other.push(data[data_keys[i + k].int32])
          }
        }
        i = i + size - 1
      } else if (data[key].string == "Anim") { //collect animations
        i++
        let k = data[data_keys[i]].int32
        model.header.anim = []
        while (k) {
          let a = k / 4
          let anim = {
            float1: data[data_keys[a + 61]].float,
            float2: data[data_keys[a + 62]].float,
            float3: data[data_keys[a + 63]].float, //first three floats always match
            flag1: data[data_keys[a + 64]].int16_1, //always 4352
            flag2: data[data_keys[a + 64]].int16_2,
            num_keyframes: data[data_keys[a + 65]].int32,
            float4: data[data_keys[a + 66]].float,
            float5: data[data_keys[a + 67]].float,
            float6: data[data_keys[a + 68]].float, //always 1
            float7: data[data_keys[a + 69]].float, //always 0
            float8: data[data_keys[a + 70]].float, //always 0
            keyframe_times: data[data_keys[a + 71]].int32,
            keyframe_poses: data[data_keys[a + 72]].int32,
            target: data[data_keys[a + 73]].int32,
            unk32: data[data_keys[a + 74]].int32,
          }

          let keyframe_times = anim.keyframe_times / 4
          let keyframe_poses = anim.keyframe_poses / 4
          anim.keyframe_times = []
          anim.keyframe_poses = []
          if ([2, 18].includes(anim.flag2)) {
            anim.target = data[data_keys[anim.target / 4]].int32
          }
          for (let f = 0; f < anim.num_keyframes; f++) {
            if (keyframe_times) {
              anim.keyframe_times.push(data[data_keys[keyframe_times + f]].float)
            }
            if (keyframe_poses) {
              if ([8, 24, 40, 56, 4152].includes(anim.flag2)) { //rotation (4)
                anim.keyframe_poses.push([
                  data[data_keys[keyframe_poses + f * 4]].float,
                  data[data_keys[keyframe_poses + f * 4 + 1]].float,
                  data[data_keys[keyframe_poses + f * 4 + 2]].float,
                  data[data_keys[keyframe_poses + f * 4 + 3]].float
                ])
              } else if ([25, 41, 57, 4153].includes(anim.flag2)) { //position (3)
                anim.keyframe_poses.push([
                  data[data_keys[keyframe_poses + f * 3]].float,
                  data[data_keys[keyframe_poses + f * 3 + 1]].float,
                  data[data_keys[keyframe_poses + f * 3 + 2]].float
                ])
              } else if ([27, 28].includes(anim.flag2)) { //uv_x/uv_y (1)
                anim.keyframe_poses.push([
                  data[data_keys[keyframe_poses + f]].float
                ])
              } else if ([2, 18].includes(anim.flag2)) { //texture
                let tex = data[data_keys[keyframe_poses + f]].int32 / 4

                let animat = {
                  unk0: data[data_keys[tex]].int32,             //0, 1, 65, 73
                  unk1: data[data_keys[tex + 1]].int16_1,       //width * 4
                  unk2: data[data_keys[tex + 1]].int16_2,       //height * 4
                  unk3: data[data_keys[tex + 2]].int32,         //always 0
                  format: data[data_keys[tex + 3]].int16_1,     //3, 512, 513, 1024
                  unk4: data[data_keys[tex + 3]].int16_2,       //0, 4
                  width: data[data_keys[tex + 4]].int16_1,      //pixel width
                  height: data[data_keys[tex + 4]].int16_2,     //pixel height
                  unk5: data[data_keys[tex + 5]].int16_1,       //width * 512 (unsigned)
                  unk6: data[data_keys[tex + 5]].int16_2,       //height * 512 (unsigned)
                  unk7: data[data_keys[tex + 6]].int16_1,       //0 when unk4 is 4, 
                  unk8: data[data_keys[tex + 6]].int16_2,
                  unk_pointer1: data[data_keys[tex + 7]].int32,
                  unk_pointer2: data[data_keys[tex + 8]].int32,
                  unk_pointer3: data[data_keys[tex + 9]].int32,
                  unk_pointer4: data[data_keys[tex + 10]].int32,
                  unk_pointer5: data[data_keys[tex + 11]].int32,
                  unk_pointer6: data[data_keys[tex + 12]].int32,
                  unk_pointers: [],
                  unk9: data[data_keys[tex + 14]].int16_1,      //2560, 2815 is used when tex index is blank
                  tex_index: data[data_keys[tex + 14]].int16_2,
                  offset: tex * 4
                }

                let unk_pointers = [animat.unk_pointer1, animat.unk_pointer2, animat.unk_pointer3, animat.unk_pointer4, animat.unk_pointer5, animat.unk_pointer6]
                for (let p = 0; p < unk_pointers.length; p++) {
                  let pointer = unk_pointers[p] / 4
                  if (pointer) {
                    animat.unk_pointers.push({
                      unk0: data[data_keys[pointer]].int32,
                      unk1: data[data_keys[pointer + 1]].int32,
                      unk2: data[data_keys[pointer + 2]].int32,
                      unk3: data[data_keys[pointer + 3]].int16_1,
                      unk4: data[data_keys[pointer + 3]].int16_2,
                    })
                  }
                }
                if (tex < a) {
                  anim.keyframe_poses.push({ repeat: tex * 4 })
                } else {
                  anim.keyframe_poses.push(animat)
                }

              }
            }
          }
          model.header.anim.push(anim)
          i++
          k = data[data_keys[i]].int32
        }
      } else if (data[key].string == "AltN") { //get alt numbering
        i++
        let k = data[data_keys[i]].int32
        model.header.altn = []
        while (k) {
          model.header.altn.push(k)
          i++
          k = data[data_keys[i]].int32
        }
      } else if (data[key].string == "HEnd") { //after header, get all data
        i++
        function newNode(parent, c_address) {
          i = c_address / 4
          let new_parent = i * 4
          repeattracker.push(new_parent)

          if ([20580, 20581, 20582, 12388, 53348, 53349, 53350].includes(data[data_keys[i]].int32)) {
            let mesh_group = false
            parent[new_parent] = { head: [data[data_keys[i]].int32, data[data_keys[i + 1]].int32, data[data_keys[i + 2]].int32, data[data_keys[i + 3]].int32, data[data_keys[i + 4]].int32], children: {}, childlist: [], whitespace: {} }

            if (data[data_keys[i]].int32 == 12388) {
              mesh_group = true
              parent[new_parent].min_x = data[data_keys[i + 7]].float
              parent[new_parent].min_y = data[data_keys[i + 8]].float
              parent[new_parent].min_z = data[data_keys[i + 9]].float
              parent[new_parent].max_x = data[data_keys[i + 10]].float
              parent[new_parent].max_y = data[data_keys[i + 11]].float
              parent[new_parent].max_z = data[data_keys[i + 12]].float
            }
            if (data[data_keys[i]].int32 == 53349) {
              parent[new_parent].xyz = {
                ax: data[data_keys[i + 7]].float,
                ay: data[data_keys[i + 8]].float,
                az: data[data_keys[i + 9]].float,
                bx: data[data_keys[i + 10]].float,
                by: data[data_keys[i + 11]].float,
                bz: data[data_keys[i + 12]].float,
                cx: data[data_keys[i + 13]].float,
                cy: data[data_keys[i + 14]].float,
                cz: data[data_keys[i + 15]].float,
                x: data[data_keys[i + 16]].float,
                y: data[data_keys[i + 17]].float,
                z: data[data_keys[i + 18]].float,
                x1: data[data_keys[i + 19]].float,
                y1: data[data_keys[i + 20]].float,
                z1: data[data_keys[i + 21]].float
              }

            } else if (data[data_keys[i]].int32 == 53348) {
              parent[new_parent].xyz = {
                ax: data[data_keys[i + 7]].float,
                ay: data[data_keys[i + 8]].float,
                az: data[data_keys[i + 9]].float,
                bx: data[data_keys[i + 10]].float,
                by: data[data_keys[i + 11]].float,
                bz: data[data_keys[i + 12]].float,
                cx: data[data_keys[i + 13]].float,
                cy: data[data_keys[i + 14]].float,
                cz: data[data_keys[i + 15]].float,
                x: data[data_keys[i + 16]].float,
                y: data[data_keys[i + 17]].float,
                z: data[data_keys[i + 18]].float,
              }
            } else if (data[data_keys[i]].int32 == 20582) {
              parent[new_parent].xyz = {
                f1: data[data_keys[i + 7]].float,
                f2: data[data_keys[i + 8]].float,
                f3: data[data_keys[i + 9]].float,
                f4: data[data_keys[i + 10]].float,
                f5: data[data_keys[i + 11]].float,
                f6: data[data_keys[i + 12]].float,
                f7: data[data_keys[i + 13]].float,
                f8: data[data_keys[i + 14]].float,
                f9: data[data_keys[i + 15]].float,
                f10: data[data_keys[i + 16]].float,
                f11: data[data_keys[i + 17]].float
              }
            }
            let child_count = data[data_keys[i + 5]].int32
            if (data[data_keys[i]].int32 == 53350) {
              parent[new_parent]['53350'] = {
                unk1: data[data_keys[i + 7]].int32,
                unk2: data[data_keys[i + 8]].int32,
                unk3: data[data_keys[i + 9]].int32,
                unk4: data[data_keys[i + 10]].float
              }
            }
            if (child_count) {
              let child_addresses = []
              let header_i = i
              i = data[data_keys[i + 6]].int32 / 4 //set i to start of child addresses

              for (let c = 0; c < child_count; c++) {
                child_addresses.push(data[data_keys[i + c]].int32)
              }
              if ([20580, 53349].includes(data[data_keys[header_i]].int32)) {
                if (data[data_keys[i + child_count]].int32 == 0 && [20580, 53349].includes(data[data_keys[i + child_count + 1]].int32)) {
                  parent[new_parent].whitespace.before_head = 4
                }
              }
              parent[new_parent].childlist = child_addresses
              child_addresses.forEach(address => {
                if (address) {
                  if (repeattracker.includes(address) && address !== 0) { //repeat child
                    i = address / 4
                    parent[new_parent].children[i * 4] = { repeat: address }
                  } else {
                    if (mesh_group) {
                      i = address / 4
                      let header = {
                        collision: {
                          data: data[data_keys[i + 1]].int32,
                          vert_strips: data[data_keys[i + 9]].int32,
                          vert_buffer: data[data_keys[i + 11]].int32,
                          vertex_count: data[data_keys[i + 14]].int16_1
                        },
                        visuals: {
                          material: data[data_keys[i]].int32,
                          index_buffer: data[data_keys[i + 12]].int32,
                          vert_buffer: data[data_keys[i + 13]].int32,
                          vert_count: data[data_keys[i + 14]].int16_2,
                          group_parent: data[data_keys[i + 10]].int32,
                          group_count: data[data_keys[i + 15]].int16_2
                        },
                        min_x: data[data_keys[i + 2]].float,
                        min_y: data[data_keys[i + 3]].float,
                        min_z: data[data_keys[i + 4]].float,
                        max_x: data[data_keys[i + 5]].float,
                        max_y: data[data_keys[i + 6]].float,
                        max_z: data[data_keys[i + 7]].float,
                        vert_strip_count: data[data_keys[i + 8]].int16_1,
                        vert_strip_default: data[data_keys[i + 8]].int16_2,
                        whitespace: {}
                      }
                      if (data[data_keys[i + 16]].int32 == 0) {
                        header.whitespace.header = 4
                      }
                      //console.log(header)
                      if (header.collision.vert_strips) {
                        let vert_strips = header.collision.vert_strips / 4
                        header.collision.vert_strips = []
                        for (v = 0; v < header.vert_strip_count; v++) {
                          header.collision.vert_strips.push(data[data_keys[vert_strips + v]].int32)
                        }
                        if (data[data_keys[vert_strips + header.vert_strip_count]].int32 == 0) {
                          header.whitespace.vert_strips = 4
                        }
                      }
                      if (header.collision.vert_buffer) {
                        let vert_buffer = header.collision.vert_buffer / 4
                        header.collision.vert_buffer = []
                        if (model.model == 114) {
                          for (v = 0; v < header.collision.vertex_count * 3; v += 3) {
                            header.collision.vert_buffer.push(
                              [data[data_keys[vert_buffer + v]].float, data[data_keys[vert_buffer + v + 1]].float, data[data_keys[vert_buffer + v + 2]].float]
                            )
                          }
                        } else {
                          for (v = 0; v < header.collision.vertex_count * 3 / 2; v += 3) {
                            header.collision.vert_buffer.push(
                              [data[data_keys[vert_buffer + v]].int16_1, data[data_keys[vert_buffer + v]].int16_2, data[data_keys[vert_buffer + v + 1]].int16_1],
                              [data[data_keys[vert_buffer + v + 1]].int16_2, data[data_keys[vert_buffer + v + 2]].int16_1, data[data_keys[vert_buffer + v + 2]].int16_2]
                            )
                          }
                          if (data[data_keys[vert_buffer + Math.ceil(header.collision.vertex_count * 3 / 2)]].int32 == 0) {
                            header.whitespace.collision_vert_buffer = 4
                          }
                        }

                      }
                      if (header.visuals.index_buffer) {
                        let index_buffer = header.visuals.index_buffer / 4
                        header.visuals.index_buffer = []
                        let v = 0
                        while (data[data_keys[index_buffer + v]].int8_1 !== 223) {
                          let type = data[data_keys[index_buffer + v]].int8_1
                          let push = { type: type }
                          if (type == 1) {
                            push.unk1 = data[data_keys[index_buffer + v]].int8_2
                            push.unk2 = data[data_keys[index_buffer + v]].int8_3
                            push.unk3 = data[data_keys[index_buffer + v]].int8_4
                            push.start = (data[data_keys[index_buffer + v + 1]].int32 - header.visuals.vert_buffer) / 16
                          } else if (type == 3) {
                            push.unk = data[data_keys[index_buffer + v + 1]].int8_4
                          } else if (type == 5) {
                            push.x = data[data_keys[index_buffer + v]].int8_2
                            push.y = data[data_keys[index_buffer + v]].int8_3
                            push.z = data[data_keys[index_buffer + v]].int8_4
                          } else if (type == 6) {
                            push.x1 = data[data_keys[index_buffer + v]].int8_2
                            push.y1 = data[data_keys[index_buffer + v]].int8_3
                            push.z1 = data[data_keys[index_buffer + v]].int8_4
                            push.x2 = data[data_keys[index_buffer + v + 1]].int8_2
                            push.y2 = data[data_keys[index_buffer + v + 1]].int8_3
                            push.z2 = data[data_keys[index_buffer + v + 1]].int8_4
                          }
                          header.visuals.index_buffer.push(push)
                          v += 2
                        }

                      }
                      if (header.visuals.vert_buffer) {
                        let vert_buffer = header.visuals.vert_buffer / 4
                        header.visuals.vert_buffer = []
                        for (v = 0; v < header.visuals.vert_count * 4; v += 4) {
                          header.visuals.vert_buffer.push(
                            {
                              x: data[data_keys[vert_buffer + v]].int16_1,
                              y: data[data_keys[vert_buffer + v]].int16_2,
                              z: data[data_keys[vert_buffer + v + 1]].int16_1,
                              uv_x: data[data_keys[vert_buffer + v + 2]].int16_1,
                              uv_y: data[data_keys[vert_buffer + v + 2]].int16_2,
                              v_color: [data[data_keys[vert_buffer + v + 3]].int8_1, data[data_keys[vert_buffer + v + 3]].int8_2, data[data_keys[vert_buffer + v + 3]].int8_3, data[data_keys[vert_buffer + v + 3]].int8_4]
                            }
                          )
                        }
                      }
                      parent[new_parent].children[i * 4] = header
                      let material = parent[new_parent].children[i * 4].visuals.material
                      if (material) {
                        let mat = material / 4

                        let mat_stuff = {
                          offset: material,
                          format: data[data_keys[mat]].int32,
                          // 0000100 format 4 is only used for engine trail, binder, and flame effects
                          // 0000110 format 6 seems to indicate doublesidedness
                          // 0000111 format 7
                          // 0001100 format 12 is for any kind of skybox material
                          // 0001110 14/15/71 are used for a majority
                          // 0001111 15
                          // 1000110 70
                          // 1000111 71
                          // 0010111 23/31/87 are used exclusively with texture 35 possibly for sheen
                          // 0011111
                          // 1010111

                          texture_data: data[data_keys[mat + 2]].int32,
                          unk_data: data[data_keys[mat + 3]].int32,
                        }
                        if (mat_stuff.texture_data) {
                          let tex = mat_stuff.texture_data / 4
                          mat_stuff.texture_data = {
                            offset: tex * 4,
                            unk0: data[data_keys[tex]].int32,             //0, 1, 65, 73
                            unk1: data[data_keys[tex + 1]].int16_1,       //width * 4
                            unk2: data[data_keys[tex + 1]].int16_2,       //height * 4
                            unk3: data[data_keys[tex + 2]].int32,         //always 0
                            format: data[data_keys[tex + 3]].int16_1,     //3, 512, 513, 1024
                            unk4: data[data_keys[tex + 3]].int16_2,       //0, 4
                            width: data[data_keys[tex + 4]].int16_1,      //pixel width
                            height: data[data_keys[tex + 4]].int16_2,     //pixel height
                            unk5: data[data_keys[tex + 5]].int16_1,       //width * 512 (unsigned)
                            unk6: data[data_keys[tex + 5]].int16_2,       //height * 512 (unsigned)
                            unk7: data[data_keys[tex + 6]].int16_1,       //0 when unk4 is 4, 
                            unk8: data[data_keys[tex + 6]].int16_2,
                            unk_pointer1: data[data_keys[tex + 7]].int32,
                            unk_pointer2: data[data_keys[tex + 8]].int32,
                            unk_pointer3: data[data_keys[tex + 9]].int32,
                            unk_pointer4: data[data_keys[tex + 10]].int32,
                            unk_pointer5: data[data_keys[tex + 11]].int32,
                            unk_pointer6: data[data_keys[tex + 12]].int32,
                            unk_pointers: [],
                            unk9: data[data_keys[tex + 14]].int16_1,      //2560, 2815 is used when tex index is blank
                            tex_index: data[data_keys[tex + 14]].int16_2,
                          }
                          model.textures[tex * 4] = mat_stuff.texture_data

                          let unk_pointers = [mat_stuff.texture_data.unk_pointer1, mat_stuff.texture_data.unk_pointer2, mat_stuff.texture_data.unk_pointer3, mat_stuff.texture_data.unk_pointer4, mat_stuff.texture_data.unk_pointer5, mat_stuff.texture_data.unk_pointer6]
                          for (let p = 0; p < unk_pointers.length; p++) {
                            let pointer = unk_pointers[p] / 4
                            if (pointer) {
                              mat_stuff.texture_data.unk_pointers.push({
                                unk0: data[data_keys[pointer]].int32,
                                unk1: data[data_keys[pointer + 1]].int32,
                                unk2: data[data_keys[pointer + 2]].int32,
                                unk3: data[data_keys[pointer + 3]].int16_1,
                                unk4: data[data_keys[pointer + 3]].int16_2,
                              })
                            }
                          }

                        }
                        if (mat_stuff.unk_data) {
                          let tex = mat_stuff.unk_data / 4
                          mat_stuff.unk_data = {
                            unk0: data[data_keys[tex]].int16_1, //always 0
                            unk1: data[data_keys[tex]].int16_2, //0, 1, 8, 9   
                            unk2: data[data_keys[tex + 1]].int16_1, //1, 2
                            unk3: data[data_keys[tex + 1]].int16_2, //287, 513, 799, 1055, 1537, 7967
                            unk4: data[data_keys[tex + 2]].int16_1, //287, 799, 1055, 3329, 7939, 7940
                            unk5: data[data_keys[tex + 2]].int16_2, //263, 513, 775, 1031, 1537, 1795, 1799
                            unk6: data[data_keys[tex + 3]].int16_1, //1, 259, 263, 775, 1031, 1793, 1795, 1796, 1798, 
                            unk7: data[data_keys[tex + 3]].int16_2, //31, 287, 799, 1055, 7967
                            unk8: data[data_keys[tex + 4]].int16_1, //31, 799, 1055, 7936, 7940
                            unk9: data[data_keys[tex + 4]].int16_2, //7, 1799
                            unk10: data[data_keys[tex + 5]].int16_1, //775, 1031, 1792, 1796, 1798
                            unk11: data[data_keys[tex + 5]].int16_2, //always 0
                            unk12: data[data_keys[tex + 6]].int16_1, //-14336, 68, 3080
                            unk13: data[data_keys[tex + 6]].int16_2, //0, 1, 8200, 8312
                            unk14: data[data_keys[tex + 7]].int16_1, //16, 17, 770
                            unk15: data[data_keys[tex + 7]].int16_2, //120, 8200, 8248, 8296, 8312, 16840, 16856, 16960, 17216, 18760, 18768, 18808, 18809, 18888, 18904, 18936, 19280, 20048
                            unk16: data[data_keys[tex + 8]].int16_1, //probably 0?
                            r: data[data_keys[tex + 8]].int8_3,
                            g: data[data_keys[tex + 8]].int8_4,
                            b: data[data_keys[tex + 9]].int8_1,
                            t: data[data_keys[tex + 9]].int8_2,
                            unk17: data[data_keys[tex + 9]].int16_2,
                            unk18: data[data_keys[tex + 10]].int16_1,
                            unk19: data[data_keys[tex + 10]].int16_2,
                            unk20: data[data_keys[tex + 11]].int16_1,
                            unk21: data[data_keys[tex + 11]].int16_2,
                            unk22: data[data_keys[tex + 12]].int16_1,
                            unk23: data[data_keys[tex + 12]].int16_2
                          }
                          if (data[data_keys[tex + 13]].int32 == 0) {
                            header.whitespace.visuals_material = 4
                          }
                          if (mat_stuff.unk_data &&
                            mat_stuff.unk_data.unk22 &&
                            mat_stuff.unk_data.unk23) {
                            mat_stuff.unk_data.length = 3
                          } else if (mat_stuff.unk_data &&
                            mat_stuff.unk_data.unk24 &&
                            mat_stuff.unk_data.unk25) {
                            mat_stuff.unk_data.length = 3
                          } else if (mat_stuff.unk_data &&
                            !mat_stuff.unk_data.unk24 &&
                            !mat_stuff.unk_data.unk25) {
                            mat_stuff.unk_data.length = 4
                          }
                        }
                        model.materials[material] = mat_stuff
                        parent[new_parent].children[i * 4].visuals.material = mat_stuff
                      }
                      let col_data = parent[new_parent].children[i * 4].collision.data
                      if (col_data) {
                        let col = col_data / 4
                        let col_stuff = {
                          unk: data[data_keys[col]].int16_1,          //2, 4, 16, 18, 20, 32, 36
                          fog: {
                            flag: data[data_keys[col]].int8_3,        //0, 1, 2, 3, 4, 5, 7, 11, 12
                            r: data[data_keys[col]].int8_4,
                            g: data[data_keys[col + 1]].int8_1,
                            b: data[data_keys[col + 1]].int8_2,
                            start: data[data_keys[col + 1]].int16_2,
                            end: data[data_keys[col + 2]].int16_1     //1000 - 6000
                          },
                          lights: {
                            flag: data[data_keys[col + 2]].int16_2,   //0, 1, 3, 6, 7, 11, 15, 23
                            ambient_r: data[data_keys[col + 3]].int8_1,
                            ambient_g: data[data_keys[col + 3]].int8_2,
                            ambient_b: data[data_keys[col + 3]].int8_3,
                            r: data[data_keys[col + 3]].int8_4,
                            g: data[data_keys[col + 4]].int8_1,
                            b: data[data_keys[col + 4]].int8_2,
                            unk1: data[data_keys[col + 4]].int8_3,
                            unk2: data[data_keys[col + 4]].int8_4,
                            x: data[data_keys[col + 5]].float,
                            y: data[data_keys[col + 6]].float,
                            z: data[data_keys[col + 7]].float,
                            unk3: data[data_keys[col + 8]].float,   //-1, 0, 1
                            unk4: data[data_keys[col + 9]].float,   //-1, 0, 1
                            unk5: data[data_keys[col + 10]].float   //always 0
                          },
                          flags: data[data_keys[col + 11]].int32, // >>> 0).toString(2),
                          unk2: data[data_keys[col + 12]].int32,
                          unload: data[data_keys[col + 13]].int32, // >>> 0).toString(2),
                          load: data[data_keys[col + 14]].int32, // >>> 0).toString(2),
                          triggers: data[data_keys[col + 15]].int32
                        }
                        if (col_stuff.triggers) {
                          let next = col_stuff.triggers / 4
                          col_stuff.triggers = []
                          while (next) {
                            col_stuff.triggers.push({
                              x: data[data_keys[next]].float,
                              y: data[data_keys[next + 1]].float,
                              z: data[data_keys[next + 2]].float,
                              vx: data[data_keys[next + 3]].float,
                              vy: data[data_keys[next + 4]].float,
                              vz: data[data_keys[next + 5]].float,
                              width: data[data_keys[next + 6]].float,
                              height: data[data_keys[next + 7]].float,
                              target: data[data_keys[next + 8]].int32,
                              flag: data[data_keys[next + 9]].int16_1,
                              next: data[data_keys[next + 10]].int32
                            })
                            next = data[data_keys[next + 10]].int32 / 4
                          }
                        }
                        parent[new_parent].children[i * 4].collision.data = col_stuff
                      }

                    } else {
                      newNode(parent[new_parent].children, address)
                    }
                  }
                }


              })

            }

          }
        }

        if (model.extension == "MAlt" && model.header.altn.length > 0) {
          model.header.altn.forEach(altn => {
            newNode(model.data, altn)
          })
        } else {
          newNode(model.data, i * 4)
        }
        i = data_keys.length
      }
    }


    fs.writeFile("models/new/" + model.model + ".json", JSON.stringify(model), (err) => {
      if (err) console.error(err)
    })

  }


}
