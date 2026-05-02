const API_URL = "https://text.pollinations.ai/generate/"; 
const CACHE_KEY = "aiNewsCacheV1";
const CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_CATEGORIES = ["tech", "science", "sports", "business"];
const CARD_SIZES = ["size-sm", "size-md", "size-lg"];

let allNews = [];
let currentCategory = "all";
let currentSearch = "";

const newsFeedEl = document.getElementById("newsFeed");
const searchInputEl = document.getElementById("searchInput");
const searchButtonEl = document.querySelector(".search-button");
const categoryButtons = Array.from(document.querySelectorAll(".nav-button"));

function createDebounced(fn, delay = 300) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getCategoryLabel(category) {
  const labels = {
    tech: "Технологии",
    science: "Наука",
    sports: "Спорт",
    business: "Экономика",
    culture: "Культура",
    all: "Все"
  };
  return labels[category] || category;
}

// Замени функцию getPicsumImageUrl на:
function getPicsumImageUrl(seed) {
    return `https://placebear.com/${Math.floor(Math.random() * 400 + 400)}/${Math.floor(Math.random() * 300 + 300)}`;
  }

function getCardSize(index, seed) {
  const hash = `${seed}-${index}`;
  let total = 0;
  for (let i = 0; i < hash.length; i += 1) {
    total += hash.charCodeAt(i);
  }
  return CARD_SIZES[total % CARD_SIZES.length];
}

function normalizeNewsItem(item, index = 0) {
  const safeCategory = item.category || "tech";
  const safeId = item.id || `${safeCategory}-${Date.now()}-${index}`;
  return {
    ...item,
    id: safeId,
    category: safeCategory,
    createdAt: item.createdAt || new Date().toISOString(),
    imageUrl: item.imageUrl || getPicsumImageUrl(`${safeCategory}-${safeId}`),
    cardSize: item.cardSize || getCardSize(index, safeId)
  };
}

