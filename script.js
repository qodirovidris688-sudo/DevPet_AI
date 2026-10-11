
"use strict";

/* ============================================
   КАРТОШКА БИРЁН
   МАНТИҚИ БОЗӢ, ГУФТУГӮ ВА МУҲАРРИРИ КОД
   ============================================ */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const SAVE_KEY = "kartoshkaBiryonCompleteV2";
const CODE_KEY = "kartoshkaBiryonEditorV1";

let toastTimer = null;
let recognition = null;
let isListening = false;
let sleepTimer = null;

/* ============================================
   МАЪЛУМОТИ ИБТИДОИИ БОЗӢ
   ============================================ */

function createNewGame() {
  return {
    name: "Картошка",
    coins: 125,
    xp: 0,
    level: 1,
    hunger: 65,
    energy: 75,
    happiness: 80,
    clean: 80,
    food: 2,
    sleeping: false,
    completed: [],
    taskDate: new Date().toDateString(),
    lastTime: Date.now()
  };
}

let game = createNewGame();

/* ============================================
   МАҲСУЛОТИ МАҒОЗА
   ============================================ */

const products = [
  {
    id: "apple",
    icon: "🍎",
    name: "Себ",
    description: "Ғизои сабук барои картошка.",
    price: 10,
    hunger: 15,
    energy: 2
  },
  {
    id: "burger",
    icon: "🍔",
    name: "Бургер",
    description: "Ғизои серғизо барои қаҳрамон.",
    price: 25,
    hunger: 30,
    energy: 5
  },
  {
    id: "chicken",
    icon: "🍗",
    name: "Гӯшти бирён",
    description: "Ғизои пурқувват барои машқ.",
    price: 35,
    hunger: 40,
    energy: 12
  },
  {
    id: "milk",
    icon: "🥛",
    name: "Шир",
    description: "Барои барқарор кардани энергия.",
    price: 15,
    hunger: 8,
    energy: 15
  },
  {
    id: "pizza",
    icon: "🍕",
    name: "Пицца",
    description: "Ғизо барои рӯҳияи хуб.",
    price: 30,
    hunger: 28,
    energy: 4
  },
  {
    id: "steak",
    icon: "🥩",
    name: "Стейк",
    description: "Ғизои махсуси варзишгар.",
    price: 50,
    hunger: 45,
    energy: 20
  }
];

/* ============================================
   ВАЗИФАҲОИ ҲАРРӮЗА
   ============================================ */

const tasks = [
  {
    id: "feed",
    icon: "🍔",
    name: "Ба картошка хӯрок деҳ",
    description: "Қаҳрамонро сер кун.",
    reward: 15
  },
  {
    id: "play",
    icon: "⚡",
    name: "Бо картошка бозӣ кун",
    description: "Рӯҳияи қаҳрамонро баланд кун.",
    reward: 15
  },
  {
    id: "wash",
    icon: "🚿",
    name: "Картошкаро шӯй",
    description: "Тозагиро зиёд кун.",
    reward: 15
  },
  {
    id: "train",
    icon: "🏋️",
    name: "Машқи варзишӣ",
    description: "Энергия сарф карда, таҷриба гир.",
    reward: 20
  },
  {
    id: "love",
    icon: "♥",
    name: "Бо қаҳрамон дӯстӣ кун",
    description: "Ба ӯ меҳрубонӣ нишон деҳ.",
    reward: 10
  }
];

/* ============================================
   ВОСИТАҲОИ ЁРИРАСОН
   ============================================ */

function clamp(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2700);
}

function setReaction(message) {
  const reaction = $("#reaction");

  if (reaction) {
    reaction.textContent = message;
  }

  const greeting = $("#chatGreeting");

  if (greeting) {
    greeting.textContent = message;
  }
}

function saveGame() {
  game.lastTime = Date.now();

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
  } catch (error) {
    console.error("Хатои сабти бозӣ:", error);
  }
}

/* ============================================
   ХОНДАНИ САБТИ ПЕШИН
   ============================================ */

