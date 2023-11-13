# Overview
out_modelblock.bin is an archive containing 323 3D models and can be found in `Star Wars Episode I Racer/data/lev01`. Given an index, the game will load the corresponding model from this archive every time that it is needed.

The goal of this documentation is to give a comprehensive understanding of how out_modelblock.bin is structured and how its contents can be modified.

# Header
out_modelblock.bin's header contains the number of models followed by a pair of offsets for every model. In this case, 'offset' refers to the number of bytes relative to the start of out_modelblock.bin. The first of each pair of offsets for each model points to a 'map' in which each bit represents 4 bytes in the following model. If the bit is 1, that corresponding UInt32 is to be read as an offset. The second of each pair of offsets points to the actual model data.  After a pair of offsets is given for every model, a final offset points to the end of out_modelblock.bin.

| offset | type   | value     | description                                        |
| ------ | ------ | --------- | -------------------------------------------------- |
| 0x0    | UInt32 | 0x143     | There are 0x143 (323) models in this archive       |
| 0x4    | UInt32 | 0xA20     | The first model's 'offset map' starts at 0xA20     |
| 0x8    | UInt32 | 0xD1C     | The first model's data starts at 0xD1C             |
| 0xC    | UInt32 | 0x6C34    | The second model's 'offset map' starts at 0x6C34   |
| 0x10   | UInt32 | 0xC728    | The second model's data starts at 0xC728           |
| 0x14   | UInt32 | 0xC255C   | The third model's 'offset map' starts at 0xC255C   |
| 0x18   | UInt32 | 0xC2CDC   | The third model's data starts at 0xC2CDC           |
| ...    |        |           |                                                    |
| 0xA14  | UInt32 | 0x1348E14 | The final model's 'offset map' starts at 0x1348E14 |
| 0xA18  | UInt32 | 0x1348E90 | The final model's data starts at 0x1348E90         |
| 0xA1C  | UInt32 | 0x1349DB8 | out_modelblock.bin ends at 0x1349DB8               |
|        |        |           | **End of header**                                  |
| 0xA20  | binary | 01111111  | The start of model 1's 'offset map'                |
| ...    |        |           |                                                    |

# Model
Going forward, we'll use the following terms to distinguish between the two kinds of offsets:</br>
*Global offset* - the number of bytes relative to out_modelblock.bin</br>
*Local offset* - the number of bytes relative to the start of a given model in out_modelblock.bin

There are only 647 global offsets (all given in the header), but many many local offsets within each model - each one indicating the start of a parent, or node, or collision data, or vertex data, etc.

## Offset Map
Every model in out_modelblock.bin is preceded by a bit string that points out 4-byte values in the model data that should be parsed as an offset. 

For example, the first model in out_modelblock.bin has an offset map that begins like this at global offset 0xA20:
| local offset | hex  | binary       |
| ------------ | ---- | ------------ |
| 0x0          | 0x7F | **01111111** |
| 0x1          | 0xFF | 11111111     |
| 0x2          | 0xFF | 11111111     |
| 0x3          | 0xFF | 11111111     |
| ...          |

These bits can be mapped to the start of the actual model data at global offset 0xD1C to reveal values that are to be read as offsets:
| local offset | hex value  | description                | offset map bit |
| ------------ | ---------- | -------------------------- | -------------- |
| 0x0          | 0x4D416C74 | "MAlt", the file extension | **0**          |
| 0x4          | 0x0        | a null offset              | **1**          |
| 0x8          | 0x0        | a null offset              | **1**          |
| 0xC          | 0x0        | a null offset              | **1**          |
| 0x10         | 0x0        | a null offset              | **1**          |
| 0x14         | 0x0        | a null offset              | **1**          |
| 0x18         | 0x0        | a null offset              | **1**          |
| 0x1C         | 0x0        | a null offset              | **1**          |
| ...          |

Notice that the first set of 4 bytes, the extension, is marked with a 0 to indiciate it is not an offset. The following 7 UInt32's are all marked with 1's to indicate they are offsets. Even though they are all null offsets, it seems the function reponsible for parsing the model data still expects these null offsets to be flagged. 

## Model Types
There are 7 extensions that indicate the context for which a model should be used. The extension is always given at the very start of the model structure.

