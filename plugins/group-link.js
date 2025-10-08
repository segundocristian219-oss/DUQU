import fetch from "node-fetch";

const groupPhotoCache = new Map();

const handler = async (m, { conn }) => {
  try {
    const [inviteCode, cachedUrl] = await Promise.all([
      conn.groupInviteCode(m.chat),
      getGroupPhoto(conn, m.chat),
    ]);

    const link = `🗡️ https://chat.whatsapp.com/${inviteCode}`;
    const msg = cachedUrl
      ? { image: { url: cachedUrl }, caption: link }
      : { text: link };

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

async function getGroupPhoto(conn, chatId) {
  if (groupPhotoCache.has(chatId)) return groupPhotoCache.get(chatId);

  const url = await conn.profilePictureUrl(chatId, "image").catch(() => null);

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