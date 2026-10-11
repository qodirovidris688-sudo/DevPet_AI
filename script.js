
"use strict";

/* ==========================================
   КАРТОШКА БИРЁН — МАРКАЗИ ИДОРАКУНИИ БОЗӢ
   ========================================== */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const SAVE_KEY = "kartoshkaBiryonProSave";

const defaults = {
    name: "Картошка",
    coins: 100,
    xp: 0,
    level: 1,
    hunger: 80,
    energy: 85,
    happiness: 85,
    clean: 85,
    sleeping: false,
    inventory: { food: 2 },
    bought: 0,
    totalActions: 0,
    completedTasks: [],
    taskDate: new Date().toDateString(),
    lastSaved: Date.now()
};

let state = structuredClone(defaults);
let toastTimer;
let reactionTimer;
let modalCallback = null;
let animationTimer = null;
let isStarted = false;

const products = [
    { id: "apple", icon: "🍎", name: "Себ", description: "Ғизои сабук барои барқарор кардани гуруснагӣ.", price: 10, hunger: 15, energy: 2 },
    { id: "burger", icon: "🍔", name: "Бургер", description: "Ғизои пурқувват барои қаҳрамони ту.", price: 25, hunger: 35, energy: 5 },
    { id: "chicken", icon: "🍗", name: "Гӯшти бирён", description: "Ғизои махсус барои варзишгар.", price: 35, hunger: 45, energy: 12 },
    { id: "milk", icon: "🥛", name: "Шир", description: "Барои барқарор кардани қувват.", price: 15, hunger: 8, energy: 15 },
    { id: "pizza", icon: "🍕", name: "Пицца", description: "Ғизои болаззат барои рӯҳияи хуб.", price: 30, hunger: 30, energy: 4 },
    { id: "steak", icon: "🥩", name: "Стейк", description: "Ғизои махсус барои қаҳрамони қавӣ.", price: 50, hunger: 50, energy: 20 }
];

const taskDefinitions = [
    { id: "feed", icon: "🍗", name: "Ғизо додан", description: "Ба картошка як бор хӯрок деҳ.", reward: 15 },
    { id: "play", icon: "⚡", name: "Бозӣ кардан", description: "Бо картошка як бор бозӣ кун.", reward: 15 },
    { id: "wash", icon: "♨", name: "Оббозӣ", description: "Тозагии картошкаро зиёд кун.", reward: 15 },
    { id: "train", icon: "🏋", name: "Машқ кардан", description: "Як машқи варзишӣ иҷро кун.", reward: 20 }
];

