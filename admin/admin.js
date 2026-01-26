const owner = "eschaeffer";
const repo = "botbattles";
const branch = "main";
const botsPath = "bots";
const botListPath = "bot-list.json";

const statusEl = document.getElementById("status");
const listEl = document.getElementById("bot-list");
const uploadBtn = document.getElementById("upload-btn");
const refreshBtn = document.getElementById("refresh-btn");
const fileInput = document.getElementById("file-input");

function getToken() {
  return localStorage.getItem("botbattles_token") || "";
}

function requireToken() {
  let token = getToken();
  if (!token) {
    token = prompt("Enter your GitHub token (repo scope):");
    if (token) {
      localStorage.setItem("botbattles_token", token.trim());
    }
  }
  return token;
}

function setStatus(message, isError) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#f28b82" : "#9be28b";
}

async function apiRequest(url, options) {
  const token = requireToken();
  if (!token) {
    throw new Error("Missing token.");
  }
  const response = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(options && options.headers ? options.headers : {}),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body.message || response.statusText;
    throw new Error(message);
  }
  return response.json();
}

async function listBots() {
  setStatus("Loading...", false);
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${botsPath}?ref=${branch}`;
  const data = await apiRequest(url, { method: "GET" });
  const bots = data.filter((entry) => entry.type === "file" && entry.name.endsWith(".json"));
  renderBotList(bots);
  setStatus(`Loaded ${bots.length} bots`, false);
  return bots;
}

function renderBotList(bots) {
  listEl.innerHTML = "";
  bots.forEach((bot) => {
    const item = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = bot.name;
    const del = document.createElement("button");
    del.className = "secondary";
    del.textContent = "Delete";
    del.addEventListener("click", () => deleteBot(bot.name, bot.sha));
    item.appendChild(name);
    item.appendChild(del);
    listEl.appendChild(item);
  });
}

async function uploadBot() {
  const file = fileInput.files[0];
  if (!file) {
    setStatus("Choose a .json file first.", true);
    return;
  }
  const text = await file.text();
  const content = btoa(unescape(encodeURIComponent(text)));
  const path = `${botsPath}/${file.name}`;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  setStatus("Uploading...", false);
  await apiRequest(url, {
    method: "PUT",
    body: JSON.stringify({
      message: `Add bot ${file.name}`,
      content,
      branch,
    }),
  });
  await rebuildBotList();
  await listBots();
}

async function deleteBot(name, sha) {
  if (!confirm(`Delete ${name}?`)) {
    return;
  }
  const path = `${botsPath}/${name}`;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  setStatus("Deleting...", false);
  await apiRequest(url, {
    method: "DELETE",
    body: JSON.stringify({
      message: `Delete bot ${name}`,
      sha,
      branch,
    }),
  });
  await rebuildBotList();
  await listBots();
}

async function rebuildBotList() {
  const bots = await listBots();
  const list = {
    bots: bots.map((bot) => `bots/${bot.name}`),
  };
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(list, null, 2))));
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${botListPath}`;
  let existing = null;
  try {
    existing = await apiRequest(url, { method: "GET" });
  } catch (err) {
    existing = null;
  }
  await apiRequest(url, {
    method: "PUT",
    body: JSON.stringify({
      message: "Update bot list",
      content,
      sha: existing ? existing.sha : undefined,
      branch,
    }),
  });
}

uploadBtn.addEventListener("click", () => {
  uploadBot().catch((err) => setStatus(err.message, true));
});

refreshBtn.addEventListener("click", () => {
  listBots().catch((err) => setStatus(err.message, true));
});

listBots().catch((err) => setStatus(err.message, true));
