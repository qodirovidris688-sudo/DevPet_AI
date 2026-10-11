
"use strict";

/* =========================================
   КАРТОШКА БИРЁН — МАНТИҚИ ПУРРАИ БОЗӢ
   ========================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const SAVE_KEY = "kartoshkaBiryonSaveV1";

function freshGame() {
  return {
    name: "Картошка",
    coins: 100,
    xp: 0,
    level: 1,
    hunger: 80,
    energy: 85,
    happiness: 85,
    clean: 85,
    food: 2,
    sleeping: false,
    completed: [],
    taskDate: new Date().toDateString(),
    lastTime: Date.now()
  };
}

let game = freshGame();
let toastTimer = null;

/* Маҳсулоти мағоза */
const products = [
  {
    id: "apple",
    icon: "🍎",
    name: "Себ",
    description: "Ғизои сабук ва муфид.",
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
    description: "Ғизои пурқувват.",
    price: 35,
    hunger: 40,
    energy: 12
  },
  {
    id: "milk",
    icon: "🥛",
    name: "Шир",
    description: "Барои барқарор кардани қувват.",
    price: 15,
    hunger: 8,
    energy: 15
  },
  {
    id: "pizza",
    icon: "🍕",
    name: "Пицца",
    description: "Барои рӯҳияи хуб.",
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

/* Вазифаҳои ҳаррӯза */
const tasks = [
  {
    id: "feed",
    icon: "🍗",
    name: "Ғизо додан",
    description: "Ба картошка хӯрок деҳ.",
    reward: 15
  },
  {
    id: "play",
    icon: "⚡",
    name: "Бозӣ кардан",
    description: "Бо қаҳрамон бозӣ кун.",
    reward: 15
  },
  {
    id: "wash",
    icon: "♨",
    name: "Оббозӣ",
    description: "Тозагии қаҳрамонро зиёд кун.",
    reward: 15
  },
  {
    id: "train",
    icon: "🏋",
    name: "Машқ кардан",
    description: "Як машқи варзишӣ иҷро кун.",
    reward: 20
  }
];

/* Сабти пешрафт */
function saveGame() {
  game.lastTime = Date.now();

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
  } catch (error) {
    console.error("Хатои сабти бозӣ:", error);
    showToast("Сабт нашуд. Хотираи браузерро санҷ.");
  }
}

/* Хондани сабти пешина */
function loadGame() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);

    if (!saved) {
      game = freshGame();
      return;
    }

    const parsed = JSON.parse(saved);

    game = {
      ...freshGame(),
      ...parsed
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

    if (game.taskDate !== new Date().toDateString()) {
      game.completed = [];
      game.taskDate = new Date().toDateString();
    }

    /* Тағйирёбии ҳолат дар вақти набудани бозигар */
    const elapsedMinutes = Math.min(
      240,
      Math.max(
        0,
        (Date.now() - (Number(game.lastTime) || Date.now())) / 60000
      )
    );

    if (game.sleeping) {
      game.energy = clamp(game.energy + elapsedMinutes * 0.5);
      game.hunger = clamp(game.hunger - elapsedMinutes * 0.12);
    } else {
      game.hunger = clamp(game.hunger - elapsedMinutes * 0.16);
      game.energy = clamp(game.energy - elapsedMinutes * 0.12);
      game.happiness = clamp(game.happiness - elapsedMinutes * 0.08);
      game.clean = clamp(game.clean - elapsedMinutes * 0.05);
    }
  } catch (error) {
    console.error("Хатои хондани сабт:", error);
    game = freshGame();
  }
}