function loadGame() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);

    if (!saved) {
      game = createNewGame();
      return;
    }

    const data = JSON.parse(saved);

    game = {
      ...createNewGame(),
      ...data
    };

    game.name = String(game.name || "Картошка").slice(0, 18);

    ["coins", "xp", "level", "food"].forEach((key) => {
      game[key] = Math.max(0, Number(game[key]) || 0);
    });

    game.level = Math.max(1, game.level);

    ["hunger", "energy", "happiness", "clean"].forEach((key) => {
      game[key] = clamp(game[key]);
    });

    game.completed = Array.isArray(game.completed)
      ? game.completed
      : [];

    /* Вазифаҳои рӯзи нав */
    const today = new Date().toDateString();

    if (game.taskDate !== today) {
      game.completed = [];
      game.taskDate = today;
    }

    /* Тағйири ҳолат дар вақти набудани бозигар */
    const lastTime = Number(game.lastTime) || Date.now();

    const minutes = Math.min(
      240,
      Math.max(0, (Date.now() - lastTime) / 60000)
    );

    if (game.sleeping) {
      game.energy = clamp(game.energy + minutes * 0.5);
      game.hunger = clamp(game.hunger - minutes * 0.12);
    } else {
      game.hunger = clamp(game.hunger - minutes * 0.16);
      game.energy = clamp(game.energy - minutes * 0.12);
      game.happiness = clamp(game.happiness - minutes * 0.08);
      game.clean = clamp(game.clean - minutes * 0.05);
    }
  } catch (error) {
    console.error("Хатои хондани сабт:", error);
    game = createNewGame();
  }
}

/* ============================================
   САТҲ ВА ТАҶРИБА
   ============================================ */

function xpNeeded() {
  return 100 + (game.level - 1) * 30;
}

function addXP(amount) {
  game.xp += amount;

  while (game.xp >= xpNeeded()) {
    game.xp -= xpNeeded();
    game.level += 1;
    game.coins += 25;

    showToast(
      "Офарин! Сатҳи нав: " + game.level + ". 25 танга гирифтӣ."
    );

    setReaction("Ман қавитар шудам! 💪");
    animatePet("jump");
  }
}

/* ============================================
   ВАЗИФАҲО ВА МУКОФОТ
   ============================================ */

function completeTask(id) {
  const task = tasks.find((item) => item.id === id);

  if (!task) return;

  if (game.completed.includes(id)) {
    return;
  }

  game.completed.push(id);
  game.coins += task.reward;

  showToast("Вазифа иҷро шуд! +" + task.reward + " танга");
}

/* ============================================
   АНИМАТСИЯИ ҚАҲРАМОН
   ============================================ */

function animatePet(type) {
  const pet = $("#pet");

  if (!pet) return;

  pet.classList.remove(
    "jumping",
    "dancing",
    "training"
  );

  void pet.offsetWidth;

  const className = {
    jump: "jumping",
    dance: "dancing",
    train: "training"
  }[type];

  if (!className) return;

  pet.classList.add(className);

  setTimeout(() => {
    pet.classList.remove(className);
  }, type === "dance" ? 2500 : 1200);
}

/* ============================================
   РАВЗАНАИ ПАЁМ
   ============================================ */

function openModal(icon, title, message, actions = []) {
  $("#modalIcon").textContent = icon;
  $("#modalTitle").textContent = title;
  $("#modalText").textContent = message;

  const extra = $("#modalExtra");
  extra.replaceChildren();

  actions.forEach((action) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "btn primary";
    button.textContent = action.label;

    button.addEventListener("click", action.run);

    extra.appendChild(button);
  });

  $("#modal").classList.remove("hidden");
}

function closeModal() {
  $("#modal").classList.add("hidden");
}

/* ============================================
   ИВАЗ КАРДАНИ САҲИФА
   ============================================ */

