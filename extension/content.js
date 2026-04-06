console.log("FB AI Translator panel loaded on:", location.hostname);

let lastSelectedText = "";
let lastDetectedLanguage = "English";
let lastTranslatedText = "";

function createPanel() {
  if (document.getElementById("fb-ai-translator-panel")) return;

  const panel = document.createElement("div");
  panel.id = "fb-ai-translator-panel";
  panel.style.position = "fixed";
  panel.style.top = "90px";
  panel.style.right = "20px";
  panel.style.zIndex = "999999";
  panel.style.background = "#ffffff";
  panel.style.border = "1px solid #d0d7de";
  panel.style.borderRadius = "12px";
  panel.style.padding = "10px";
  panel.style.boxShadow = "0 6px 18px rgba(0,0,0,0.15)";
  panel.style.width = "240px";
  panel.style.fontFamily = "Arial, sans-serif";

  const title = document.createElement("div");
  title.textContent = "FB AI Translator";
  title.style.fontWeight = "700";
  title.style.marginBottom = "8px";
  title.style.fontSize = "14px";

  const info = document.createElement("div");
  info.textContent = "Bôi đen tin nhắn rồi bấm Dịch";
  info.style.fontSize = "12px";
  info.style.color = "#555";
  info.style.marginBottom = "8px";

  const langBox = document.createElement("div");
  langBox.id = "fb-ai-lang";
  langBox.textContent = "Ngôn ngữ hiện tại: Chưa có";
  langBox.style.fontSize = "12px";
  langBox.style.color = "#222";
  langBox.style.marginBottom = "8px";

  const translateBtn = document.createElement("button");
  translateBtn.textContent = "🌐 Dịch đoạn bôi đen";
  styleButton(translateBtn);

  const replyBtn = document.createElement("button");
  replyBtn.textContent = "🤖 Reply AI";
  styleButton(replyBtn);

  const resultBox = document.createElement("textarea");
  resultBox.id = "fb-ai-result";
  resultBox.placeholder = "Kết quả sẽ hiện ở đây...";
  resultBox.style.width = "100%";
  resultBox.style.height = "140px";
  resultBox.style.marginTop = "8px";
  resultBox.style.fontSize = "12px";
  resultBox.style.borderRadius = "8px";
  resultBox.style.border = "1px solid #ccc";
  resultBox.style.padding = "8px";
  resultBox.style.resize = "vertical";
  resultBox.style.boxSizing = "border-box";

  const copyBtn = document.createElement("button");
  copyBtn.textContent = "📋 Copy kết quả";
  styleButton(copyBtn);
  copyBtn.style.marginTop = "8px";

  translateBtn.onclick = async () => {
    const selectedText = window.getSelection().toString().trim();

    if (!selectedText) {
      resultBox.value = "Bạn chưa bôi đen tin nhắn cần dịch.";
      return;
    }

    resultBox.value = "Đang dịch...";
    try {
      const res = await fetch("https://fb-ai-translator.onrender.com/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: selectedText })
      });

      const data = await res.json();

      lastSelectedText = selectedText;
      lastDetectedLanguage = data.detectedLanguage || "Other";
      lastTranslatedText = data.translatedText || "";

      langBox.textContent = "Ngôn ngữ hiện tại: " + lastDetectedLanguage;
      resultBox.value = lastTranslatedText || data.error || "Không có kết quả";
    } catch (err) {
      resultBox.value = "Lỗi dịch: " + err.message;
    }
  };

  replyBtn.onclick = async () => {
    const input = prompt("Nhập câu trả lời bằng tiếng Việt:");
    if (!input) return;

    resultBox.value = "Đang tạo trả lời...";
    try {
      const res = await fetch("http://localhost:3001/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: input,
          targetLanguage: lastDetectedLanguage,
          customerMessage: lastSelectedText
        })
      });

      const data = await res.json();
      resultBox.value = data.reply || data.error || "Không có kết quả";
    } catch (err) {
      resultBox.value = "Lỗi reply: " + err.message;
    }
  };

  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(resultBox.value || "");
      copyBtn.textContent = "✅ Đã copy";
      setTimeout(() => {
        copyBtn.textContent = "📋 Copy kết quả";
      }, 1500);
    } catch (err) {
      resultBox.value = "Không copy được: " + err.message;
    }
  };

  panel.appendChild(title);
  panel.appendChild(info);
  panel.appendChild(langBox);
  panel.appendChild(translateBtn);
  panel.appendChild(replyBtn);
  panel.appendChild(resultBox);
  panel.appendChild(copyBtn);

  document.body.appendChild(panel);
}

function styleButton(btn) {
  btn.style.width = "100%";
  btn.style.marginTop = "6px";
  btn.style.padding = "8px 10px";
  btn.style.border = "1px solid #ccc";
  btn.style.borderRadius = "8px";
  btn.style.background = "#fff";
  btn.style.cursor = "pointer";
  btn.style.fontSize = "12px";
}

function start() {
  createPanel();
}

setTimeout(start, 2000);
