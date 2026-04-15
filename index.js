const express = require("express");
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const P = require("pino");
const qrcode = require("qrcode-terminal");

const app = express();
app.use(express.json());

let sockGlobal;

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session");

    const sock = makeWASocket({
        auth: state,
        logger: P({ level: "silent" }),
        browser: ["XMAN Cloud", "Chrome", "1.0"]
    });

    sockGlobal = sock;

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, qr, lastDisconnect } = update;

        if (qr) {
            console.log("📱 SCAN THIS QR:");
            qrcode.generate(qr, { small: true });
        }

        if (connection === "open") {
            console.log("✅ BOT CONNECTED SUCCESSFULLY");
        }

        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;

            console.log("❌ Disconnected:", reason);

            if (reason !== DisconnectReason.loggedOut) {
                console.log("🔁 Restarting...");
                startBot();
            }
        }
    });
}

// simple API route
app.get("/", (req, res) => {
    res.send("🤖 XMAN Cloud Bot Running");
});

app.listen(3000, () => {
    console.log("🌐 Server running on port 3000");
    startBot();
});