function showPage(pageName) {
  const allowed = [
    "home",
    "shop",
    "tasks",
    "stats",
    "chat",
    "code"
  ];

  if (!allowed.includes(pageName)) return;

  $$(".page").forEach((page) => {
    page.classList.add("hidden");
  });

  const page = $("#page-" + pageName);

  if (page) {
    page.classList.remove("hidden");
  }

  $$(".nav-btn").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.page === pageName
    );
  });

  if (pageName === "chat") {
    $("#chatInput").focus();
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* ============================================
   НАМОИШИ ҲОЛАТИ БОЗӢ
   ============================================ */

function renderGame() {
  $("#coins").textContent = game.coins;
  $("#shopCoins").textContent = game.coins;
  $("#foodCount").textContent = game.food;

  $("#level").textContent = String(game.level).padStart(2, "0");
  $("#footerLevel").textContent = String(game.level).padStart(2, "0");

  $("#playerName").textContent = game.name;
  $("#petName").textContent = game.name;
  $("#chatPetName").textContent = game.name + " Бирён";

  const bars = [
    ["hunger", "hungerText", "hungerBar"],
    ["energy", "energyText", "energyBar"],
    ["happiness", "happyText", "happyBar"],
    ["clean", "cleanText", "cleanBar"]
  ];

  bars.forEach(([key, textId, barId]) => {
    const value = Math.round(game[key]);

    $("#" + textId).textContent = value + "%";
    $("#" + barId).style.width = value + "%";
  });

  $("#statLevel").textContent = game.level;
  $("#statCoins").textContent = game.coins;
  $("#statXP").textContent = game.xp;
  $("#statTasks").textContent = game.completed.length;

  $("#sleepLabel").textContent = game.sleeping
    ? "Бедор кардан"
    : "Хоб кардан";

  const lowest = Math.min(
    game.hunger,
    game.energy,
    game.happiness,
    game.clean
  );

  $("#status").textContent = game.sleeping
    ? "ДАР ХОБ"
    : lowest < 25
      ? "ЁРИИ ТУ ЛОЗИМ"
      : "ОМОДА";

  $("#mood").textContent = game.sleeping
    ? "Истироҳат"
    : lowest < 25
      ? "Хаста"
      : game.happiness > 70
        ? "Хушҳол"
        : "Ором";

  $("#petLine").textContent = game.sleeping
    ? "Ман хобам. Баъд бедорам кун."
    : game.hunger < 25
      ? "Ман гуруснаам! Ба ман хӯрок деҳ! 🍔"
      : game.energy < 25
        ? "Ман хаста шудам. Маро хоб кун."
        : "Ман омодаам, ки қавитар шавам!";

  $("#pet").classList.toggle("sleeping", game.sleeping);

  renderShop();
  renderTasks();
}

/* ============================================
   МАҒОЗА
   ============================================ */

function renderShop() {
  $("#shopGrid").innerHTML = products.map((product) => `
    <article class="shop-item">
      <span class="product-icon">${product.icon}</span>
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <span class="price">🪙 ${product.price} танга</span>
      <button
        class="btn primary"
        type="button"
        data-buy="${product.id}"
      >
        ХАРИД КАРДАН
      </button>
    </article>
  `).join("");
}

function buyProduct(id) {
  const product = products.find((item) => item.id === id);

  if (!product) return;

  if (game.coins < product.price) {
    showToast("Танга намерасад. Вазифаҳоро иҷро кун.");
    return;
  }

  game.coins -= product.price;
  game.food += 1;

  saveGame();
  renderGame();

  showToast(product.name + " харидорӣ шуд!");
}

/* ============================================
   ВАЗИФАҲО
   ============================================ */

function renderTasks() {
  $("#taskList").innerHTML = tasks.map((task) => {
    const done = game.completed.includes(task.id);

    return `
      <article class="task-row">
        <div class="task-emoji">${task.icon}</div>
        <div class="task-copy">
          <b>${task.name}</b>
          <small>${task.description}</small>
        </div>
        <span class="task-reward">+${task.reward} 🪙</span>
        <span class="task-check">${done ? "✓" : "○"}</span>
      </article>
    `;
  }).join("");

  const count = tasks.filter((task) =>
    game.completed.includes(task.id)
  ).length;

  $("#taskCount").textContent = count + " / " + tasks.length;
  $("#taskBar").style.width =
    (count / tasks.length * 100) + "%";
}

/* ============================================
   ҒИЗО ДОДАН
   ============================================ */

function feedPet(productId = null) {
  if (game.sleeping) {
    showToast("Картошка хоб аст. Аввал бедораш кун.");
    return;
  }

  let product = null;

  if (productId) {
    product = products.find((item) => item.id === productId);

    if (!product) return;

    if (game.food <= 0) {
      showToast("Аввал аз мағоза хӯрок харид кун.");
      return;
    }

    if (game.hunger >= 100) {
      showToast("Ман сер ҳастам!");
      return;
    }

    game.food -= 1;
    game.hunger = clamp(game.hunger + product.hunger);
    game.energy = clamp(game.energy + product.energy);
  } else {
    if (game.food <= 0) {
      openModal(
        "🍔",
        "Ғизо тамом шуд",
        "Ман гуруснаам! Ба мағоза рав ва хӯрок харид кун.",
        [{
          label: "РАФТАН БА МАҒОЗА",
          run: () => {
            closeModal();
            showPage("shop");
          }
        }]
      );

      return;
    }

    if (game.hunger >= 100) {
      showToast("Ман сер ҳастам!");
      return;
    }

    game.food -= 1;
    game.hunger = clamp(game.hunger + 25);
    game.energy = clamp(game.energy + 3);
  }

  game.happiness = clamp(game.happiness + 5);

  addXP(5);
  completeTask("feed");

  setReaction(
    "Раҳмат! " +
    (product ? product.name : "Хӯрок") +
    " хеле болаззат буд! 😋"
  );

  showToast("Картошка хӯрок хӯрд.");
  finishAction();
}

/* ============================================
   АМАЛҲОИ ҚАҲРАМОН
   ============================================ */

function performAction(action) {
  if (action !== "sleep" && game.sleeping) {
    showToast("Аввал картошкаро бедор кун.");
    setReaction("Ман хобам 😴");
    return;
  }

  switch (action) {
    case "feed":
      feedPet();
      return;

    case "play":
      if (game.energy < 12) {
        showToast("Энергия кам аст. Истироҳат кун.");
        setReaction("Ман хаста шудам. 😴");
        return;
      }

      game.energy = clamp(game.energy - 10);
      game.hunger = clamp(game.hunger - 5);
      game.happiness = clamp(game.happiness + 18);

      addXP(10);
      completeTask("play");
      animatePet("jump");

      setReaction("Биё бозӣ мекунем! ⚡");
      showToast("Бозии хуб! Таҷриба гирифтӣ.");
      break;

    case "sleep":
      if (!game.sleeping) {
        game.sleeping = true;

        clearInterval(sleepTimer);

        setReaction("Шаб ба хайр, дӯсти ман... 😴");
        showToast("Картошка хоб рафт.");
      } else {
        game.sleeping = false;

        game.energy = clamp(game.energy + 35);
        game.happiness = clamp(game.happiness + 5);

        addXP(3);

        setReaction("Ман бедор шудам! 💪");
        showToast("Картошка бедор шуд.");
      }
      break;

    case "wash":
      game.clean = clamp(game.clean + 30);
      game.happiness = clamp(game.happiness + 5);

      addXP(5);
      completeTask("wash");

      setReaction("Ҳоло ман тозаам! 🚿");
      showToast("Оббозӣ анҷом ёфт.");
      break;

    case "dance":
      if (game.energy < 10) {
        showToast("Барои рақс энергия лозим аст.");
        return;
      }

      game.energy = clamp(game.energy - 10);
      game.happiness = clamp(game.happiness + 15);
      game.hunger = clamp(game.hunger - 3);

      addXP(7);
      animatePet("dance");

      setReaction("Рақс кун! ♫");
      showToast("Рақси олӣ!");
      break;

    case "train":
      if (game.energy < 15) {
        showToast("Барои машқ қувват лозим аст.");
        return;
      }

      game.energy = clamp(game.energy - 15);
      game.hunger = clamp(game.hunger - 7);
      game.happiness = clamp(game.happiness + 6);

      addXP(12);
      completeTask("train");
      animatePet("train");

      setReaction("Ман қавӣ мешавам! 🏋️");
      showToast("Машқ анҷом ёфт. Таҷриба гирифтӣ.");
      break;

    case "love":
      game.happiness = clamp(game.happiness + 12);

      addXP(3);
      completeTask("love");

      setReaction("Раҳмат, дӯсти ман! Ман туро дӯст медорам! ❤️");
      showToast("Дӯстӣ зиёд шуд.");
      break;

    default:
      return;
  }

  finishAction();
}

function finishAction() {
  saveGame();
  renderGame();
}

/* ============================================
   САҲИФАИ НАТИҶАҲО
   ============================================ */

function resetGame() {
  openModal(
    "↻",
    "Аз нав оғоз мекунӣ?",
    "Ҳамаи пешрафти бозӣ аз нав мешавад.",
    [{
      label: "БАЛЕ, АЗ НАВ",
      run: () => {
        game = createNewGame();
        saveGame();
        renderGame();
        closeModal();
        showToast("Бозӣ аз нав оғоз шуд.");
      }
    }]
  );
}

/* ============================================
   ГУФТУГӮИ КАРТОШКА
   ============================================ */

/* Ҷавоби овозӣ */
function speak(text) {
  if (!("speechSynthesis" in window)) {
    $("#voiceStatus").textContent =
      "Браузери ту ҷавоби овозиро дастгирӣ намекунад.";
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  /* Браузер метавонад тоҷикӣ надошта бошад.
     Агар надошта бошад, овоз аз рӯйи овозҳои дастрас интихоб мешавад. */
  const voices = window.speechSynthesis.getVoices();

  const tajikVoice = voices.find((voice) =>
    voice.lang.toLowerCase().startsWith("tg")
  );

  const russianVoice = voices.find((voice) =>
    voice.lang.toLowerCase().startsWith("ru")
  );

  const selectedVoice = tajikVoice || russianVoice;

  if (selectedVoice) {
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang;
  } else {
    utterance.lang = "ru-RU";
  }

  utterance.rate = 0.9;
  utterance.pitch = 0.95;

  window.speechSynthesis.speak(utterance);
}

/* Ҷавоб ба сухани корбар */
function getReply(rawText) {
  const text = rawText.toLowerCase().trim();

  if (
    text.includes("салом") ||
    text.includes("ассалом") ||
    text.includes("субҳ ба хайр")
  ) {
    return "Салом, дӯсти ман! Ман Картошка Бирён ҳастам. Имрӯз чӣ кор мекунем?";
  }

  if (
    text.includes("номат") ||
    text.includes("ки ҳастӣ") ||
    text.includes("номи ту")
  ) {
    return "Номи ман Картошка Бирён аст! Ман қаҳрамони ту ҳастам.";
  }

  if (
    text.includes("хурок") ||
    text.includes("хӯрок") ||
    text.includes("гурусна") ||
    text.includes("бургер")
  ) {
    if (game.hunger < 75) {
      return "Ман гуруснаам! Ба ман бургер, себ ё гӯшти бирён деҳ. Ба мағоза даромада метавонӣ.";
    }

    return "Ташаккур, дӯсти ман! Ман ҳоло сер ҳастам, баъдтар ба ман хӯрок деҳ.";
  }

  if (
    text.includes("танга") ||
    text.includes("пул") ||
    text.includes("чанд дорам")
  ) {
    return "Ту ҳоло " + game.coins + " танга дорӣ. Вазифаҳоро иҷро кун, то тангаи бештар гирӣ.";
  }

  if (
    text.includes("хоб") ||
    text.includes("хаста") ||
    text.includes("истироҳат")
  ) {
    return game.sleeping
      ? "Ман аллакай хобам. Тугмаи бедор карданро пахш кун."
      : "Ман каме хаста шудам. Тугмаи хоб карданро пахш кун, то энергия гирам.";
  }

  if (
    text.includes("машқ") ||
    text.includes("мушак") ||
    text.includes("қавӣ")
  ) {
    return "Ман мехоҳам мушакҳоямро калон кунам! Ба тугмаи машқ кардан пахш кун.";
  }

  if (
    text.includes("бозӣ") ||
    text.includes("бозӣ кун")
  ) {
    return "Биё бозӣ мекунем! Тугмаи бозӣ карданро пахш кун, то ман хурсанд шавам.";
  }

  if (
    text.includes("дӯст медорам") ||
    text.includes("дӯстам") ||
    text.includes("дӯст")
  ) {
    return "Раҳмат, дӯсти ман! Ман ҳам хурсанд ҳастам, ки ту бо ман бозӣ мекунӣ.";
  }

  if (
    text.includes("ҳолат") ||
    text.includes("чи хелӣ") ||
    text.includes("чӣ хелӣ")
  ) {
    return "Ман " +
      (game.hunger < 25
        ? "гурусна ҳастам."
        : game.energy < 25
          ? "хаста ҳастам."
          : "хуб ҳастам, дӯсти ман!") +
      " Ҳолати ман " + Math.round(game.happiness) + " фоиз аст.";
  }

  if (
    text.includes("хайр") ||
    text.includes("то боз")
  ) {
    return "Хайр, дӯсти ман! Боз биё, ман туро интизор мешавам.";
  }

  if (
    text.includes("тугма") ||
    text.includes("чи кор") ||
    text.includes("чӣ кор")
  ) {
    return "Дар менюи чап Асосӣ, Мағоза, Вазифаҳо, Натиҷаҳо, Гуфтугӯ ва Муҳаррири код ҳастанд.";
  }

  return "Ман суханатро гирифтам: " + rawText +
    ". Ҳоло ман ҷавобҳои асосиро медонам. Бештар дар бораи хӯрок, хоб, машқ ё бозӣ аз ман пурс.";
}

/* Илова кардани паём ба гуфтугӯ */
function addChatMessage(text, sender) {
  const messages = $("#chatMessages");
  const article = document.createElement("div");

  article.className =
    "message " + (sender === "user" ? "user-message" : "bot-message");

  const name = document.createElement("b");
  name.textContent =
    sender === "user" ? "Ту" : game.name + " Бирён";

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  article.append(name, paragraph);

  if (sender === "bot") {
    const button = document.createElement("button");

    button.className = "speak-message";
    button.type = "button";
    button.textContent = "🔊 Гӯш кардан";

    button.addEventListener("click", () => speak(text));

    article.appendChild(button);
  }

  messages.appendChild(article);
  messages.scrollTop = messages.scrollHeight;
}

/* Ҷавоб додан ба паём */
function sendChatMessage(text) {
  const message = String(text || "").trim();

  if (!message) {
    showToast("Аввал ба ман чизе навис.");
    return;
  }

  addChatMessage(message, "user");

  const reply = getReply(message);

  addChatMessage(reply, "bot");
  setReaction(reply);

  speak(reply);

  $("#chatInput").value = "";
}

/* Шинохтани овози корбар */
function startListening() {
  const SpeechRecognitionAPI =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognitionAPI) {
    $("#voiceStatus").textContent =
      "Шинохтани овоз дар ин браузер дастгирӣ намешавад. Chrome-ро санҷ.";
    showToast("Браузери Chrome-ро истифода бар.");
    return;
  }

  if (isListening) {
    return;
  }

  recognition = new SpeechRecognitionAPI();

  /* Барои фармонҳои тоҷикӣ ин танзимро баъдтар
     вобаста ба дастгирии браузер беҳтар кардан мумкин аст. */
  recognition.lang = "ru-RU";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    $("#talkBtn").textContent = "🎙️ ГӮШ КАРДА ИСТОДАМ...";
    $("#voiceStatus").textContent =
      "Гап зан. Микрофон фаъол аст.";
  };

  recognition.onresult = (event) => {
    const heard = event.results[0][0].transcript;

    $("#voiceStatus").textContent =
      "Шунидам: " + heard;

    sendChatMessage(heard);
  };

  recognition.onerror = (event) => {
    console.error("Хатои микрофон:", event.error);

    if (event.error === "not-allowed") {
      $("#voiceStatus").textContent =
        "Иҷозати микрофон дода нашуд. Дар браузер иҷозат деҳ.";
    } else if (event.error === "no-speech") {
      $("#voiceStatus").textContent =
        "Овоз нашунидам. Тугмаро пахш карда, боз гап зан.";
    } else {
      $("#voiceStatus").textContent =
        "Микрофонро санҷ ва аз нав кӯшиш кун.";
    }
  };

  recognition.onend = () => {
    isListening = false;
    $("#talkBtn").textContent = "🎤 БО МАН ГАП ЗАН";
  };

  try {
    recognition.start();
  } catch (error) {
    console.error(error);
    isListening = false;
    $("#voiceStatus").textContent =
      "Микрофон оғоз нашуд. Саҳифаро аз нав кушо.";
  }
}