| extension | header size (bytes) | count of models | description                                                      |
| --------- | ------------------- | --------------- | ---------------------------------------------------------------- |
| MAlt      | 300                 | 24              | high poly pods for the player character                          |
| Modl      | 4                   | 9               | various one-off animated elements                                |
| Part      | 8 - 20              | 183             | non-animated elements                                            |
| Podd      | 300                 | 26              | mid/low poly pod models, flap animations, how many engines, etc. |
| Pupp      | 36                  | 38              | animated characters, each with a similar set of animations       |
| Scen      | 332                 | 18              | animated scenes; (possibly unused in pc version)                 |
| Trak      | 24                  | 25              | tracks                                                           |

## Model Header
All model headers start with a 4-character string extension (as shown in the previous section) followed by a series of offsets that end with -1. The header may contain additional sections marked as "Data", "Anim" or "AltN". "HEnd" marks the end of the header. 

| Header Structure                                          |
| --------------------------------------------------------- |
| 4-byte string containing the file extension               |
| an array of offsets in an order specific to the extension |
| -1 / 0xFFFFFFFF to mark the end of the base header        |
| Data, Anim, and/or AltN sections                          |
| "HEnd" to mark end of header                              |

### Header Sections
Depending on the extension, the header may also include a section that starts with a 4-byte string that reads "Data", "Anim", or "AltN".

#### Data
"Data" is a section that only occurs in Trak files. This section stores coordinates for light flares that appear on some tracks. It is structured in the following pattern, with a 32-byte block per light:

| type   | description                  |
| ------ | ---------------------------- |
| String | "Data"                       |
| UInt32 | The number of lights * 4     |
| String | "LStr"                       |
| Vec3   | First light xyz coordinates  |
| String | "LStr"                       |
| Vec3   | Second light xyz coordinates |
| String | "LStr"                       |
| ...    | and so on                    |

#### Anim
"Anim" contains a list of offsets to sets of animation data and can be found in just about every model type. This animation data typically is added at the very end of a model. The animation offset list is always terminated with a null offset.

| type   | description                     |
| ------ | ------------------------------- |
| String | "Anim"                          |
| UInt32 | offset of first animation       |
| UInt32 | offset of second animation      |
| UInt32 | offset of third animation       |
| ...    |                                 |
| UInt32 | null offset to mark end of Anim |

#### AltN
"AltN" is a section that contains only offsets to a few nodes and appears in every MAlt and Podd file. Files that don't have this section in its header and will have a connected node tree. That is to say that each node in a model is a child or parent of another node. However, in models that have an "AltN" section in their header, this is not always the case. These models may have multiple node trees that are not connected to each other as parents or children in any way. The purpose of this section is not entirely understood, but its tag may stand for "Alternate Numbering" or "Alternate Node".

| type   | description                     |
| ------ | ------------------------------- |
| String | "AltN"                          |
| UInt32 | first node offset               |
| UInt32 | second node offset              |
| UInt32 | third node offset               |
| ...    |                                 |
| UInt32 | null offset to mark end of AltN |

### MAlt / Podd
Notice that MAlt and Podd both have the same header size (300). They combine to inform the game what parts of models to use to construct and animate the pod. This combined header covers all possible pod components and configurations including quad-engine pods like Ben Quadinaros and cableless pods like Neva Kee. 

- MAlt and Podd files will always have an AltN section in their header.
- A few Podd files have Anim sections.
- The MAlt files for Anakin Skywalker and Teemto Pagalies are missing their engines. These are instead located in their Podd files.