function numberOr(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function clamp(value) {
    return Math.max(0, Math.min(100, numberOr(value, 0)));
}

function loadGame() {
    try {
        const saved = localStorage.getItem(SAVE_KEY);

        if (!saved) {
            state = structuredClone(defaults);
            return;
        }

        const parsed = JSON.parse(saved);
        if (!parsed || typeof parsed !== "object") {
            state = structuredClone(defaults);
            return;
        }

        state = {
            ...structuredClone(defaults),
            ...parsed,
            name: typeof parsed.name === "string" ? parsed.name.slice(0, 18) : defaults.name,
            coins: Math.max(0, numberOr(parsed.coins, defaults.coins)),
            xp: Math.max(0, numberOr(parsed.xp, 0)),
            level: Math.max(1, numberOr(parsed.level, 1)),
            hunger: clamp(parsed.hunger),
            energy: clamp(parsed.energy),
            happiness: clamp(parsed.happiness),
            clean: clamp(parsed.clean),
            sleeping: Boolean(parsed.sleeping),
            inventory: {
                food: Math.max(0, numberOr(parsed.inventory?.food, 2))
            },
            completedTasks: Array.isArray(parsed.completedTasks) ? parsed.completedTasks : [],
            totalActions: Math.max(0, numberOr(parsed.totalActions, 0)),
            bought: Math.max(0, numberOr(parsed.bought, 0))
        };

        resetDailyTasksIfNeeded();

        const elapsed = Math.max(
            0,
            Math.min(240, (Date.now() - numberOr(parsed.lastSaved, Date.now())) / 60000)
        );

        if (elapsed > 0) {
            if (state.sleeping) {
                state.energy = clamp(state.energy + elapsed * 0.5);
                state.hunger = clamp(state.hunger - elapsed * 0.12);
            } else {
                state.hunger = clamp(state.hunger - elapsed * 0.16);
                state.energy = clamp(state.energy - elapsed * 0.12);
                state.happiness = clamp(state.happiness - elapsed * 0.08);
                state.clean = clamp(state.clean - elapsed * 0.05);
            }
        }
    } catch (error) {
        console.error("Хатои хондани сабт:", error);
        state = structuredClone(defaults);
    }
}

function saveGame() {
    try {
        state.lastSaved = Date.now();
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error("Хатои сабти бозӣ:", error);
        showToast("Маълумот сабт нашуд. Хотираи браузерро санҷ.");
    }
}

function resetDailyTasksIfNeeded() {
    const today = new Date().toDateString();

    if (state.taskDate !== today) {
        state.completedTasks = [];
        state.taskDate = today;
    }
}

function xpNeeded() {
    return 100 + (state.level - 1) * 30;
}

function addXP(amount) {
    state.xp += amount;

    while (state.xp >= xpNeeded()) {
        state.xp -= xpNeeded();
        state.level += 1;
        state.coins += 25;
        showToast(`Сатҳи нав! Level ${state.level} · +25 танга`);
        react("Ман қавитар шудам! 💪");
        animateCharacter("jump");
    }
}

function levelName() {
    if (state.level >= 15) return "Афсона";
    if (state.level >= 10) return "Қаҳрамон";
    if (state.level >= 6) return "Варзишгар";
    if (state.level >= 3) return "Ҷанговар";
    return "Навкор";
}

function renderStats() {
    $("#coinCount").textContent = state.coins;
    $("#shopCoins").textContent = state.coins;
    $("#levelNumber").textContent = String(state.level).padStart(2, "0");
    $("#greetingName").textContent = state.name;
    $("#heroPetName").textContent = state.name;
    $("#footerLevel").textContent = `LEVEL ${String(state.level).padStart(2, "0")}`;

    $("#hungerValue").textContent = `${Math.round(state.hunger)}%`;
    $("#energyValue").textContent = `${Math.round(state.energy)}%`;
    $("#happyValue").textContent = `${Math.round(state.happiness)}%`;
    $("#cleanValue").textContent = `${Math.round(state.clean)}%`;

    $("#hungerBar").style.width = `${state.hunger}%`;
    $("#energyBar").style.width = `${state.energy}%`;
    $("#happyBar").style.width = `${state.happiness}%`;
    $("#cleanBar").style.width = `${state.clean}%`;

    $("#statsLevel").textContent = state.level;
    $("#statsCoins").textContent = state.coins;
    $("#statsXP").textContent = state.xp;
    $("#statsTasks").textContent = state.completedTasks.length;

    $("#sleepActionName").textContent = state.sleeping ? "Бедор кардан" : "Хоб кардан";

    const lowest = Math.min(state.hunger, state.energy, state.happiness, state.clean);

    if (state.sleeping) {
        $("#petStatus").textContent = "ДАР ХОБ";
        $("#moodLabel").textContent = "Истироҳат";
        $("#heroDescription").textContent = "Қаҳрамон истироҳат мекунад.";
    } else if (lowest < 25) {
        $("#petStatus").textContent = "ЁРИИ ТУ ЛОЗИМ";
        $("#moodLabel").textContent = "Хаста";
        $("#heroDescription").textContent = "Ба ман ғизо деҳ ва қувватамро барқарор кун.";
    } else if (state.happiness >= 75) {
        $("#petStatus").textContent = "ОМОДА";
        $("#moodLabel").textContent = "Хушҳол";
        $("#heroDescription").textContent = "Ман омодаам, ки қавитар шавам!";
    } else {
        $("#petStatus").textContent = "МАШҚ КУНЕМ";
        $("#moodLabel").textContent = "Ором";
        $("#heroDescription").textContent = "Як амал интихоб кун ва пешравӣ кун.";
    }

    const character = $("#potatoCharacter");
    character.classList.toggle("is-sleeping", state.sleeping);
    character.classList.toggle("is-happy", state.happiness >= 70 && !state.sleeping);
}

function renderShop() {
    $("#shopGrid").innerHTML = products.map((product) => `
        <article class="shop-item">
            <span class="product-icon">${product.icon}</span>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <span class="price">◈ ${product.price} танга</span>
            <button class="btn btn-primary" data-buy="${product.id}">ХАРИД КАРДАН</button>
        </article>
    `).join("");
}

function renderTasks() {
    const list = $("#taskList");

    list.innerHTML = taskDefinitions.map((task) => {
        const done = state.completedTasks.includes(task.id);

        return `
            <article class="task-row">
                <div class="task-emoji">${task.icon}</div>
                <div class="task-copy">
                    <strong>${task.name}</strong>
                    <small>${task.description}</small>
                </div>
                <span class="task-reward">+${task.reward} ◈</span>
                <span class="task-done">${done ? "✓" : "○"}</span>
            </article>
        `;
    }).join("");

    const count = taskDefinitions.filter((task) =>
        state.completedTasks.includes(task.id)
    ).length;

    $("#taskProgress").textContent = `${count} / ${taskDefinitions.length}`;
    $("#taskProgressBar").style.width = `${count / taskDefinitions.length * 100}%`;
}

function renderAll() {
    renderStats();
    renderShop();
    renderTasks();
}

function completeTask(id) {
    const task = taskDefinitions.find((item) => item.id === id);
    if (!task || state.completedTasks.includes(id)) return;

    state.completedTasks.push(id);
    state.coins += task.reward;
    showToast(`Вазифа иҷро шуд! +${task.reward} танга`);
}

function showToast(message) {
    const element = $("#toast");
    element.textContent = message;
    element.classList.remove("hidden");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.add("hidden"), 2600);
}

