# Tracks

There are 13 tracks in the game. In the files, tracks are referenced using the following two-letter codes:

| code | track name               |
| ---- | ------------------------ |
| GA   | Watchtower Run           |
| GB   | Ruins of Carnuss Gorguul |
| GC   | The Citadel              |
| MA   | Orotoru G'am             |
| MB   | The Ballast Complex      |
| MC   | The Grand Reefs          |
| RA   | The Brightlands          |
| RC   | The Nightlands           |
| SA   | Soro Suub Facility       |
| SC   | Serres Sarrano           |
| TA   | The Mos Espa Open        |
| TB   | The Badlands             |
| TC   | Boonta Eve Classic       |

Each code has a planet code as the first letter followed by A, B, or C, for each track on that planet. Ryloth and Sullest don't have a "B" track.

| code | planet       |
| ---- | ------------ |
| G    | Gamor        |
| M    | Mon Calamari |
| R    | Ryloth       |
| S    | Sullest      |
| T    | Tatooine     |

Every track has the following files in /TRACKS

| extension   | description                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `spl`       | The track's spline in plaintext. There are two splines for each track: M and A                                                                                           |
| `vub`       | A packed file with references to "camera" and vue files. There are 3-8 vub files per track                                                                               |
| `tun`       | "EnvDamage" plaintext file that contains many references to various properties                                                                                           |
| `toy`       | Only GC (The Citadel) has this file. Many references to various properties.                                                                                              |
| `tob`       | packed file with many references to models, triggers, and animations                                                                                                     |
| `scb`       | packed file with references to "portals" and model names and terrain properties, with heavy repeating data structure                                                     |
| `TVCam.pos` | Plaintext camera positions and modes for replay cameras?                                                                                                                 |
| `esb`       | packed file with references to textures, maybe has tga file inside? Only Boonta Eve Classic, The Citadel, Ruins of Carnuss Gorguul, and Watchtower Run have these files. |
| `aub`       | packed file with references to collisions and sounds. Maybe the main definition for in-game sound effects?                                                               |