function stopVoice() {
  if (recognition && isListening) {
    recognition.stop();
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  isListening = false;
  $("#talkBtn").textContent = "🎤 БО МАН ГАП ЗАН";
  $("#voiceStatus").textContent = "Гуфтугӯи овозӣ қатъ шуд.";
}

/* ============================================
   МУҲАРРИРИ КОД ДАР ДОХИЛИ САЙТ
   ============================================ */

function getCodeStarter(language) {
  if (language === "html") {
    return `<!DOCTYPE html>
<html lang="tg">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Лоиҳаи ман</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 24px;
      background: #101827;
      color: white;
    }

    button {
      padding: 10px 16px;
      border: 0;
      border-radius: 8px;
      background: #4388ff;
      color: white;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>Салом, ҷаҳон!</h1>
  <p>Ин аввалин лоиҳаи ман аст.</p>
  <button onclick="alert('Офарин!')">Пахш кун</button>
</body>
</html>`;
  }

  if (language === "css") {
    return `/* Дизайни лоиҳаи ман */
body {
  font-family: Arial, sans-serif;
  background: #101827;
  color: white;
  padding: 24px;
}

h1 {
  color: #65a3ff;
}

button {
  padding: 10px 16px;
  border: 0;
  border-radius: 8px;
  background: #4388ff;
  color: white;
  cursor: pointer;
}`;
  }

  return `// JavaScript — коди аввалини ман
const button = document.querySelector("button");

if (button) {
  button.addEventListener("click", () => {
    alert("Салом! Код кор мекунад.");
  });
}

console.log("Лоиҳа оғоз шуд.");`;
}

function loadEditorCode() {
  const language = $("#codeLanguage").value;

  try {
    const saved = localStorage.getItem(CODE_KEY + "_" + language);

    $("#codeEditor").value =
      saved !== null ? saved : getCodeStarter(language);
  } catch (error) {
    $("#codeEditor").value = getCodeStarter(language);
  }
}

function saveEditorCode() {
  const language = $("#codeLanguage").value;

  try {
    localStorage.setItem(
      CODE_KEY + "_" + language,
      $("#codeEditor").value
    );

    showToast("Коди " + language.toUpperCase() + " сабт шуд.");
  } catch (error) {
    showToast("Код сабт нашуд. Хотираи браузерро санҷ.");
  }
}

function runEditorCode() {
  const language = $("#codeLanguage").value;
  const code = $("#codeEditor").value;
  const output = $("#codeOutput");

  /* HTML-ро дар iframe-и алоҳида иҷро мекунем. */
  if (language === "html") {
    output.srcdoc = code;
    showToast("Коди HTML иҷро шуд.");
    return;
  }

  /* Барои CSS ва JS натиҷаро дар ҳуҷҷати ҷудогона нишон медиҳем. */
  if (language === "css") {
    output.srcdoc = `<!DOCTYPE html>
<html lang="tg">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body {
  font-family: Arial, sans-serif;
  padding: 20px;
  background: #fff;
  color: #222;
}
</style>
<style>${code.replace(/<\/style/gi, "<\\/style")}</style>
</head>
<body>
<h1>Натиҷаи CSS</h1>
<p>Ин саҳифа барои санҷидани CSS аст.</p>
<button>Тугмаи намунавӣ</button>
</body>
</html>`;

    showToast("Коди CSS нишон дода шуд.");
    return;
  }

  /* JavaScript танҳо дар муҳити ҷудогона иҷро мешавад. */
  const safeCode = code.replace(/<\/script/gi, "<\\/script");

  output.srcdoc = `<!DOCTYPE html>
<html lang="tg">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body {
  font-family: Arial, sans-serif;
  padding: 20px;
  background: #fff;
  color: #222;
}
button {
  padding: 10px 14px;
  border: 0;
  border-radius: 7px;
  background: #387bf5;
  color: white;
  cursor: pointer;
}
</style>
</head>
<body>
<h1>Натиҷаи JavaScript</h1>
<p>Натиҷаи кодро дар ҳамин ҷо санҷ.</p>
<button>Тугмаи намунавӣ</button>
<script>
try {
${safeCode}
} catch (error) {
  document.body.insertAdjacentHTML(
    "beforeend",
    "<pre style='color:red;white-space:pre-wrap'></pre>"
  );
  document.querySelector("pre").textContent = error.message;
}
<\/script>
</body>
</html>`;

  showToast("Коди JavaScript иҷро шуд.");
}

function clearEditorCode() {
  const confirmed = window.confirm(
    "Мехоҳӣ коди ин муҳаррирро пурра тоза кунӣ?"
  );

  if (!confirmed) return;

  $("#codeEditor").value = "";
  $("#codeOutput").srcdoc = "";
  saveEditorCode();
}

/* ============================================
   ПАЙВАСТ КАРДАНИ ҲАМАИ ТУГМАҲО
   ============================================ */

function connectButtons() {
  /* Оғози бозӣ */
  $("#startBtn").addEventListener("click", () => {
    $("#welcome").classList.add("hidden");
    $("#app").classList.remove("hidden");

    renderGame();

    showToast("Хуш омадӣ, " + game.name + "!");
    setReaction("Салом, дӯсти ман! Биё бозӣ кунем! 💪");
  });

  /* Менюи саҳифаҳо */
  $$(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => {
      showPage(button.dataset.page);
    });
  });

  /* Тугмаҳои гузаштан ба саҳифа */
  $$("[data-page-link]").forEach((button) => {
    button.addEventListener("click", () => {
      showPage(button.dataset.pageLink);
    });
  });

  /* Амалҳои қаҳрамон */
  $$("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      performAction(button.dataset.action);
    });
  });

  /* Хариди маҳсулот */
  $("#shopGrid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-buy]");

    if (button) {
      buyProduct(button.dataset.buy);
    }
  });

  /* Гуфтугӯ */
  $("#sendChat").addEventListener("click", () => {
    sendChatMessage($("#chatInput").value);
  });

  $("#chatInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      sendChatMessage($("#chatInput").value);
    }
  });

  $("#talkBtn").addEventListener("click", startListening);
  $("#stopVoice").addEventListener("click", stopVoice);

  /* Тугмаҳои шунидани паём */
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-speak]");

    if (button) {
      speak(button.dataset.speak);
    }
  });

  /* Номи қаҳрамон */
  $("#saveName").addEventListener("click", () => {
    const newName = $("#nameInput").value.trim();

    if (!newName) {
      showToast("Аввал номи навро навис.");
      return;
    }

    game.name = newName.slice(0, 18);

    saveGame();
    renderGame();

    showToast("Номи қаҳрамон сабт шуд.");
  });

  $("#nameInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      $("#saveName").click();
    }
  });

  /* Танзимот */
  $("#settingsBtn").addEventListener("click", () => {
    openModal(
      "⚙",
      "Танзимот",
      "Пешрафти бозӣ ва коди муҳаррир дар ҳамин браузер нигоҳ дошта мешаванд.",
      [{
        label: "АЗ НАВ ОҒОЗ КАРДАН",
        run: resetGame
      }]
    );
  });

  $("#resetBtn").addEventListener("click", resetGame);

  /* Пӯшидани равзана */
  $("#modalClose").addEventListener("click", closeModal);
  $("#modalOk").addEventListener("click", closeModal);

  $("#modal").addEventListener("click", (event) => {
    if (event.target.id === "modal") {
      closeModal();
    }
  });

  /* Пахш кардани худи персонаж */
  $("#pet").addEventListener("click", () => {
    if (game.sleeping) {
      setReaction("Ман хобам. 😴");
      return;
    }

    game.happiness = clamp(game.happiness + 2);

    addXP(1);
    animatePet("jump");

    setReaction("Ҳа-ҳа! Ман тайёрам! 😎");

    saveGame();
    renderGame();
  });

  /* Муҳаррири код */
  $("#codeLanguage").addEventListener("change", loadEditorCode);
  $("#saveCode").addEventListener("click", saveEditorCode);
  $("#runCode").addEventListener("click", runEditorCode);
  $("#clearCode").addEventListener("click", clearEditorCode);

  /* Сабти автоматӣ ҳангоми баромадан аз саҳифа */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      saveGame();
      saveEditorCodeSilently();
    }
  });

  window.addEventListener("beforeunload", () => {
    saveGame();
    saveEditorCodeSilently();
  });
}

