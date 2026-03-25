"use client";

// ============================================================
// SHARED UI COMPONENTS
// ============================================================

export function Badge({ text, color, bg }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        padding: "2px 10px",
        borderRadius: "var(--radius-pill)",
        background: bg,
        color,
        display: "inline-block",
        whiteSpace: "nowrap",
        letterSpacing: "0.01em",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
    >
      {text}
    </span>
  );
}

export function Card({ children, style = {}, className = "" }) {
  return (
    <div
      className={`animate-slide-up ${className}`}
      style={{
        background: "var(--card-bg)",
        border: "0.5px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: 20,
        boxShadow: "var(--shadow-sm)",
        transition: "box-shadow 0.2s, border-color 0.2s",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.borderColor = "#ddd";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      {children}
    </div>
  );
}

export function MetricCard({ label, value, sub, color, bg, dot }) {
  return (
    <div
      className="animate-scale-in"
      style={{
        background: bg,
        borderRadius: "var(--radius-lg)",
        padding: "18px 16px",
        position: "relative",
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {dot && (
        <div
          className="animate-pulse"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 8,
            height: 8,
            borderRadius: "var(--radius-full)",
            background: color,
          }}
        />
      )}
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 8,
          opacity: 0.85,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 600, color, marginBottom: 4, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color, opacity: 0.65 }}>{sub}</div>
    </div>
  );
}

export function SectionTitle({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

export function WorkflowStep({ step, label, sub, active, done }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 14,
        transition: "opacity 0.2s",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "var(--radius-full)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: done
            ? "var(--green-light)"
            : active
            ? "var(--purple-light)"
            : "var(--surface)",
          border: `2px solid ${
            done ? "var(--green)" : active ? "var(--purple)" : "#ddd"
          }`,
          fontSize: 11,
          fontWeight: 600,
          color: done
            ? "var(--green)"
            : active
            ? "var(--purple)"
            : "var(--text-dim)",
          transition: "all 0.3s ease",
        }}
      >
        {done ? "✓" : step}
      </div>
      <div style={{ paddingTop: 2 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: active || done ? 500 : 400,
            color: active || done ? "var(--text)" : "var(--text-dim)",
            transition: "color 0.2s",
          }}
        >
          {label}
        </div>
        {sub && (
          <div
            style={{
              fontSize: 11,
              color: "var(--text-dim)",
              marginTop: 2,
              lineHeight: 1.4,
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ title, sub }) {
  return (
    <div className="animate-fade-in" style={{ textAlign: "center", padding: "40px 20px" }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "var(--radius-full)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          margin: "0 auto 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 18,
            height: 2,
            background: "#ccc",
            borderRadius: 2,
          }}
        />
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "var(--text)",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          lineHeight: 1.6,
          maxWidth: 280,
          margin: "0 auto",
        }}
      >
        {sub}
      </div>
    </div>
  );
}

export function Spinner({ size = 16, color = "var(--purple)" }) {
  return (
    <div
      className="animate-spin"
      style={{
        width: size,
        height: size,
        border: `2px solid ${color}33`,
        borderTopColor: color,
        borderRadius: "var(--radius-full)",
        display: "inline-block",
      }}
    />
  );
}

export function PrimaryButton({ children, onClick, disabled, style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        background: disabled ? "#b8b3de" : "var(--purple)",
        color: "#fff",
        border: "none",
        borderRadius: "var(--radius-md)",
        padding: "12px 16px",
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        transition: "background 0.2s, transform 0.15s, box-shadow 0.15s",
        letterSpacing: "0.01em",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "#4840A5";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(83,74,183,0.3)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "var(--purple)";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, style = {} }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        background: "var(--surface)",
        border: "0.5px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "10px 14px",
        fontSize: 12,
        color: "var(--text-muted)",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "background 0.15s, border-color 0.15s",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--surface-hover)";
        e.currentTarget.style.borderColor = "#ccc";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--surface)";
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      {children}
    </button>
  );
}
