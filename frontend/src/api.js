const API_BASE = import.meta.env.VITE_API_BASE || "";
const BASE_URL = import.meta.env.BASE_URL || "/";
const PROGRESS_KEY = "culture365-progress-v1";
let staticStatePromise;

function publicPath(path) {
  const base = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;
  return `${base}${path.replace(/^\/+/, "")}`;
}

async function request(path, options) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    let message = "Une erreur est survenue.";
    try {
      const data = await response.json();
      message = data.detail || message;
    } catch {
      message = await response.text();
    }
    throw new Error(message);
  }
  return response.json();
}

async function loadStaticState() {
  if (!staticStatePromise) {
    staticStatePromise = fetch(publicPath("/content/state.json"))
      .then(async (response) => {
        if (!response.ok) return null;
        const text = await response.text();
        const data = JSON.parse(text);
        return data.static_export ? data : null;
      })
      .catch(() => null);
  }
  return staticStatePromise;
}

function localProgress(staticState) {
  try {
    const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    return {
      current_day: saved.current_day || staticState.current_day || 1,
      completed_lessons: saved.completed_lessons || {},
    };
  } catch {
    return { current_day: staticState.current_day || 1, completed_lessons: {} };
  }
}

function saveLocalProgress(progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function normalizeAssetPath(lesson) {
  if (lesson?.image?.path?.startsWith("/")) {
    return { ...lesson, image: { ...lesson.image, path: publicPath(lesson.image.path) } };
  }
  return lesson;
}

async function readStaticDay(day) {
  const base = `/content/generated/day-${String(day).padStart(3, "0")}`;
  const [country, question, manifest] = await Promise.all([
    fetch(publicPath(`${base}/country.json`)).then(readJson),
    fetch(publicPath(`${base}/question.json`)).then(readJson),
    fetch(publicPath(`${base}/manifest.json`)).then(readJson),
  ]);
  return {
    day,
    country: normalizeAssetPath(country),
    question: normalizeAssetPath(question),
    manifest,
  };
}

async function readJson(response) {
  if (!response.ok) throw new Error("Cette journée n'est pas disponible dans l'application installée.");
  return response.json();
}

export async function getStatus() {
  const staticState = await loadStaticState();
  if (staticState) {
    const progress = localProgress(staticState);
    return {
      current_day: progress.current_day,
      last_generated_day: staticState.last_generated_day,
      generated_days: staticState.generated_days,
      completed_lessons: progress.completed_lessons,
    };
  }
  return request("/api/status");
}

export async function getCurrentDay() {
  const staticState = await loadStaticState();
  if (staticState) {
    const status = await getStatus();
    if (!staticState.generated_days.includes(status.current_day)) {
      throw new Error("Cette journée n'est pas encore dans l'application installée.");
    }
    return readStaticDay(status.current_day);
  }
  return request("/api/day/current");
}

export async function getDay(day) {
  const staticState = await loadStaticState();
  if (staticState) {
    if (!staticState.generated_days.includes(day)) {
      throw new Error("Cette archive n'est pas disponible dans l'application installée.");
    }
    return readStaticDay(day);
  }
  return request(`/api/day/${day}`);
}

export async function completeLesson(day, lessonType) {
  const staticState = await loadStaticState();
  if (staticState) {
    const progress = localProgress(staticState);
    if (day !== progress.current_day) {
      throw new Error(`Seul le jour ${progress.current_day} peut être validé.`);
    }
    const completed = new Set(progress.completed_lessons[String(day)] || []);
    completed.add(lessonType);
    progress.completed_lessons[String(day)] = Array.from(completed);
    if (completed.has("country") && completed.has("question")) {
      progress.current_day = Math.min(day + 1, staticState.last_generated_day + 1);
    }
    saveLocalProgress(progress);
    return getStatus();
  }
  return request(`/api/progress/${day}/${lessonType}/complete`, { method: "POST" });
}
