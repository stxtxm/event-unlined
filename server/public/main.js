const { useEffect, useMemo, useState } = React;

function App() {
  const [loading, setLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState(null);
  const [error, setError] = useState(null);

  const now = useMemo(() => new Date().toLocaleString("fr-FR"), []);

  async function loadHello() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/hello");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setApiMessage(data.message);
    } catch (e) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHello();
  }, []);

  return React.createElement(
    "div",
    { className: "card" },
    React.createElement("h1", { className: "title" }, "Basic React + Express"),
    React.createElement(
      "p",
      { className: "muted" },
      "La page est servie par Express. React tourne côté navigateur (sans build). "
    ),
    React.createElement(
      "div",
      { className: "row" },
      React.createElement(
        "button",
        { onClick: loadHello, disabled: loading },
        loading ? "Chargement…" : "Recharger /api/hello"
      ),
      React.createElement(
        "span",
        null,
        "Heure de chargement: ",
        React.createElement("code", null, now)
      )
    ),
    React.createElement(
      "div",
      { className: "box" },
      error
        ? React.createElement(
            "div",
            null,
            React.createElement("strong", null, "Erreur: "),
            React.createElement("code", null, error)
          )
        : apiMessage
          ? React.createElement(
              "div",
              null,
              React.createElement("strong", null, "Réponse API: "),
              React.createElement("code", null, apiMessage)
            )
          : React.createElement("div", null, "(Pas de message pour l’instant)")
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(App)
);
