import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

global.owner = [
   ['100644740407530', 'Hernandez', true],
    ['227045091090524', 'erick', true]
]

global.mods = []
global.prems = []

global.namebot = 'Hernandez𝐏𝐥𝐮𝐬'
global.redes = 'https://chat.whatsapp.com/KDI7NNovzdwJayx1gI1cue?mode=ems_copy_t'
global.botname = 'Hernandez𝐏𝐥𝐮𝐬'
global.banner = 'https://raw.githubusercontent.com/SoySapo6/tmp/refs/heads/main/Permanentes/images%20(8).jpeg'
global.packname = '𝕄𝕒𝕪𝕔𝕠𝕝𝐏𝐥𝐮𝐬'
global.author = '𝙃𝙚𝙘𝙝𝙤 𝙥𝙤𝙧 𝙎𝙤𝙮Hernandez <3'
global.moneda = 'BakCoins'
global.libreria = 'Baileys'
global.baileys = 'V 6.7.16'
global.vs = '2.2.0'
global.sessions = 'BakiBot'
global.jadi = 'BakiBots'
global.yukiJadibts = true

global.namecanal = '𝐒𝐨𝐲𝐌𝐚𝐲𝐜𝐨𝐥 <𝟑 • Actualizaciones'
global.idcanal = '120363372883715167@newsletter'
global.idcanal2 = '120363372883715167@newsletter'
global.canal = 'https://whatsapp.com/channel/0029VayXJte65yD6LQGiRB0R'
global.canalreg = '120363372883715167@newsletter'

global.ch = {
  ch1: '120363372883715167@newsletter'
}

global.multiplier = 69
global.maxwarn = 2

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Se actualizo el 'config.js'"))
  import(`file://${file}?update=${Date.now()}`)
})