function parseNewsText(rawText, category) {
  if (!rawText || typeof rawText !== "string") {
    return [];
  }

  const chunks = rawText
    .split("---")
    .map((part) => part.trim())
    .filter(Boolean);

  if (chunks.length === 0) {
    const match = rawText.match(/\*\*(.+?)\*\*\s*([\s\S]*)/);
    if (match) {
      return [{
        id: `${category}-${Date.now()}-${Math.random()}`,
        title: match[1].trim(),
        content: match[2].trim().substring(0, 500),
        category: category,
        createdAt: new Date().toISOString(),
        imageUrl: getPicsumImageUrl(`${category}-${Date.now()}`),
        cardSize: getCardSize(0, `${category}-${Date.now()}`)
      }];
    }
    return [];
  }

  return chunks.map((chunk, index) => {
    const match = chunk.match(/\*\*(.+?)\*\*\s*([\s\S]*)/);
    const title = match?.[1]?.trim() || `Новость #${index + 1}`;
    const content = match?.[2]?.trim() || chunk.replace(/\*\*/g, "").trim();
    
    // Обрезаем слишком длинный контент
    const trimmedContent = content.length > 500 ? content.substring(0, 500) + "..." : content;

    const id = `${category}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
    return {
      id,
      title: title.substring(0, 100),
      content: trimmedContent,
      category,
      createdAt: new Date().toISOString(),
      imageUrl: getPicsumImageUrl(`${category}-${title}-${index}`),
      cardSize: getCardSize(index, id)
    };
  });
}

async function generateNews(category, count = 2) {
  const prompt = `Напиши ${count} короткие новости на тему "${getCategoryLabel(category)}". 
Формат каждой новости: 
**Заголовок**
Текст новости (3-4 предложения, около 50-80 слов).
Раздели новости строкой "---". Язык: русский.`;
  
  try {
    const response = await fetch(API_URL + encodeURIComponent(prompt));
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const rawText = await response.text();
    console.log(`✅ Загружена категория ${category}, длина ответа: ${rawText.length} символов`);
    
    const news = parseNewsText(rawText, category);
    
    if (news.length === 0) {
      console.warn(`Не удалось распарсить новости для ${category}, создаю заглушку`);
      return [{
        id: `${category}-fallback-${Date.now()}`,
        title: `Новости из области ${getCategoryLabel(category)}`,
        content: `Это автоматически сгенерированная новость. Сервис временно недоступен, но мы работаем над этим. Попробуйте обновить страницу позже.`,
        category: category,
        createdAt: new Date().toISOString(),
        imageUrl: getPicsumImageUrl(`fallback-${category}`),
        cardSize: getCardSize(0, `fallback-${category}`)
      }];
    }
    
    return news;
  } catch (error) {
    console.error(`Ошибка загрузки ${category}:`, error);
    return [{
      id: `${category}-error-${Date.now()}`,
      title: `Ошибка загрузки новостей: ${getCategoryLabel(category)}`,
      content: `Не удалось загрузить новости. Проверь подключение к интернету и попробуй обновить страницу. Ошибка: ${error.message}`,
      category: category,
      createdAt: new Date().toISOString(),
      imageUrl: getPicsumImageUrl(`error-${category}`),
      cardSize: "size-md"
    }];
  }
}

function getCategoryNews(category) {
  return allNews.filter((item) => item.category === category);
}

async function loadAllNews() {
  console.log("Начинаю загрузку всех категорий...");
  const batches = await Promise.all(
    DEFAULT_CATEGORIES.map((category) => generateNews(category))
  );
  
  allNews = batches.flat().map((item, index) => normalizeNewsItem(item, index));
  console.log(`Загружено ${allNews.length} новостей`);
  saveCache();
  renderNewsFeed();
}

async function loadCategoryNews(category) {
  console.log(` Загрузка категории ${category}...`);
  const news = await generateNews(category);
  allNews = allNews
    .filter((item) => item.category !== category)
    .concat(news.map((item, index) => normalizeNewsItem(item, index)));
  saveCache();
  renderNewsFeed();
}

function renderNewsFeed() {
  if (!newsFeedEl) {
    return;
  }

  const filtered = allNews
    .filter((item) => currentCategory === "all" || item.category === currentCategory)
    .filter((item) => {
      if (!currentSearch) {
        return true;
      }
      const haystack = `${item.title} ${item.content}`.toLowerCase();
      return haystack.includes(currentSearch.toLowerCase());
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!filtered.length) {
    newsFeedEl.innerHTML = `
      <div style="text-align:center; padding:3rem;">
        <h2>Новостей не найдено</h2>
        <p>Попробуйте выбрать другую категорию или изменить поисковый запрос.</p>
      </div>
    `;
    return;
  }

  newsFeedEl.innerHTML = filtered
    .map(
      (item) => `
      <article class="news-card ${escapeHtml(item.cardSize)}" data-id="${escapeHtml(item.id)}">
        <div class="news-media skeleton">
          <span class="news-category-badge">${escapeHtml(getCategoryLabel(item.category))}</span>
          <img class="news-image" src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" loading="lazy">
        </div>
        <div class="news-content">
          <h2>${escapeHtml(item.title)}</h2>
          <p>${escapeHtml(item.content)}</p>
        </div>
      </article>
    `
    )
    .join("");

  const cards = Array.from(newsFeedEl.querySelectorAll(".news-card"));
  cards.forEach((card) => {
    const image = card.querySelector(".news-image");
    const media = card.querySelector(".news-media");
    if (!image || !media) {
      return;
    }

    const applyLoadedState = () => {
      image.classList.add("loaded");
      media.classList.add("loaded");
      media.classList.remove("skeleton");
    };

    if (image.complete) {
      applyLoadedState();
    } else {
      image.addEventListener("load", applyLoadedState, { once: true });
      image.addEventListener(
        "error",
        () => {
          image.src = getPicsumImageUrl(`fallback-${card.dataset.id}`);
        },
        { once: true }
      );
    }
  });
}

function saveCache() {
  const payload = {
    timestamp: Date.now(),
    news: allNews.map((item, index) => normalizeNewsItem(item, index))
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
}

function readCache() {
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.news) || typeof parsed.timestamp !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function setActiveCategoryButton(button) {
  categoryButtons.forEach((btn) => btn.classList.remove("active"));
  button.classList.add("active");
}

function bindCategoryHandlers() {
  categoryButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const selectedCategory = button.dataset.category || "all";
      setActiveCategoryButton(button);
      currentCategory = selectedCategory;

      if (
        selectedCategory !== "all" &&
        !getCategoryNews(selectedCategory).length &&
        DEFAULT_CATEGORIES.includes(selectedCategory)
      ) {
        try {
          await loadCategoryNews(selectedCategory);
        } catch (error) {
          console.error(error);
        }
      }

      renderNewsFeed();
    });
  });
}

function bindSearchHandlers() {
  if (!searchInputEl || !searchButtonEl) {
    return;
  }

  const applySearch = createDebounced((value) => {
    currentSearch = value.trim();
    renderNewsFeed();
  }, 300);

  searchButtonEl.addEventListener("click", () => {
    searchInputEl.classList.toggle("visible");
    if (searchInputEl.classList.contains("visible")) {
      searchInputEl.focus();
    } else {
      searchInputEl.value = "";
      currentSearch = "";
      renderNewsFeed();
    }
  });

  searchInputEl.addEventListener("input", (event) => {
    applySearch(event.target.value);
  });
}

async function initNewsApp() {
  console.log("🎬 Инициализация приложения...");
  bindCategoryHandlers();
  bindSearchHandlers();

  const cache = readCache();
  const hasFreshCache = cache && Date.now() - cache.timestamp < CACHE_TTL_MS;

  if (cache?.news?.length) {
    allNews = cache.news.map((item, index) => normalizeNewsItem(item, index));
    renderNewsFeed();
    console.log(`Загружено из кэша: ${allNews.length} новостей`);
  }

  if (hasFreshCache) {
    console.log("Фоновое обновление кэша...");
    loadAllNews().catch((error) => console.error(error));
    return;
  }

  try {
    await loadAllNews();
  } catch (error) {
    console.error(" Критическая ошибка:", error);
    if (!allNews.length && newsFeedEl) {
      newsFeedEl.innerHTML = `
        <div style="text-align:center; padding:3rem;">
          <h2>Ошибка загрузки</h2>
          <p>Не удалось загрузить новости</p>
          <p style="color:#666; font-size:0.9rem;">${error.message}</p>
        </div>
      `;
    }
  }
}

document.addEventListener("DOMContentLoaded", initNewsApp);