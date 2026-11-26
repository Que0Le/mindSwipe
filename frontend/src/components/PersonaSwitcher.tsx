import { useState } from "react";
import { PERSONAS, type Persona, currentPersonaKey } from "../auth";

interface Props {
  onSwitch: (p: Persona) => void;
}

// Demo affordance: jump between the seeded personas to show the same code behave
// as Public visitor / Student / Teacher. Switching reloads the app.
export default function PersonaSwitcher({ onSwitch }: Props) {
  const [open, setOpen] = useState(false);
  const activeKey = currentPersonaKey();
  const active = PERSONAS.find((p) => p.key === activeKey) ?? PERSONAS[0];

  return (
    <div className="persona">
      <button
        className="persona-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="persona-dot" data-role={active.key} />
        <span className="persona-name">{active.label}</span>
        <span className="persona-caret">▾</span>
      </button>
      {open && (
        <>
          <div className="menu-scrim" onClick={() => setOpen(false)} />
          <div className="persona-pop" role="menu">
            <p className="persona-pop-head">View as</p>
            {PERSONAS.map((p) => (
              <button
                key={p.key}
                role="menuitem"
                className={`persona-item ${p.key === activeKey ? "on" : ""}`}
                onClick={() => {
                  setOpen(false);
                  if (p.key !== activeKey) onSwitch(p);
                }}
              >
                <span className="persona-dot" data-role={p.key} />
                <span className="persona-item-text">
                  <strong>{p.label}</strong>
                  <small>{p.sublabel}</small>
                </span>
                {p.key === activeKey && <span className="persona-check">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
