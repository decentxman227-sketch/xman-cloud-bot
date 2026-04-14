const express = require("express");
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const P = require("pino");

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
        const { connection, lastDisconnect } = update;

        if (connection === "open") {
            console.log("✅ BOT ONLINE (CLOUD)");
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

// 🌐 API (for future dashboard)
app.post("/send", async (req, res) => {
    try {
        const { number, message } = req.body;

        await sockGlobal.sendMessage(number + "@s.whatsapp.net", {
            text: message
        });

        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.get("/", (req, res) => {
    res.send("🤖 XMAN Cloud Bot Running");
});

app.listen(3000, () => {
    console.log("🌐 Server running on port 3000");
    startBot();
});
