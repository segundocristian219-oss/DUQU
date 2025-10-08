// fun-afk.js
import pkg from '@whiskeysockets/baileys'
const { generateWAMessageFromContent, proto } = pkg

// Estado global AFK
let afk = {
  isAFK: false,
  reason: '',
  user: ''
}

const handler = async (m, { conn, text, command }) => {
  const from = m.chat
  const sender = m.sender

  // ===== Comando .afk =====
  if (command === 'afk') {
    if (!text) {
      return conn.sendMessage(from, { text: '⚠️ Escribe la razón de tu AFK, ej: .afk (hola)' }, { quoted: m })
    }

    afk = {
      isAFK: true,
      reason: text,
      user: sender
    }

    return conn.sendMessage(from, { text: `✅ Estás AFK por esta razón:\n\n${text}` }, { quoted: m })
  }

  // ===== Usuario vuelve del AFK =====
  if (afk.isAFK && sender === afk.user) {
    afk.isAFK = false
    await conn.sendMessage(from, { text: '👋 Hola de vuelta hermosa' }, { quoted: m })
  }

  // ===== Alguien menciona al usuario AFK =====
  if (afk.isAFK && m.mentionedJid && m.mentionedJid.includes(afk.user) && sender !== afk.user && !m.key.fromMe) {
    const reply = `⏳ Eliminé esa mención\n💬 ${afk.reason ? 'Motivo: ' + afk.reason : ''}`
    try {
      // Enviar aviso
      await conn.sendMessage(from, { text: reply }, { quoted: m })
      // Intentar eliminar la mención (requiere permisos admin en grupo)
      await conn.sendMessage(from, { delete: m.key })
    } catch (e) {
      // Si no se puede eliminar, solo enviar aviso
      await conn.sendMessage(from, { text: reply }, { quoted: m })
    }
  }
}

// 🔑 Esto permite que el handler escuche todos los mensajes, no solo comandos
handler.all = true
handler.command = ['afk']

export default handler