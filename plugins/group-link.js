import fetch from "node-fetch"
import fs from "fs"
import path from "path"

const PHOTO_DIR = path.resolve("./tmp/group_photos")
if (!fs.existsSync(PHOTO_DIR)) fs.mkdirSync(PHOTO_DIR, { recursive: true })

const groupPhotoCache = new Map()

const handler = async (m, { conn }) => {
  try {
    const photoPath = await getGroupPhoto(conn, m.chat)

    let inviteCode
    try {
      inviteCode = await conn.groupInviteCode(m.chat)
    } catch {
      inviteCode = null
    }

    if (!inviteCode) {
      return await conn.sendMessage(
        m.chat,
        { text: "❌ No se pudo obtener el link del grupo. Asegúrate de que el bot sea admin y que estés en un chat de grupo." },
        { quoted: m }
      )
    }

    const link = `🗡️ https://chat.whatsapp.com/${inviteCode}`
    const msg = photoPath
      ? { image: { path: photoPath }, caption: link }
      : { text: link }

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

async function getGroupPhoto(conn, chatId) {
  const photoFile = path.join(PHOTO_DIR, `${chatId}.jpg`)
  const remoteUrl = await conn.profilePictureUrl(chatId, "image").catch(() => null)
  if (!remoteUrl) return fs.existsSync(photoFile) ? photoFile : null

  if (fs.existsSync(photoFile)) {
    const stats = fs.statSync(photoFile)
    const age = Date.now() - stats.mtimeMs
    if (age < 6 * 60 * 60 * 1000) {
      groupPhotoCache.set(chatId, photoFile)
      return photoFile
    }
  }

  const res = await fetch(remoteUrl)
  const buffer = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(photoFile, buffer)
  groupPhotoCache.set(chatId, photoFile)
  return photoFile
}

handler.groupLeave = async (conn, id) => {
  try {
    const photoFile = path.join(PHOTO_DIR, `${id}.jpg`)
    if (fs.existsSync(photoFile)) fs.unlinkSync(photoFile)
    groupPhotoCache.delete(id)
    console.log(`🧹 Foto eliminada al salir del grupo: ${id}`)
  } catch (err) {
    console.error("Error borrando foto:", err)
  }
}

handler.groupUpdate = async (conn, update) => {
  try {
    const { id } = update
    if (!id) return
    if (update?.picture) {
      console.log(`🖼️ Foto de grupo actualizada: ${id}`)
      const url = await conn.profilePictureUrl(id, "image").catch(() => null)
      if (!url) return
      const res = await fetch(url)
      const buffer = Buffer.from(await res.arrayBuffer())
      const filePath = path.join(PHOTO_DIR, `${id}.jpg`)
      fs.writeFileSync(filePath, buffer)
      groupPhotoCache.set(id, filePath)
    }
  } catch (err) {
    console.error("Error actualizando foto del grupo:", err)
  }
}

setInterval(async () => {
  try {
    console.log("🧽 Iniciando limpieza automática de fotos...")
    const files = fs.readdirSync(PHOTO_DIR)
    const groups = (await global.conn?.groupFetchAllParticipating?.().catch(() => ({}))) || {}
    const now = Date.now()
    const MAX_AGE = 24 * 60 * 60 * 1000

    for (const file of files) {
      if (!file.endsWith(".jpg")) continue
      const filePath = path.join(PHOTO_DIR, file)
      const groupId = file.replace(".jpg", "")
      const stats = fs.statSync(filePath)
      const age = now - stats.mtimeMs
      if (!groups[groupId] || age > MAX_AGE) {
        fs.unlinkSync(filePath)
        groupPhotoCache.delete(groupId)
        console.log(`🗑️ Foto eliminada (${!groups[groupId] ? "grupo inactivo" : "vieja"}): ${groupId}`)
      }
    }
  } catch (err) {
    console.error("Error en limpieza automática:", err)
  }
}, 6 * 60 * 60 * 1000)

handler.customPrefix = /^\.?(link)$/i
handler.command = new RegExp()
handler.group = true
handler.admin = true

export default handler