function saveEditorCodeSilently() {
  try {
    const language = $("#codeLanguage").value;

    localStorage.setItem(
      CODE_KEY + "_" + language,
      $("#codeEditor").value
    );
  } catch (error) {
    console.warn("Муҳаррири код сабт нашуд.", error);
  }
}

/* ============================================
   ТАҒЙИРИ ҲОЛАТ ҲАР ДАҚИҚА
   ============================================ */

function updateNeeds() {
  if (game.sleeping) {
    game.energy = clamp(game.energy + 4);
    game.hunger = clamp(game.hunger - 1);
  } else {
    game.hunger = clamp(game.hunger - 1);
    game.energy = clamp(game.energy - 0.5);
    game.happiness = clamp(game.happiness - 0.3);
    game.clean = clamp(game.clean - 0.2);
  }

  saveGame();
  renderGame();
}

/* ============================================
   ОҒОЗИ БАРНОМА
   ============================================ */

function initGame() {
  loadGame();

  connectButtons();

  renderGame();
  loadEditorCode();

  /* Пешрафтро ҳар дақиқа нав мекунем. */
  setInterval(updateNeeds, 60000);

  /* Агар овозҳо дер бор шаванд, браузер онҳоро баъдтар мегирад. */
  if ("speechSynthesis" in window) {
    window.speechSynthesis.getVoices();
  }

  console.log("Картошка Бирён омода аст!");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGame);
} else {
  initGame();
}