**MALt / Podd Header Structure**</br>
These values are a work in progress.
| local offset | type   | value/description             |
| ------------ | ------ | ----------------------------- |
| 0x0          | String |
| 0x4          | UInt32 | main parent                   |
| 0x8          | UInt32 | engine 1                      |
| 0xC          | UInt32 | engine 2                      |
| 0x10         | UInt32 | engine 3                      |
| 0x14         | UInt32 | engine 4                      |
| 0x18         | UInt32 | cockpit                       |
| 0x1C         | UInt32 | binder 1                      |
| 0x20         | UInt32 | binder 1                      |
| 0x24         | UInt32 | binder 2                      |
| 0x28         | UInt32 | binder 2                      |
| 0x2C         | UInt32 | cable 1                       |
| 0x30         | UInt32 | cable 2                       |
| 0x34         | UInt32 | cable 3                       |
| 0x38         | UInt32 | cable 4                       |
| 0x3C         | UInt32 |                               |
| 0x40         | UInt32 |                               |
| 0x44         | UInt32 |                               |
| 0x48         | UInt32 |                               |
| 0x4C         | UInt32 | engine 1 stuff                |
| 0x50         | UInt32 | engine 1 stuff                |
| 0x54         | UInt32 | engine 1 stuff                |
| 0x58         | UInt32 | engine 1 stuff                |
| 0x5C         | UInt32 | engine 1 stuff                |
| 0x60         | UInt32 | engine 1 stuff                |
| 0x64         | UInt32 | engine 1 stuff                |
| 0x68         | UInt32 | engine 1 stuff                |
| 0x6C         | UInt32 | engine 1 stuff                |
| 0x70         | UInt32 | engine 1 stuff                |
| 0x74         | UInt32 | engine 1 stuff                |
| 0x78         | UInt32 | afterburner                   |
| 0x7C         | UInt32 | engine 1 stuff                |
| 0x80         | UInt32 | engine 1 stuff                |
| 0x84         | UInt32 | engine 2 stuff                |
| 0x88         | UInt32 | engine 2 stuff                |
| 0x8C         | UInt32 | engine 2 stuff                |
| 0x90         | UInt32 | engine 2 stuff                |
| 0x94         | UInt32 | engine 2 stuff                |
| 0x98         | UInt32 | engine 2 stuff                |
| 0x9C         | UInt32 | engine 2 stuff                |
| 0xA0         | UInt32 | engine 2 stuff                |
| 0xA4         | UInt32 | engine 2 stuff                |
| 0xA8         | UInt32 | engine 2 stuff                |
| 0xAC         | UInt32 | engine 2 stuff                |
| 0xB0         | UInt32 | engine 2 stuff                |
| 0xB4         | UInt32 | engine 2 stuff                |
| 0xB8         | UInt32 | engine 2 stuff                |
| 0xBC         | UInt32 | left cockpit flap             |
| 0xC0         | UInt32 | right cockpit flap            |
| 0xC4         | UInt32 | empty                         |
| 0xC8         | UInt32 | empty                         |
| 0xCC         | UInt32 |
| 0xD0         | UInt32 |
| 0xD4         | UInt32 |
| 0xD8         | UInt32 |
| 0xDC         | UInt32 |
| 0xE0         | UInt32 |
| 0xE4         | UInt32 |
| 0xE8         | UInt32 |
| 0xEC         | UInt32 |
| 0xF0         | UInt32 | pilot                         |
| 0xF4         | UInt32 |
| 0xF8         | UInt32 |
| 0xFC         | UInt32 | right engine shadow           |
| 0x100        | UInt32 | left engine shadow            |
| 0x104        | UInt32 | cockpit shadow                |
| 0x108        | UInt32 |
| 0x10C        | UInt32 |
| 0x110        | UInt32 |
| 0x114        | UInt32 |
| 0x118        | UInt32 |
| 0x11C        | UInt32 |
| 0x120        | UInt32 |
| 0x124        | UInt32 |
| 0x128        | UInt32 |
| 0x12C        | UInt32 | low lod                       |
| 0x130        | Int32  | -1 to mark end of base header |

### Modl
Modl files contain 1 offset, which points to its main parent node. Some Modl files feature "Anim" sections.

| local offset | type   | value/description             |
| ------------ | ------ | ----------------------------- |
| 0x0          | String | "Modl"                        |
| 0x4          | UInt32 | main node parent              |
| 0x8          | Int32  | -1 to mark end of base header |

### Part
Part files have 2 kinds of headers. The first header has 2 offsets and is used for all the Part files for low LOD pods:

| local offset | type   | value/description             |
| ------------ | ------ | ----------------------------- |
| 0x0          | String | "Part"                        |
| 0x4          | UInt32 | main node parent (empty)      |
| 0x8          | UInt32 | main node parent              |
| 0xC          | Int32  | -1 to mark end of base header |

