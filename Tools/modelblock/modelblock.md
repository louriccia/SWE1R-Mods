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

### A Terrible Analogy
You can think of out_modelblock.bin or any of the game's .bin files as textbooks. Each textbook starts with a table of contents (the header) that tells you the page number (global offset) where each chapter (model) can be found. Within each chapter, there is sort of a mini table of contents that shows where sections of the chapter can be found, only instead of giving the page number, it gives the number of pages from the start of the chapter (local offset). Whenever a page number is given within a chapter, it gives it in this format and give page numbers from other chapters. 

## Offset Map
Every model in out_modelblock.bin is preceded by a bit string that points out 4-byte values in the model data that should be parsed as an offset. 

For example, the first model in out_modelblock.bin has an offset map that begins like this at global offset 0xA20:
| local offset | hex  | binary   |
| ------------ | ---- | -------- |
| 0x0          | 0x7F | **01111111** |
| 0x1          | 0xFF | 11111111 |
| 0x2          | 0xFF | 11111111 |
| 0x3          | 0xFF | 11111111 |
| ...          |

These bits can be mapped to the start of the actual model data at global offset 0xD1C to reveal values that are to be read as offsets:
| local offset | hex value  | description                | offset map bit |
| ------------ | ---------- | -------------------------- | -------------- |
| 0x0          | 0x4D416C74 | "MAlt", the file extension | **0**             |
| 0x4          | 0x0        | a null offset              | **1**             |
| 0x8          | 0x0        | a null offset              | **1**             |
| 0xC          | 0x0        | a null offset              | **1**              |
| 0x10         | 0x0        | a null offset              | **1**              |
| 0x14         | 0x0        | a null offset              | **1**              |
| 0x18         | 0x0        | a null offset              | **1**              |
| 0x1C         | 0x0        | a null offset              | **1**              |
| ...          |

Notice that the first set of 4 bytes, the extension, is marked with a 0 to indiciate it is not an offset. The following 7 UInt32's are all marked with 1's to indicate they are offsets. Even though they are all null offsets, it seems the function reponsible for parsing the model data still expects these null offsets to be flagged. 

## Model Types
There are 7 extensions that indicate the context for which a model should be used.

| extension | header size (bytes) | description                                                      |
| --------- | ------------------- | ---------------------------------------------------------------- |
| MAlt      | 300                 | high poly pods for the player character                          |
| Modl      | 4                   | various one-off animated elements                                |
| Part      | 20                  | non-animated elements                                            |
| Podd      | 300                 | mid/low poly pod models, flap animations, how many engines, etc. |
| Pupp      | 36                  | animated characters, each with a similar set of animations       |
| Scen      | 332                 | animated scenes; (possibly unused in pc version)                 |
| Trak      | 24                  | tracks                                                           |



## Model Header
All model headers start with a 4-character string extension (as shown in the previous section) followed by a series of offsets. Depending on the extension, the header may also include a section labeled "Data", "Anim", or "AltN". "HEnd" indicates the end of the header.

### MAlt / Podd
Notice that MAlt and Podd both have the same header size (300). They combine to inform the game what parts of models to use to construct and animate the pod. This combined header covers all possible pod components and configurations including quad-engine pods like Ben Quadinaros, and cableless pods like Neva Kee. 

- MAlt and Podd will also have a AltN tag in their header.
- A few Podd files have Anim sections
- The MAlt files for Anakin Skywalker and Teemto Pagalies do not have high poly engines. The engines are likely packed in the exe but have not been located yet.


**Header Table**
| offset | type   | description |
| ------ | ------ | ----------- |
| 0      | String | MAlt / Podd |
| 4      | UInt32 | main parent |
| 8      | UInt32 | engine 1    |
| 12     | UInt32 | engine 2    |
| 16     | UInt32 | engine 3    |
| 20     | UInt32 | engine 4    |

### Modl
Features "Anim"
### Part
### Pupp
Features "Anim"
### Scen
Features "Anim"
### Trak
Features "Data" and "Anim"

## Node

# Index
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