/* Маҳдуд кардани рақам аз 0 то 100 */
function clamp(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

/* Паёми кӯтоҳ дар экран */
function showToast(message) {
  const toast = $("#toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2600);
}

/* Паёми болои персонаж */
function setReaction(message) {
  $("#reaction").textContent = message;
}

/* Таҷриба ва баланд шудани сатҳ */
function experienceNeeded() {
  return 100 + (game.level - 1) * 30;
}

function addExperience(amount) {
  game.xp += amount;

  while (game.xp >= experienceNeeded()) {
    game.xp -= experienceNeeded();
    game.level += 1;
    game.coins += 25;

    showToast(
      `Сатҳи нав! Level ${game.level} — 25 танга гирифтӣ.`
    );

    setReaction("Қавитар шудам! 💪");
    animatePet("jump");
  }
}

/* Мукофоти вазифа */
function completeTask(id) {
  const task = tasks.find((item) => item.id === id);

  if (!task || game.completed.includes(id)) {
    return;
  }

  game.completed.push(id);
  game.coins += task.reward;

  showToast(`Вазифа иҷро шуд! +${task.reward} танга`);
}

/* Аниматсияи персонаж */
function animatePet(type) {
  const pet = $("#pet");

  if (!pet) return;

  pet.classList.remove("jumping", "dancing", "training");
  void pet.offsetWidth;

  if (type === "jump") {
    pet.classList.add("jumping");

    setTimeout(() => {
      pet.classList.remove("jumping");
    }, 1200);
  }

  if (type === "dance") {
    pet.classList.add("dancing");

    setTimeout(() => {
      pet.classList.remove("dancing");
    }, 2500);
  }

  if (type === "train") {
    pet.classList.add("training");

    setTimeout(() => {
      pet.classList.remove("training");
    }, 1200);
  }
}

/* Равзанаи паём */
function openModal(icon, title, message, actions = []) {
  $("#modalIcon").textContent = icon;
  $("#modalTitle").textContent = title;
  $("#modalText").textContent = message;

  const extra = $("#modalExtra");
  extra.innerHTML = "";

  actions.forEach((action) => {
    const button = document.createElement("button");

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

/* Иваз кардани саҳифа */
function showPage(name) {
  const allowedPages = ["home", "shop", "tasks", "stats"];

  if (!allowedPages.includes(name)) {
    return;
  }

  $$(".page").forEach((page) => {
    page.classList.add("hidden");
  });

  $("#page-" + name).classList.remove("hidden");

  $$(".nav-btn").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.page === name
    );
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* Намудор кардани ҳамаи нишондиҳандаҳо */
function renderGame() {
  $("#coins").textContent = game.coins;
  $("#shopCoins").textContent = game.coins;
  $("#foodCount").textContent = game.food;

  $("#level").textContent = String(game.level).padStart(2, "0");
  $("#footerLevel").textContent = String(game.level).padStart(2, "0");

  $("#playerName").textContent = game.name;
  $("#petName").textContent = game.name;

  const indicators = [
    ["hunger", "hungerText", "hungerBar"],
    ["energy", "energyText", "energyBar"],
    ["happiness", "happyText", "happyBar"],
    ["clean", "cleanText", "cleanBar"]
  ];

  indicators.forEach(([key, textId, barId]) => {
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
    ? "Қаҳрамон истироҳат мекунад."
    : lowest < 25
      ? "Ба ман каме ғамхорӣ лозим аст."
      : "Ман омодаам, ки қавитар шавам!";

  $("#pet").classList.toggle("sleeping", game.sleeping);

  renderShop();
  renderTasks();
}

/* Сохтани маҳсулоти мағоза */
function renderShop() {
  $("#shopGrid").innerHTML = products.map((product) => `
    <article class="shop-item">
      <span class="product-icon">${product.icon}</span>
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <span class="price">◈ ${product.price} танга</span>
      <button
        class="btn primary"
        data-buy="${product.id}"
        type="button"
      >
        ХАРИД КАРДАН
      </button>
    </article>
  `).join("");
}

/* Сохтани вазифаҳо */
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
        <span class="task-reward">+${task.reward} ◈</span>
        <span class="task-check">${done ? "✓" : "○"}</span>
      </article>
    `;
  }).join("");

  const count = tasks.filter((task) =>
    game.completed.includes(task.id)
  ).length;

  $("#taskCount").textContent = `${count} / ${tasks.length}`;
  $("#taskBar").style.width =
    (count / tasks.length * 100) + "%";
}

/* Харидани ғизо */
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

  showToast(`${product.name} харидорӣ шуд.`);
}

/* Ба қаҳрамон ғизо додан */
function feedPet() {
  if (game.food <= 0) {
    openModal(
      "🍗",
      "Ғизо тамом шуд",
      "Аз мағоза хӯрок харид кун.",
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
  game.happiness = clamp(game.happiness + 4);

  addExperience(5);
  completeTask("feed");

  setReaction("Хӯроки болаззат! 🍗");
  showToast("Ба картошка ғизо дода шуд.");

  finishAction();
}

/* Амалҳои персонаж */
function performAction(type) {
  if (type !== "sleep" && game.sleeping) {
    showToast("Аввал картошкаро бедор кун.");
    setReaction("Ман ҳоло хобам 😴");
    return;
  }

  switch (type) {
    case "feed":
      feedPet();
      return;

    case "play":
      if (game.energy < 12) {
        showToast("Энергия кам аст. Аввал истироҳат кун.");
        return;
      }

      game.energy = clamp(game.energy - 10);
      game.hunger = clamp(game.hunger - 5);
      game.happiness = clamp(game.happiness + 18);

      addExperience(10);
      completeTask("play");
      animatePet("jump");

      setReaction("Биё бозӣ мекунем! ⚡");
      showToast("Бозии хуб! Таҷриба гирифтӣ.");
      break;

    case "sleep":
      if (!game.sleeping) {
        game.sleeping = true;
        setReaction("Шаб ба хайр... 😴");
        showToast("Картошка хоб рафт.");
      } else {
        game.sleeping = false;
        game.energy = clamp(game.energy + 35);
        game.happiness = clamp(game.happiness + 5);

        addExperience(3);
        setReaction("Ман бедор шудам! 💪");
        showToast("Картошка бедор шуд.");
      }
      break;

    case "wash":
      game.clean = clamp(game.clean + 30);
      game.happiness = clamp(game.happiness + 5);

      addExperience(5);
      completeTask("wash");

      setReaction("Ҳоло ман тозаам! ♨");
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

      addExperience(7);
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

      addExperience(12);
      completeTask("train");
      animatePet("train");

      setReaction("Ман қавӣ мешавам! 🏋");
      showToast("Машқ анҷом ёфт. Таҷриба гирифтӣ.");
      break;

    case "love":
      game.happiness = clamp(game.happiness + 12);

      addExperience(3);
      setReaction("Раҳмат, дӯсти ман! ♥");
      showToast("Дӯстӣ зиёд шуд.");
      break;

    default:
      return;
  }

  finishAction();
}

/* Сабт ва навсозӣ баъди амал */
function finishAction() {
  saveGame();
  renderGame();
}

/* Аз нав оғоз кардан */
function resetGame() {
  openModal(
    "↻",
    "Аз нав оғоз мекунӣ?",
    "Тангаҳо ва пешрафти бозӣ аз нав мешаванд.",
    [{
      label: "БАЛЕ, АЗ НАВ",
      run: () => {
        game = freshGame();
        saveGame();
        renderGame();
        closeModal();
        showToast("Бозӣ аз нав оғоз шуд.");
      }
    }]
  );
}

/* Пайваст кардани ҳамаи тугмаҳо */
function connectButtons() {
  /* Оғози бозӣ */
  $("#startBtn").addEventListener("click", () => {
    $("#welcome").classList.add("hidden");
    $("#app").classList.remove("hidden");

    renderGame();
    showToast("Хуш омадӣ, " + game.name + "!");
  });

  /* Менюи саҳифаҳо */
  $$(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => {
      showPage(button.dataset.page);
    });
  });

  /* Амалҳои қаҳрамон */
  $$("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      performAction(button.dataset.action);
    });
  });

  /* Тугмаҳои харид */
  $("#shopGrid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-buy]");

    if (button) {
      buyProduct(button.dataset.buy);
    }
  });

  /* Танзимот */
  $("#settingsBtn").addEventListener("click", () => {
    openModal(
      "⚙",
      "Танзимот",
      "Пешрафти бозӣ дар браузери ту нигоҳ дошта мешавад.",
      [{
        label: "АЗ НАВ ОҒОЗ КАРДАН",
        run: resetGame
      }]
    );
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

  /* Бозоғозкунӣ */
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
      setReaction("Ман хобам 😴");
      return;
    }

    game.happiness = clamp(game.happiness + 2);
    addExperience(1);

    animatePet("jump");
    setReaction("Ҳа-ҳа! 😎");

    saveGame();
    renderGame();
  });

  /* Сабт ҳангоми пӯшидани саҳифа */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      saveGame();
    }
  });

  window.addEventListener("beforeunload", saveGame);
}

/* Тағйирёбии ҳолати қаҳрамон ҳар дақиқа */
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

/* ОҒОЗИ БОЗӢ */
function initGame() {
  loadGame();
  connectButtons();
  renderGame();

  setInterval(updateNeeds, 60000);
}

initGame();