function react(message) {
    const element = $("#floatingReaction");
    element.textContent = message;
    element.style.animation = "none";
    void element.offsetWidth;
    element.style.animation = "";
    clearTimeout(reactionTimer);

    reactionTimer = setTimeout(() => {
        element.textContent = state.sleeping ? "Z z z..." : "Тайёрам! 💪";
    }, 2400);
}

function animateCharacter(mode) {
    const character = $("#potatoCharacter");

    character.classList.remove("is-jumping", "is-dancing", "is-training");
    void character.offsetWidth;

    if (mode === "jump") character.classList.add("is-jumping");
    if (mode === "dance") character.classList.add("is-dancing");
    if (mode === "train") character.classList.add("is-training");

    clearTimeout(animationTimer);

    if (mode !== "idle" && mode !== "sleep") {
        animationTimer = setTimeout(() => {
            character.classList.remove("is-jumping", "is-dancing", "is-training");
        }, mode === "dance" ? 2600 : 1000);
    }
}

function requireAwake() {
    if (!state.sleeping) return true;

    showToast("Аввал картошкаро бедор кун.");
    react("Ман ҳоло хобам 😴");
    return false;
}

function performAction(action) {
    if (action !== "sleep" && !requireAwake()) return;

    switch (action) {
        case "feed":
            if (state.inventory.food < 1) {
                openModal("🍗", "Ғизо тамом шуд", "Барои ғизо додан аввал ба мағоза даромада хӯрок харид кун.", [
                    { label: "Ба мағоза", action: () => { closeModal(); showPage("shop"); } }
                ]);
                return;
            }

            if (state.hunger >= 100) {
                showToast("Ман сер ҳастам!");
                react("Дигар хӯрок намехоҳам 😋");
                return;
            }

            state.inventory.food -= 1;
            state.hunger = clamp(state.hunger + 25);
            state.happiness = clamp(state.happiness + 4);
            state.totalActions += 1;
            addXP(5);
            completeTask("feed");
            react("Хӯроки болаззат! 🍗");
            showToast("Ғизо дода шуд.");
            break;

        case "play":
            if (state.energy < 12) {
                showToast("Энергия кам аст. Аввал истироҳат кун.");
                return;
            }

            state.energy = clamp(state.energy - 10);
            state.hunger = clamp(state.hunger - 5);
            state.happiness = clamp(state.happiness + 18);
            state.totalActions += 1;
            addXP(10);
            completeTask("play");
            animateCharacter("jump");
            react("Биё бозӣ мекунем! ⚡");
            showToast("+10 таҷриба гирифтӣ.");
            break;

        case "sleep":
            if (!state.sleeping) {
                state.sleeping = true;
                react("Шаб ба хайр... 😴");
                showToast("Картошка ба хоб рафт.");
            } else {
                state.sleeping = false;
                state.energy = clamp(state.energy + 35);
                state.happiness = clamp(state.happiness + 5);
                addXP(3);
                react("Ман бедор шудам! 💪");
                showToast("Энергия барқарор шуд.");
            }
            break;

        case "wash":
            state.clean = clamp(state.clean + 30);
            state.happiness = clamp(state.happiness + 5);
            state.totalActions += 1;
            addXP(5);
            completeTask("wash");
            react("Ҳоло ман тозаам! ♨");
            showToast("Оббозӣ анҷом ёфт.");
            break;

        case "dance":
            if (state.energy < 10) {
                showToast("Барои рақс энергия лозим аст.");
                return;
            }

            state.energy = clamp(state.energy - 10);
            state.happiness = clamp(state.happiness + 15);
            state.hunger = clamp(state.hunger - 3);
            state.totalActions += 1;
            addXP(7);
            animateCharacter("dance");
            react("Рақс кун! ♫");
            showToast("Рақси олӣ!");
            break;

        case "train":
            if (state.energy < 15) {
                showToast("Барои машқ қувват лозим аст.");
                return;
            }

            state.energy = clamp(state.energy - 15);
            state.hunger = clamp(state.hunger - 7);
            state.happiness = clamp(state.happiness + 6);
            state.totalActions += 1;
            addXP(12);
            completeTask("train");
            animateCharacter("train");
            react("Ман қавӣ мешавам! 🏋");
            showToast("+12 таҷриба аз машқ.");
            break;

        case "love":
            state.happiness = clamp(state.happiness + 12);
            state.totalActions += 1;
            addXP(3);
            react("Раҳмат, дӯсти ман! ♥");
            showToast("Дӯстӣ зиёд шуд.");
            break;

        default:
            return;
    }

    renderAll();
    saveGame();
}

