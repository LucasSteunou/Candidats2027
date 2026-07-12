import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  Compass,
  Home,
  Library,
  Loader2,
  Map,
  Settings,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { completeLesson, getCurrentDay, getDay, getStatus } from "./api.js";

const lessonMeta = {
  country: {
    label: "Pays du jour",
    start: "Lire le pays",
    complete: "Valider le pays",
    done: "Pays terminé",
    icon: Map,
  },
  question: {
    label: "Question du jour",
    start: "Lire la question",
    complete: "Valider la question",
    done: "Question terminée",
    icon: CircleHelp,
  },
};

function routeFromHash() {
  return window.location.hash.replace(/^#/, "") || "/";
}

function go(path) {
  window.location.hash = path;
}

function useRoute() {
  const [route, setRoute] = useState(routeFromHash);
  useEffect(() => {
    const update = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return route;
}

export default function App() {
  const route = useRoute();
  const [status, setStatus] = useState(null);
  const [currentDay, setCurrentDay] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const statusData = await getStatus();
      setStatus(statusData);
      try {
        setCurrentDay(await getCurrentDay());
      } catch (dayError) {
        setCurrentDay(null);
        setError(dayError.message);
      }
    } catch (statusError) {
      setError(statusError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const content = useMemo(() => {
    if (loading) return <LoadingView />;
    if (route === "/archive") return <Archive status={status} />;
    if (route === "/about") return <About />;

    const archiveMatch = route.match(/^\/day\/(\d+)\/(country|question)$/);
    if (archiveMatch) {
      return <ArchivedLesson day={Number(archiveMatch[1])} lessonType={archiveMatch[2]} />;
    }

    const lessonMatch = route.match(/^\/lesson\/(country|question)$/);
    if (lessonMatch) {
      return (
        <CurrentLesson
          dayData={currentDay}
          error={error}
          lessonType={lessonMatch[1]}
          status={status}
          onComplete={refresh}
        />
      );
    }

    return <HomeView status={status} dayData={currentDay} error={error} />;
  }, [currentDay, error, loading, route, status]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Aller au contenu
      </a>
      <header className="topbar">
        <button className="icon-button" type="button" aria-label="Accueil" onClick={() => go("/")}>
          <Home size={22} aria-hidden="true" />
        </button>
        <div>
          <p className="eyebrow">Culture365</p>
          <h1>Votre dose quotidienne de monde</h1>
        </div>
      </header>
      <main id="main" className="main-content" tabIndex="-1">
        {content}
      </main>
      <nav className="bottom-nav" aria-label="Navigation principale">
        <NavButton icon={Home} label="Aujourd'hui" active={route === "/"} onClick={() => go("/")} />
        <NavButton icon={Library} label="Archives" active={route === "/archive"} onClick={() => go("/archive")} />
        <NavButton icon={Settings} label="À propos" active={route === "/about"} onClick={() => go("/about")} />
      </nav>
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button className={`nav-button ${active ? "is-active" : ""}`} type="button" onClick={onClick}>
      <Icon size={20} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

function LoadingView() {
  return (
    <section className="state-card" aria-live="polite">
      <Loader2 className="spin" size={28} aria-hidden="true" />
      <p>Chargement de vos leçons...</p>
    </section>
  );
}

function HomeView({ status, dayData, error }) {
  if (!status) {
    return <MessageCard title="Impossible de lire les données" body={error || "Vérifiez que les contenus sont bien exportés."} />;
  }

  if (!dayData) {
    return (
      <MessageCard
        title={`Jour ${status.current_day} à préparer`}
        body="Cette journée n'est pas encore importée. Créez une demande avec python generate.py 1, puis importez le pack JSON."
      />
    );
  }

  const completed = status.completed_lessons[String(dayData.day)] || [];
  return (
    <section className="home-grid">
      <div className="day-header">
        <p className="eyebrow">Aujourd'hui</p>
        <h2>Jour {dayData.day}</h2>
        <p>Deux petites leçons, assez courtes pour tenir dans une pause, assez riches pour rester en tête.</p>
      </div>
      <LessonTile lesson={dayData.country} type="country" completed={completed.includes("country")} />
      <LessonTile lesson={dayData.question} type="question" completed={completed.includes("question")} />
    </section>
  );
}

function LessonTile({ lesson, type, completed }) {
  const meta = lessonMeta[type];
  const Icon = meta.icon;
  return (
    <article className="lesson-tile">
      <div className="tile-media">
        {lesson.image?.path ? <img src={lesson.image.path} alt={lesson.image.alt_text} loading="lazy" /> : <Icon size={48} />}
      </div>
      <div className="tile-body">
        <div className="tile-kicker">
          <Icon size={18} aria-hidden="true" />
          <span>{meta.label}</span>
          {completed ? <CheckCircle2 size={18} aria-label="Terminé" /> : null}
        </div>
        <h3>{lesson.title}</h3>
        <p>{lesson.hook}</p>
        <button className="primary-button" type="button" onClick={() => go(`/lesson/${type}`)}>
          {completed ? "Relire" : meta.start}
        </button>
      </div>
    </article>
  );
}

function CurrentLesson({ dayData, error, lessonType, status, onComplete }) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  if (!dayData) {
    return <MessageCard title="Leçon indisponible" body={error || "Importez cette journée avant de la lire."} />;
  }

  const completed = status?.completed_lessons[String(dayData.day)] || [];
  const isDone = completed.includes(lessonType);
  const lesson = dayData[lessonType];

  async function markDone() {
    setSaving(true);
    setSaveError("");
    try {
      await completeLesson(dayData.day, lessonType);
      await onComplete();
      go("/");
    } catch (completeError) {
      setSaveError(completeError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <LessonPage
      lesson={lesson}
      action={
        <div className="sticky-action">
          {saveError ? <p className="error-text" role="alert">{saveError}</p> : null}
          <button className="primary-button" type="button" onClick={markDone} disabled={saving || isDone}>
            {saving ? "Validation..." : isDone ? lessonMeta[lessonType].done : lessonMeta[lessonType].complete}
          </button>
        </div>
      }
    />
  );
}

function ArchivedLesson({ day, lessonType }) {
  const [dayData, setDayData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setDayData(null);
    setError("");
    getDay(day).then(setDayData).catch((archiveError) => setError(archiveError.message));
  }, [day]);

  if (error) return <MessageCard title="Archive indisponible" body={error} />;
  if (!dayData) return <LoadingView />;

  return <LessonPage lesson={dayData[lessonType]} action={<button className="secondary-button" type="button" onClick={() => go("/archive")}>Retour aux archives</button>} />;
}

function LessonPage({ lesson, action }) {
  return (
    <article className="lesson-page">
      <button className="back-button" type="button" onClick={() => go("/")}>
        <ArrowLeft size={18} aria-hidden="true" />
        Retour
      </button>
      <header className="lesson-hero">
        {lesson.image?.path ? <img src={lesson.image.path} alt={lesson.image.alt_text} /> : null}
        <p className="eyebrow">Jour {lesson.day}</p>
        <h2>{lesson.title}</h2>
        <p>{lesson.hook}</p>
      </header>

      <Card title="En bref">
        <p>{lesson.summary}</p>
      </Card>

      <Card title="À retenir">
        <ul className="clean-list">
          {lesson.takeaways.map((item) => (
            <li key={item}>
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>

      {lesson.cards.map((card) => (
        <Card key={card.heading} title={card.heading}>
          <p>{card.body}</p>
        </Card>
      ))}

      <Card title="Chiffres clés">
        <div className="figures-grid">
          {lesson.key_figures.map((figure) => (
            <div className="figure" key={`${figure.label}-${figure.value}`}>
              <strong>{figure.value}</strong>
              <span>{figure.label}</span>
              <p>{figure.note}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="L'anecdote">
        <p>{lesson.anecdote}</p>
      </Card>

      <Card title="Sources">
        <ul className="source-list">
          {lesson.sources.map((source) => (
            <li key={`${source.title}-${source.url}`}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.title}
              </a>
              <p>{source.description}</p>
            </li>
          ))}
        </ul>
      </Card>

      {action}
    </article>
  );
}

function Card({ title, children }) {
  return (
    <section className="content-card">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function Archive({ status }) {
  const days = status?.generated_days || [];
  if (!days.length) {
    return <MessageCard title="Aucune archive" body="Importez vos premières leçons pour remplir cette page." />;
  }
  return (
    <section className="archive-page">
      <div className="section-title">
        <BookOpen size={24} aria-hidden="true" />
        <div>
          <p className="eyebrow">Archives</p>
          <h2>Vos journées générées</h2>
        </div>
      </div>
      <div className="archive-grid">
        {days.map((day) => (
          <article className="archive-card" key={day}>
            <h3>Jour {day}</h3>
            <div className="archive-actions">
              <button type="button" onClick={() => go(`/day/${day}/country`)}>
                Pays
              </button>
              <button type="button" onClick={() => go(`/day/${day}/question`)}>
                Question
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="about-page">
      <div className="section-title">
        <Compass size={24} aria-hidden="true" />
        <div>
          <p className="eyebrow">À propos</p>
          <h2>Apprendre un peu mieux, chaque jour</h2>
        </div>
      </div>
      <Card title="Principe">
        <p>Culture365 vous propose un territoire et une question de culture générale, puis garde tout en local pour une lecture simple, rapide et durable.</p>
      </Card>
      <Card title="Hors ligne">
        <p>Les leçons déjà ouvertes peuvent rester disponibles hors ligne grâce à l'installation de l'application sur votre téléphone.</p>
      </Card>
      <Card title="Génération">
        <p>Quand vous manquez de journées, préparez une demande de contenu puis importez le pack JSON. La lecture, elle, ne dépend jamais d'un appel externe.</p>
      </Card>
    </section>
  );
}

function MessageCard({ title, body }) {
  return (
    <section className="state-card">
      <Sparkles size={28} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{body}</p>
    </section>
  );
}
