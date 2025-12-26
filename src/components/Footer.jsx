import React from "react";

export default function Footer() {
  return (
    <footer
      className="mt-8"
      style={{
        backgroundColor: "var(--panel)",
        color: "var(--text)",
        borderTop: "1px solid var(--btn-ghost-border)",
        fontSize: "13px",
      }}
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 flex flex-col sm:flex-row gap-1 sm:gap-3 sm:items-center sm:justify-between">
        <span style={{ color: "var(--muted)" }}>
          © {new Date().getFullYear()} Zanes Pušķīši
        </span>
        <span className="flex items-center gap-2">
          <a
            href="/privatums"
            className="underline hover:opacity-80"
            style={{ color: "var(--text)" }}
            onClick={(e) => {
              e.preventDefault();
              try {
                window.location.assign("/privatums");
              } catch {
                window.location.href = "/privatums";
              }
            }}
          >
            Privātums
          </a>
          <span style={{ color: "var(--muted)" }}>|</span>
          <a
            href="https://github.com/Supred502"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
            style={{ color: "var(--text)" }}
          >
            Mājaslapu izveidoja Edijs Rihards Zvirgzds
          </a>
        </span>
      </div>
    </footer>
  );
}
