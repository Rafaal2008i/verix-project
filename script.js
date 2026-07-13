// =========================
// Verix AI
// =========================

const openAI = document.getElementById("openAI");
const aiChat = document.getElementById("aiChat");

if (openAI && aiChat) {

    openAI.addEventListener("click", () => {

        aiChat.style.display =
            aiChat.style.display === "block"
                ? "none"
                : "block";

    });

}

// =========================
// URL Scanner
// =========================

const input = document.getElementById("urlInput");
const button = document.getElementById("checkBtn");

if (button && input) {

    button.addEventListener("click", checkURL);

    input.addEventListener("keypress", (event) => {

        if (event.key === "Enter") {

            checkURL();

        }

    });

}

async function checkURL() {

    const url = input.value.trim();

    if (!url) {

        showMessage("⚠️ الرجاء إدخال رابط أولاً.", "#FFD166");

        return;

    }

    try {

        new URL(url);

    } catch {

        showMessage("❌ الرابط غير صحيح.", "#FF6B6B");

        return;

    }

    showMessage("🔍 جاري الفحص...", "#63E6BE");

    try {

        const response = await fetch("https://verix-project.onrender.com/scan-url", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({ url })

        });

        const data = await response.json();

        if (!response.ok || data.error) {

            throw new Error();

        }

        const stats = data.data.attributes.stats;

        const total =
            stats.harmless +
            stats.malicious +
            stats.suspicious +
            stats.undetected;

        document.getElementById("resultCard").style.display = "block";
        document.getElementById("askAI").style.display = "block";

        document.getElementById("checkedUrl").textContent = url;
        document.getElementById("engines").textContent = total + " برنامج حماية";
        document.getElementById("malicious").textContent = stats.malicious;

        if (stats.malicious > 0) {

            document.getElementById("status").textContent = "🔴 الرابط غير آمن";
            document.getElementById("status").style.color = "#ff4d4d";

        } else {

            document.getElementById("status").textContent = "🟢 الرابط آمن";
            document.getElementById("status").style.color = "#63E6BE";

        }

    } catch {

        showMessage("❌ تعذر الاتصال بالسيرفر.", "#FF6B6B");

    }

}

function showMessage(message, color) {

    document.getElementById("resultCard").style.display = "block";

    document.getElementById("status").textContent = message;
    document.getElementById("status").style.color = color;

    document.getElementById("engines").textContent = "-";
    document.getElementById("malicious").textContent = "-";
    document.getElementById("checkedUrl").textContent = input.value;

}



// =========================
// Verix AI Chat
// =========================

const sendAI = document.getElementById("sendAI");
const aiInput = document.getElementById("aiInput");
const aiMessages = document.getElementById("aiMessages");

if (sendAI && aiInput) {

    sendAI.addEventListener("click", sendMessage);

    aiInput.addEventListener("keypress", (event) => {

        if (event.key === "Enter") {

            sendMessage();

        }

    });

}

async function sendMessage() {

    const message = aiInput.value.trim();

    if (!message) return;

    aiMessages.innerHTML += `
        <div class="ai-message user">${message}</div>
    `;

    aiInput.value = "";

    const loading = document.createElement("div");

    loading.className = "ai-message bot";
    loading.textContent = "🤖 جاري التفكير...";

    aiMessages.appendChild(loading);

    aiMessages.scrollTop = aiMessages.scrollHeight;

    try {

        const response = await fetch("https://verix-project.onrender.com/chat", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                message

            })

        });

        const data = await response.json();

        loading.remove();

        aiMessages.innerHTML += `
            <div class="ai-message bot">
                ${data.reply}
            </div>
        `;

        aiMessages.scrollTop = aiMessages.scrollHeight;

    } catch {

        loading.remove();

        aiMessages.innerHTML += `
            <div class="ai-message bot">
                ❌ تعذر الاتصال بالذكاء الاصطناعي
            </div>
        `;

    }

}

const askAI = document.getElementById("askAI");

if (askAI) {

    askAI.addEventListener("click", async () => {

        aiChat.style.display = "block";

        const url = document.getElementById("checkedUrl").textContent;
        const engines = document.getElementById("engines").textContent;
        const malicious = document.getElementById("malicious").textContent;

        aiMessages.innerHTML += `
            <div class="ai-message user">
                اشرح لي نتيجة فحص هذا الرابط
            </div>
        `;

        const response = await fetch("https://verix-project.onrender.com/chat", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({

                message: `اشرح هذه النتيجة للمستخدم بلغة عربية بسيطة.

الرابط:
${url}

عدد برامج الحماية:
${engines}

عدد الاكتشافات:
${malicious}

وأعطني نصيحة هل أفتح الرابط أم لا.`

            })

        });

        const data = await response.json();

        aiMessages.innerHTML += `
            <div class="ai-message bot">
                ${data.reply}
            </div>
        `;

        aiMessages.scrollTop = aiMessages.scrollHeight;

    });

}
