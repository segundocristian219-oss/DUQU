import fetch from "node-fetch";

// 🗂️ Caché simple en memoria (clave = ID del grupo)
const groupPhotoCache = new Map();

const handler = async (m, { conn }) => {
  try {
    // 🚀 Obtener link y (si existe) imagen cacheada o nueva en paralelo
    const [inviteCode, cachedUrl] = await Promise.all([
      conn.groupInviteCode(m.chat),
      getGroupPhoto(conn, m.chat),
    ]);

    const link = `🗡️ https://chat.whatsapp.com/${inviteCode}`;
    const msg = cachedUrl
      ? { image: { url: cachedUrl }, caption: link }
      : { text: link };

    // 🔥 Enviar mensaje + reacción a la vez
    await Promise.all([
      conn.sendMessage(m.chat, msg, { quoted: m }),
      conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } }),
    ]);

  } catch (error) {
    console.error("Error en comando link:", error);
    await conn.sendMessage(
      m.chat,
      { text: "❌ No se pudo obtener el link del grupo." },
      { quoted: m }
    );
  }
};

// 🧩 Función auxiliar que usa caché
async function getGroupPhoto(conn, chatId) {
  // Verifica si ya está en caché
  if (groupPhotoCache.has(chatId)) return groupPhotoCache.get(chatId);

  // Si no está, la pide al servidor
  const url = await conn.profilePictureUrl(chatId, "image").catch(() => null);

  // Guarda en caché por 10 minutos
  if (url) {
    groupPhotoCache.set(chatId, url);
    setTimeout(() => groupPhotoCache.delete(chatId), 10 * 60 * 1000);
  }

  return url;
}

handler.customPrefix = /^\.?(link)$/i;
handler.command = new RegExp();
handler.group = true;
handler.admin = true;

export default handler;