The second kind of header appears on all other Part files: 
| local offset | type   | value/description             |
| ------------ | ------ | ----------------------------- |
| 0x0          | String | "Part"                        |
| 0x4          | UInt32 | main node parent              |
| 0x8          | UInt32 | null offset                   |
| 0xC          | UInt32 | null offset                   |
| 0x10         | UInt32 | null offset                   |
| 0x14         | UInt32 | null offset                   |
| 0x18         | Int32  | -1 to mark end of base header |

### Pupp
All Pupp models contain animations. Its header contains 9 offsets.

| local offset | type   | value/description                                                 |
| ------------ | ------ | ----------------------------------------------------------------- |
| 0x0          | String | "Pupp"                                                            |
| 0x4          | UInt32 | Used by all Pupp files                                            |
| 0x8          | UInt32 | Used by all podracers, pit droid, watto, ronto, and holotable     |
| 0xC          | UInt32 | same as previous except pit droid, ronto, jinn reeso and cy yunga |
| 0x10         | UInt32 | used by some models                                               |
| 0x14         | UInt32 | used by pit droid and holotable only                              |
| 0x18         | UInt32 | used by holotable only                                            |
| 0x1C         | UInt32 | always 0                                                          |
| 0x20         | UInt32 | used by holotable only                                            |
| 0x24         | UInt32 | used by holotable only                                            |

### Scen
All Scen models contain animations. Scen headeres have at least 83 offsets with one file (156) having 89 offsets. However, offsets after offset 76 are unused. 

### Trak
All Trak files feature at least an Anim or Data section with many containing both. Trak headers contain 6 offsets.

| local offset | type   | value/description                                                |
| ------------ | ------ | ---------------------------------------------------------------- |
| 0x0          | String | "Trak"                                                           |
| 0x4          | UInt32 | Main parent of track mesh                                        |
| 0x8          | UInt32 | Main parent of track mesh (always same value as previous offset) |
| 0xC          | UInt32 | Main parent of skybox mesh                                       |
| 0x10         | UInt32 | First cutscene camera trackpoint*                                |
| 0x14         | UInt32 | Second cutscene camera trackpoint*                               |
| 0x18         | UInt32 | Third cutscene camera trackpoint*                                |

*The camera track points are animated empties that determine where the camera is pointing during the opening in-game cutscenes that only exist on the console versions of the game. Every track has a unique opening in-game cutscene. For some reason, tracks that overlap with other tracks contain this camera tracking data for all overlapping tracks where each slot corresponds to the track's order in the tournament. For example, all Mon Gazza tracks have a camera tracking point for Mon Gazza Speedway, Spice Mine Run, and Zugga Challenge in that order. Malastare tracks stick to the order but leave the other offsets blank. Tracks that do not overlap, Inferno and Ando Prime Centrum, use the first slot.

## Model Body
It's finally time to start explaining the model data. 

### Node Types

### Parent Group

### Mesh Group

#### Visuals

##### Material
##### Vert Srips
##### Group Parent
##### Index Buffer
##### Vertex Buffer
##### Vertex Count

#### Collision
##### Collision Data
##### Bounding Box
##### Vertex Buffer (Collision)
##### Vertex Count

### Animations

# Index
The models are packed in out_modelblock.bin in the following order. While there is no obvious pattern, the order may have been determined by the creation date of each model with Anakin Skywalker and The Boonta Classic being made first and miscellaneous models at the end.

