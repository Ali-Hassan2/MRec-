const express = require("express")
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js")
const crypto = require("crypto")
const cors = require("cors")
const { exec } = require("child_process")
const path = require("path")
const fs = require("fs")

const app = express()
app.use(express.json())
app.use(cors())

app.use((req, res, next) => {
  res.setHeader("ngrok-skip-browser-warning", "true")
  next()
})

const wrapperFile = "links.json"

let wrapperLink = {}
if (fs.existsSync(wrapperFile)) {
  wrapperLink = JSON.parse(fs.readFileSync(wrapperFile))
}

function saveLinks() {
  fs.writeFileSync(wrapperFile, JSON.stringify(wrapperLink, null, 2))
}

app.post("/generatelink", (req, res) => {
  const { original_link } = req.body
  const wrapperCode = crypto.randomBytes(4).toString("hex")
  wrapperLink[wrapperCode] = original_link
  saveLinks()

  res.json({
    wrapperLink: `https://cfa78d4b2b40.ngrok-free.app/join/${wrapperCode}`,
  })
})

let qrShown = false
let qrData = null

app.get("/join/:code", (req, res) => {
  const code = req.params.code
  const original_link = wrapperLink[code]
  if (!original_link) {
    return res.send({ success: false, message: "Invalid Link" })
  }

  res.send(`
    <html>
      <body>
        <a href="${original_link}" target="_blank">Open Google Meet</a>
        <button id="toggleBtn" style="
          position: fixed; top: 20px; right: 20px; padding: 10px;
          background: red; color: white; z-index: 1000;
        ">Start Recording</button>

        <div id="qrContainer" style="margin-top:20px;"></div>

        <script>
          async function pollQR() {
            const res = await fetch("http://localhost:4003/getqr")
            const data = await res.json()
            if (data.qr) {
              document.getElementById("qrContainer").innerHTML = 
                "<p>Scan this QR with WhatsApp:</p><img src='https://api.qrserver.com/v1/create-qr-code/?data=" 
                + encodeURIComponent(data.qr) + "&size=200x200' />";
              return; 
            }
            setTimeout(pollQR, 2000) // keep checking every 2s
          }

          pollQR();

          const btn = document.getElementById("toggleBtn");
          btn.onclick = async () => {
            btn.innerText = "Recording...";
            btn.disabled = true;

            const res = await fetch("http://localhost:4003/startrecording", {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({})
            });

            const data = await res.json();
            console.log(data.status);

            setTimeout(() => {
              alert("Recording ended, saved and sent to WhatsApp");
              btn.innerText = "Done!";
            }, 10 * 1000);
          }
        </script>
      </body>
    </html>
  `)
})

app.get("/getqr", (req, res) => {
  if (qrData && !qrShown) {
    qrShown = true
    return res.json({ qr: qrData })
  }
  res.json({ qr: null })
})

app.post("/startrecording", async (req, res) => {
  res.send({ status: "Sending test message..." })

  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      executablePath: "/usr/bin/google-chrome",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  })

  client.on("qr", (qr) => {
    if (!qrShown) {
      qrData = qr / console.log("QR generated (frontend will fetch)")
    }
  })

  client.on("ready", async () => {
    console.log("WhatsApp client is ready")

    const number = "923424191474"
    const chatId = number + "@c.us"

    const numberDetails = await client.getNumberId(number)
    console.log("Number Details:", numberDetails)

    if (numberDetails) {
      await client.sendMessage(chatId, "Brooo ")
      console.log("Message sent via WhatsApp ")
    } else {
      console.log("Ye number WhatsApp par registered nahi hai")
    }

    client.destroy()
  })

  client.initialize()
})

app.listen(4003, () => console.log("Server running at port 4003"))