function buyProduct(id) {
    const product = products.find((item) => item.id === id);
    if (!product) return;

    if (state.coins < product.price) {
        showToast("Танга намерасад. Вазифаҳоро иҷро кун.");
        return;
    }

    state.coins -= product.price;
    state.inventory.food += 1;
    state.bought += 1;

    saveGame();
    renderAll();
    showToast(`${product.name} харидорӣ шуд. Барои ғизо додан тугмаро пахш кун.`);
}

function showPage(pageName) {
    const validPages = ["home", "shop", "tasks", "stats"];
    if (!validPages.includes(pageName)) return;

    $$(".page").forEach((page) => page.classList.add("hidden"));
    $(`#page-${pageName}`).classList.remove("hidden");

    $$(".nav-button").forEach((button) => {
        button.classList.toggle("active", button.dataset.page === pageName);
    });

    if (pageName === "shop") renderShop();
    if (pageName === "tasks") renderTasks();
    if (pageName === "stats") renderStats();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function openModal(icon, title, message, buttons = []) {
    $("#modalIcon").textContent = icon;
    $("#modalTitle").textContent = title;
    $("#modalMessage").textContent = message;

    const content = $("#modalContent");
    content.innerHTML = "";

    if (buttons.length) {
        const row = document.createElement("div");
        row.className = "modal-buttons";

        buttons.forEach((item) => {
            const button = document.createElement("button");
            button.className = "btn btn-primary";
            button.textContent = item.label;
            button.addEventListener("click", item.action);
            row.appendChild(button);
        });

        content.appendChild(row);
    }

    modalCallback = null;
    $("#modalOk").textContent = "Фаҳмо";
    $("#modal").classList.remove("hidden");
}

function closeModal() {
    $("#modal").classList.add("hidden");
    modalCallback = null;
}

function openSettings() {
    openModal("⚙", "Танзимот", "Маълумоти бозӣ дар ҳамин браузер нигоҳ дошта мешавад.", [
        {
            label: "Аз нав оғоз кардан",
            action: () => confirmReset()
        }
    ]);
}

function confirmReset() {
    closeModal();

    openModal("↻", "Аз нав оғоз мекунӣ?", "Ҳамаи пешрафт, тангаҳо ва сатҳи бозӣ аз нав мешавад.", [
        {
            label: "Бале, аз нав оғоз кун",
            action: () => {
                state = structuredClone(defaults);
                state.lastSaved = Date.now();
                saveGame();
                renderAll();
                closeModal();
                react("Аз аввал сар мекунем! 💪");
                showToast("Бозӣ аз нав оғоз шуд.");
            }
        }
    ]);
}

function savePetName() {
    const input = $("#nameInput");
    const name = input.value.trim();

    if (!name) {
        showToast("Аввал номро навис.");
        input.focus();
        return;
    }

    state.name = name.slice(0, 18);
    saveGame();
    renderAll();
    showToast("Номи қаҳрамон нигоҳ дошта шуд.");
}

function startGame() {
    if (isStarted) return;
    isStarted = true;

    $("#welcomeScreen").classList.add("hidden");
    $("#gameApp").classList.remove("hidden");

    loadGame();
    renderAll();
    showToast(`Хуш омадӣ, ${state.name}!`);
}

function bindEvents() {
    $("#startButton").addEventListener("click", startGame);

    $$(".nav-button").forEach((button) => {
        button.addEventListener("click", () => showPage(button.dataset.page));
    });

    $$("[data-action]").forEach((button) => {
        button.addEventListener("click", () => performAction(button.dataset.action));
    });

    $("#shopGrid").addEventListener("click", (event) => {
        const button = event.target.closest("[data-buy]");
        if (button) buyProduct(button.dataset.buy);
    });

    $("#settingsButton").addEventListener("click", openSettings);
    $("#saveNameButton").addEventListener("click", savePetName);
    $("#closeModal").addEventListener("click", closeModal);
    $("#modalOk").addEventListener("click", closeModal);

    $("#modal").addEventListener("click", (event) => {
        if (event.target.id === "modal") closeModal();
    });

    $("#nameInput").addEventListener("keydown", (event) => {
        if (event.key === "Enter") savePetName();
    });

    $("#potatoCharacter").addEventListener("click", () => {
        if (state.sleeping) {
            react("Ман хобам 😴");
            return;
        }

        state.happiness = clamp(state.happiness + 2);
        addXP(1);
        animateCharacter("jump");
        react("Ҳа-ҳа! 😎");
        renderAll();
        saveGame();
    });

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") saveGame();
    });

    window.addEventListener("beforeunload", saveGame);
}

function gameTick() {
    if (state.sleeping) {
        state.energy = clamp(state.energy + 4);
        state.hunger = clamp(state.hunger - 1);
    } else {
        state.hunger = clamp(state.hunger - 1);
        state.energy = clamp(state.energy - 0.5);
        state.happiness = clamp(state.happiness - 0.3);
        state.clean = clamp(state.clean - 0.2);
    }

    renderStats();
    saveGame();
}

function initialize() {
    loadGame();
    bindEvents();
    renderAll();

    // Нишондиҳандаҳо ҳар дақиқа каме тағйир меёбанд.
    setInterval(gameTick, 60000);
}

initialize();