See also [OpenSWE1R's list](https://github.com/OpenSWE1R/openswe1r/wiki/List-of-Models)

| index | name                          | extension |
| ----- | ----------------------------- | --------- |
| 0     | Anakin Skywalker              | MAlt      |
| 1     | The Boonta Classic            | Trak      |
| 2     | Anakin Skywalker              | Podd      |
| 3     | Teemto Pagalies               | MAlt      |
| 4     | Teemto Pagalies               | Podd      |
| 5     | Sebulba                       | MAlt      |
| 6     | Sebulba                       | Podd      |
| 7     | Ratts Tyerell                 | MAlt      |
| 8     | Ratts Tyerell                 | Podd      |
| 9     | Aldar Beedo                   | Podd      |
| 10    | Aldar Beedo                   | MAlt      |
| 11    | Mawhonic                      | MAlt      |
| 12    | Mawhonic                      | Podd      |
| 13    | Ark 'Bumpy' Roose             | Podd      |
| 14    | Ark 'Bumpy' Roose             | MAlt      |
| 15    | Wan Sandage                   | Podd      |
| 16    | Mars Guo                      | Podd      |
| 17    | Wan Sandage                   | Podd      |
| 18    | Mars Guo                      | MAlt      |
| 19    | Ebe Endocott                  | MAlt      |
| 20    | Ebe Endocott                  | Podd      |
| 21    | Dud Bolt                      | MAlt      |
| 22    | Dud Bolt                      | Podd      |
| 23    | Gasgano                       | MAlt      |
| 24    | Gasgano                       | Podd      |
| 25    | Clegg Holdfast                | MAlt      |
| 26    | Clegg Holdfast                | Podd      |
| 27    | Elan Mak                      | MAlt      |
| 28    | Elan Mak                      | Podd      |
| 29    | Neva Kee                      | MAlt      |
| 30    | Neva Kee                      | Podd      |
| 31    | Bozzie Baranta                | MAlt      |
| 32    | Bozzie Baranta                | Podd      |
| 33    | Boles Roor                    | MAlt      |
| 34    | Boles Roor                    | Podd      |
| 35    | Ody Mandrell                  | MAlt      |
| 36    | Ody Mandrell                  | Podd      |
| 37    | Fud Sang                      | MAlt      |
| 38    | Fud Sang                      | Podd      |
| 39    | Ben Quadinaros                | MAlt      |
| 40    | Ben Quadinaros                | Podd      |
| 41    | Slide Paramita                | MAlt      |
| 42    | Slide Paramita                | Podd      |
| 43    | Toy Dampner                   | MAlt      |
| 44    | Toy Dampner                   | Podd      |
| 45    | Bullseye Navior               | MAlt      |
| 46    | Bullseye Navior               | Podd      |
| 47    | Aquilaris Vehicle             | Part      |
| 48    | Vehicle Select Flag           | Part      |
| 49    | AnakinPod_LightningBolt       | Part      |
| 50    | Control Linkage               | Part      |
| 51    | Control Shift Plate           | Part      |
| 52    | Control Vectro-Jet            | Part      |
| 53    | Control Coupling              | Part      |
| 54    | Control Nozzle                | Part      |
| 55    | Upgrade (no upgrade stats)    | Part      |
| 56    | Upgrade (no upgrade stats)    | Part      |
| 57    | Upgrade (no upgrade stats)    | Part      |
| 58    | Upgrade (no upgrade stats)    | Part      |
| 59    | Upgrade (no upgrade stats)    | Part      |
| 60    | Coffer                        | Part      |
| 61    | Upgrade (no upgrade stats)    | Part      |
| 62    | Upgrade (no upgrade stats)    | Part      |
| 63    | Upgrade (no upgrade stats)    | Part      |
| 64    | Control Stabilizer            | Part      |
| 65    | Upgrade (no upgrade stats)    | Part      |
| 66    | Upgrade (no upgrade stats)    | Part      |
| 67    | Upgrade (no upgrade stats)    | Part      |
| 68    | Double Coffer                 | Part      |
| 69    | Quad Coffer                   | Part      |
| 70    | Pit Droid Hover Platform      | Part      |
| 71    | Guide Arrow                   | Part      |
| 72    | plane                         | Part      |
| 73    | plane                         | Part      |
| 74    | plane                         | Part      |
| 75    | plane                         | Part      |
| 76    | PlanetA                       | Part      |
| 77    | PlanetB                       | Part      |
| 78    | PlanetC                       | Part      |
| 79    | Tatooine                      | Part      |
| 80    | Baroonda                      | Part      |
| 81    | Moon                          | Part      |
| 82    | Ovoo IV (Asteroid)            | Part      |
| 83    | Hangar                        | Part      |
| 84    | Watto's Shop                  | Part      |
| 85    | Watto's Junkyard              | Part      |
| 86    | Teemto Pagalies               | Pupp      |
| 87    | Anakin Skywalker              | Pupp      |
| 88    | Gasgano                       | Pupp      |
| 89    | Mawhonic                      | Pupp      |
| 90    | Ody Mandrell                  | Pupp      |
| 91    | Sebulba                       | Pupp      |
| 92    | Mars Guo                      | Pupp      |
| 93    | Ratts Tyerell                 | Pupp      |
| 94    | Ben Quadinaros                | Pupp      |
| 95    | Ebe Endocott                  | Pupp      |
| 96    | Ark 'Bumpy' Roose             | Pupp      |
| 97    | Clegg Holdfast                | Pupp      |
| 98    | Dud Bolt                      | Pupp      |
| 99    | Wan Sandage                   | Pupp      |
| 100   | Elan Mak                      | Pupp      |
| 101   | Toy Dampner                   | Pupp      |
| 102   | Fud Sang                      | Pupp      |
| 103   | Neva Kee                      | Pupp      |
| 104   | Slide Paramita                | Pupp      |
| 105   | Aldar Beedo                   | Pupp      |
| 106   | Bozzie Baranta                | Pupp      |
| 107   | Boles Roor                    | Pupp      |
| 108   | Bullseye Navior               | Pupp      |
| 109   | Pit Droid                     | Pupp      |
| 110   | Watto                         | Pupp      |
| 111   | Dewback                       | Pupp      |
| 112   | Ronto                         | Pupp      |
| 113   | Jabba                         | Pupp      |
| 114   |                               | Modl      |
| 115   | 0-Boonta Training Course      | Trak      |
| 116   | Mon Gazza                     | Part      |
| 117   | Ando Prime                    | Part      |
| 118   | Aquilaris                     | Part      |
| 119   | Baroonda                      | Part      |
| 120   | Trugut                        | Part      |
| 121   | Malastare                     | Part      |
| 122   | 0-Ando Prime Centrum          | Part      |
| 123   | Flag First Blue               | Part      |
| 124   | Winner's Platform             | Part      |
| 125   | Flag Second Red               | Part      |
| 126   | Flag Third White              | Part      |
| 127   | StartOfTatooine               | Part      |
| 128   | 0-Ando Prime Centrum          | Trak      |
| 129   | 3-Inferno                     | Trak      |
| 130   | 2-Beedo's Wild Ride           | Trak      |
| 131   | 1-Howler Gorge                | Trak      |
| 132   | 3-Andobi Mountain Run         | Trak      |
| 133   | 3-Aquilaris Classic           | Trak      |
| 134   | 0-Sunken City                 | Trak      |
| 135   | 6-Bumpy's Breakers            | Trak      |
| 136   | 3-Scrapper's Run              | Trak      |
| 137   | 4-Dethro's Revenge            | Trak      |
| 138   | 1-Abyss                       | Trak      |
| 139   | 5-Baroo Coast                 | Trak      |
| 140   | 2-Grabvine Gateway            | Trak      |
| 141   | 5-Fire Mountain Rally         | Trak      |
| 142   | 1-Mon Gazza Speedway          | Trak      |
| 143   | 6-Spice Mine Run              | Trak      |
| 144   | 4-Zugga Challenge             | Trak      |
| 145   | 5-Vengeance                   | Trak      |
| 146   | AnakinPod_LB_2plane           | Modl      |
| 147   | Ball For Explosion            | Part      |
| 148   | 0-Executioner                 | Trak      |
| 149   | Jabba's Spectator Booth       | Scen      |
| 150   | Sebulba                       | Scen      |
| 151   | texturedCircle                | Modl      |
| 152   | Jabba's place + racers        | Scen      |
| 153   | Anakin Skywalker              | Scen      |
| 154   | Cantina                       | Part      |
| 155   | Opee Sea Killer               | Pupp      |
| 156   | Pods                          | Scen      |
| 157   | Mark II Air Brake             | Part      |
| 158   | Mark III Air Brake            | Part      |
| 159   | Mark IV Air Brake             | Part      |
| 160   | Mark V Air Brake              | Part      |
| 161   | Tri-Jet Air Brake             | Part      |
| 162   | Quadrijet Air Brake           | Part      |
| 163   | Coolant Radiator              | Part      |
| 164   | Stack-3 Radiator              | Part      |
| 165   | Stack-6 Radiator              | Part      |
| 166   | Rod Coolant Pump              | Part      |
| 167   | Dual Coolant Pump             | Part      |
| 168   | Turbo Coolant Pump            | Part      |
| 169   | Plug2 Thrust Coil             | Part      |
| 170   | Plug3 Thrust Coil             | Part      |
| 171   | Plug5 Thrust Coil             | Part      |
| 172   | Plug8 Thrust Coil             | Part      |
| 173   | Block5 Thrust Coil            | Part      |
| 174   | Block6 Thrust Coil            | Part      |
| 175   | HoloTable                     | Pupp      |
| 176   | AndoPrime IceStub             | Modl      |
| 177   | 2-Beedo's Wild Ride           | Part      |
| 178   | 1-Howler Gorge                | Part      |
| 179   | 3-Andobi Mountain Run         | Part      |
| 180   | 3-Aquilaris Classic           | Part      |
| 181   | 0-Sunken City                 | Part      |
| 182   | 4-Malastare 100               | Part      |
| 183   | 2-Dug Derby                   | Part      |
| 184   | 1-Sebulba's Legacy            | Part      |
| 185   | 6-Bumpy's Breakers            | Part      |
| 186   | 3-Scrapper's Run              | Part      |
| 187   | 4-Dethro's Revenge            | Part      |
| 188   | 1-Abyss                       | Part      |
| 189   | 1-Mon Gazza Speedway          | Part      |
| 190   | 6-Spice Mine Run              | Part      |
| 191   | 3-Inferno                     | Part      |
| 192   | 4-Zugga Challenge             | Part      |
| 193   | 5-Vengeance                   | Part      |
| 194   | 0-Executioner                 | Part      |
| 195   | 2-The Gauntlet                | Part      |
| 196   | marker flag                   | Part      |
| 197   | marker flag                   | Modl      |
| 198   | Dual 20 PCX Injector          | Part      |
| 199   | 44 PCX Injector               | Part      |
| 200   | Dual 32 PCX Injector          | Part      |
| 201   | Quad 32 PCX Injector          | Part      |
| 202   | Quad 44 Injector              | Part      |
| 203   | Mag 6 Injector                | Part      |
| 204   | R-20 Repulsorgirp             | Part      |
| 205   | R-60 Repulsorgirp             | Part      |
| 206   | R-80 Repulsorgirp             | Part      |
| 207   | Aldar Beedo                   | Part      |
| 208   | Anakin Skywalker              | Part      |
| 209   | Ben Quadinaros                | Part      |
| 210   | Boles Roor                    | Part      |
| 211   | Bozzie Baranta                | Part      |
| 212   | Bullseye Navior               | Part      |
| 213   | Ark 'Bumpy' Roose             | Part      |
| 214   | Clegg Holdfast                | Part      |
| 215   | Dud Bolt                      | Part      |
| 216   | Ebe Endocott                  | Part      |
| 217   | Elan Mak                      | Part      |
| 218   | Fud Sang                      | Part      |
| 219   | Gasgano                       | Part      |
| 220   | Ratts Tyerell                 | Part      |
| 221   | Mars Guo                      | Part      |
| 222   | Mawhonic                      | Part      |
| 223   | Neva Kee                      | Part      |
| 224   | Ody Mandrell                  | Part      |
| 225   | Sebulba                       | Part      |
| 226   | Slide Paramita                | Part      |
| 227   | Teemto Pagalies               | Part      |
| 228   | Toy Dampner                   | Part      |
| 229   | Wan Sandage                   | Part      |
| 230   | R-100 Repulsorgirp            | Part      |
| 231   | 2-The Gauntlet                | Trak      |
| 232   | 4-Malastare 100               | Trak      |
| 233   | 2-Dug Derby                   | Trak      |
| 234   | Single Power Cell             | Part      |
| 235   | Dual Power Cell               | Part      |
| 236   | 5-Baroo Coast                 | Part      |
| 237   | Quad Power Cell               | Part      |
| 238   | Cluster Power Plug            | Part      |
| 239   | Rotary Power Plug             | Part      |
| 240   | Control Stabilizer            | Part      |
| 241   | R-300 Repulsorgirp            | Part      |
| 242   | R-600 Repulsorgirp            | Part      |
| 243   | Cluster 2 Power Plug          | Part      |
| 244   | Hammerhead                    | Pupp      |
| 245   | Anakin                        | Pupp      |
| 246   | Jar Jar Binks                 | Pupp      |
| 247   | Jawa                          | Pupp      |
| 248   | R2D2                          | Pupp      |
| 249   | 2-Grabvine Gateway            | Part      |
| 250   | 5-Fire Mountain Rally         | Part      |
| 251   | Big Rock Explosion            | Part      |
| 252   | Small Rock Explosion          | Part      |
| 253   | Ord Ibanna                    | Part      |
| 254   | Ice Explosion                 | Part      |
| 255   | Sebulba                       | Part      |
| 256   | Anakin Skywalker              | Part      |
| 257   | Teemto Pagalies               | Part      |
| 258   | Ratts Tyerell                 | Part      |
| 259   | Aldar Beedo                   | Part      |
| 260   | Mawhonic                      | Part      |
| 261   | Ark 'Bumpy' Roose             | Part      |
| 262   | Wan Sandage                   | Part      |
| 263   | Mars Guo                      | Part      |
| 264   | Ebe Endocott                  | Part      |
| 265   | Dud Bolt                      | Part      |
| 266   | Gasgano                       | Part      |
| 267   | Clegg Holdfast                | Part      |
| 268   | Elan Mak                      | Part      |
| 269   | Neva Kee                      | Part      |
| 270   | Bozzie Baranta                | Part      |
| 271   | Boles Roor                    | Part      |
| 272   | Ody Mandrell                  | Part      |
| 273   | Fud Sang                      | Part      |
| 274   | Ben Quadinaros                | Part      |
| 275   | Slide Paramita                | Part      |
| 276   | Toy Dampner                   | Part      |
| 277   | Bullseye Navior               | Part      |
| 278   | Tatooine Starting Line Bridge | Part      |
| 279   | 0-Boonta Training Course      | Part      |
| 280   | 6-Boonta Classic              | Part      |
| 281   | AquilarisStadium              | Scen      |
| 282   | StartOfOrdIbanna              | Scen      |
| 283   | StartOfBaronda                | Scen      |
| 284   | StartofMonGazza               | Scen      |
| 285   | Part Of Oovo_Iv ForVideo      | Scen      |
| 286   | Jabba's Observation Booth     | Scen      |
| 287   | Logo LucasArt                 | Scen      |
| 288   | Pods + Character              | Scen      |
| 289   | Pods + Character              | Scen      |
| 290   | Pods + Character              | Scen      |
| 291   | Pods + Character              | Scen      |
| 292   | Pods + Character              | Scen      |
| 293   | Anakin Skywalker              | Scen      |
| 294   | flames                        | Modl      |
| 295   | for explosion (for who)       | Part      |
| 296   | Baroonda Branch Explosion     | Part      |
| 297   | Baroonda's Beach Animatedsea  | Modl      |
| 298   | Jinn Reeso                    | MAlt      |
| 299   | Jinn Reeso                    | Podd      |
| 300   | Cy Yunga                      | MAlt      |
| 301   | Cy Yunga                      | Podd      |
| 302   | Jinn Reeso                    | Part      |
| 303   | Cy Yunga                      | Part      |
| 304   | Jinn Reeso                    | Pupp      |
| 305   | Cy Yunga                      | Pupp      |
| 306   | Rock Explosion                | Part      |
| 307   | for explosion (for who)       | Part      |
| 308   | Tatooine Balloon              | Part      |
| 309   | methane gass effect           | Part      |
| 310   | Starting Line Object          | Part      |
| 311   | magma explosion               | Part      |
| 312   | Mon Gazza Dozer               | Part      |
| 313   |                               | Part      |
| 314   |                               | Modl      |
| 315   | 1-Sebulba's Legacy            | Trak      |
| 316   | AnakinPod_LightningBolt       | Modl      |
| 317   | flames                        | Part      |
| 318   | AnakinPod Explosion           | Part      |
| 319   | Qui Gon Jinn                  | Pupp      |
| 320   | Textured Circle               | Part      |
| 321   |                               | Part      |
| 322   | N64 Memory Expansion Pak      | Part      |