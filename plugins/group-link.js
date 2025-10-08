import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import schedule from "node-schedule";

// Carpeta donde se guardarán las imágenes
const IMG_DIR = path.join(process.cwd(), "group_photos");
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR);

// Función para descargar una imagen y guardarla
async function downloadImage(url, filename) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("No se pudo descargar la imagen");
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(filename, Buffer.from(buffer));
  } catch (e) {
    console.error(`Error descargando ${filename}:`, e.message);
  }
}

// Función para actualizar la foto de un grupo específico
async function updateGroupPhoto(conn, groupId) {
  let photoUrl;
  try {
    photoUrl = await conn.profilePictureUrl(groupId, "image");
  } catch {
    photoUrl = null; // Si no hay foto
  }

  const filePath = path.join(IMG_DIR, `${groupId}.jpg`);

  if (photoUrl) {
    let needDownload = true;

    // Si el archivo ya existe, compara su contenido con la nueva foto
    if (fs.existsSync(filePath)) {
      const existing = fs.readFileSync(filePath);
      const newBuffer = Buffer.from(await fetch(photoUrl).then(r => r.arrayBuffer()));
      if (existing.equals(newBuffer)) needDownload = false; // No cambió
    }

    if (needDownload) {
      await downloadImage(photoUrl, filePath);
      console.log(`Foto actualizada para grupo ${groupId}`);
    }
  }
}

// Programar limpieza cada 5 días
schedule.scheduleJob("0 0 */5 * *", () => {
  console.log("Eliminando fotos antiguas...");
  fs.readdirSync(IMG_DIR).forEach(file => fs.unlinkSync(path.join(IMG_DIR, file)));
  console.log("Fotos eliminadas.");
});

// Handler principal
const handler = async (m, { conn }) => {
  try {
    const groupId = m.chat;

    // 🚀 Actualiza la foto del grupo si cambió
    await updateGroupPhoto(conn, groupId);

    // Obtener el código de invitación
    const inviteCode = await conn.groupInviteCode(groupId);
    const filePath = path.join(IMG_DIR, `${groupId}.jpg`);
    const link = `🗡️ https://chat.whatsapp.com/${inviteCode}`;

    // Construir el mensaje
    const msg = fs.existsSync(filePath)
      ? { image: { url: `file://${filePath}` }, caption: link }
      : { text: link };

    // Enviar mensaje + reacción en paralelo
    await Promise.all([
      conn.sendMessage(groupId, msg, { quoted: m }),
      conn.sendMessage(groupId, { react: { text: "✅", key: m.key } }),
    ]);
  } catch (error) {
    console.error(error);
    await conn.sendMessage(m.chat, { text: "❌ Ocurrió un error al obtener el link." }, { quoted: m });
  }
};

handler.customPrefix = /^\.?(link)$/i;
handler.command = new RegExp();
handler.group = true;
handler.admin = true;

export default handler;