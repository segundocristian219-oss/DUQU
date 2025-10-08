import fetch from "node-fetch"
import fs from "fs"
import path from "path"

// Carpeta para guardar fotos
const PHOTO_DIR = path.resolve("./tmp/group_photos")
if (!fs.existsSync(PHOTO_DIR)) fs.mkdirSync(PHOTO_DIR, { recursive: true })

// Caché en memoria con timestamp
// key = chatId, value = { path: string, timestamp: number }
const groupPhotoCache = new Map()

const handler = async (m, { conn }) => {
  try {
    // Obtener link y foto local en paralelo
    const [inviteCode, photoPath] = await Promise.all([
      (async () => {
        try { return await conn.groupInviteCode(m.chat) } 
        catch { return null }
      })(),
      getGroupPhoto(conn, m.chat)
    ])

    if (!inviteCode) {
      return await conn.sendMessage(
        m.chat,
        { text: "❌ No se pudo obtener el link del grupo. Asegúrate de que el bot sea admin y estés en un grupo." },
        { quoted: m }
      )
    }

    const link = `🗡️ https://chat.whatsapp.com/${inviteCode}`
    const msg = photoPath
      ? { image: { path: photoPath }, caption: link }
      : { text: link }

    // Enviar foto + reacción
    await Promise.all([
      conn.sendMessage(m.chat, msg, { quoted: m }),
      conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } })
    ])
  } catch (error) {
    console.error("Error en comando link:", error)
    await conn.sendMessage(
      m.chat,
      { text: `❌ Error inesperado: ${error?.message || error}` },
      { quoted: m }
    )
  }
}

// Función para obtener la foto del grupo (con caché y disco)
async function getGroupPhoto(conn, chatId) {
  const cached = groupPhotoCache.get(chatId)
  if (cached) return cached.path

  const filePath = path.join(PHOTO_DIR, `${chatId}.jpg`)
  let url = await conn.profilePictureUrl(chatId, "image").catch(() => null)

  // Si no hay URL remota, usa la foto que ya existe en disco
  if (!url && fs.existsSync(filePath)) {
    groupPhotoCache.set(chatId, { path: filePath, timestamp: Date.now() })
    return filePath
  }

  if (!url) return null

  try {
    const res = await fetch(url)
    const buffer = Buffer.from(await res.arrayBuffer())
    fs.writeFileSync(filePath, buffer)
    groupPhotoCache.set(chatId, { path: filePath, timestamp: Date.now() })
    return filePath
  } catch (err) {
    console.error("Error descargando foto del grupo:", err)
    return fs.existsSync(filePath) ? filePath : null
  }
}

// Limpieza automática de fotos > 10 días
const TEN_DAYS = 10 * 24 * 60 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const [chatId, { path: p, timestamp }] of groupPhotoCache.entries()) {
    if (!fs.existsSync(p) || now - timestamp > TEN_DAYS) {
      if (fs.existsSync(p)) fs.unlinkSync(p)
      groupPhotoCache.delete(chatId)
      console.log(`🗑️ Foto eliminada después de 10 días: ${chatId}`)
    }
  }
}, 60 * 60 * 1000) // revisar cada hora

handler.customPrefix = /^\.?(link)$/i
handler.command = new RegExp()
handler.group = true
handler.admin = true

export default handler