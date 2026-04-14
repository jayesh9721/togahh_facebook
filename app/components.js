"use client";

// ============================================================
// SHARED UI COMPONENTS — HEALTHCARE EDITION
// ============================================================

export function Badge({ text, color, bg }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 12px",
        borderRadius: "var(--radius-pill)",
        background: bg,
        color,
        display: "inline-block",
        whiteSpace: "nowrap",
        letterSpacing: "0.02em",
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
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--card-padding, 16px)",
        boxShadow: "var(--shadow-sm)",
        transition: "box-shadow 0.25s ease, border-color 0.2s ease, transform 0.2s ease",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.borderColor = "var(--primary-light)";
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
        padding: "var(--card-padding, 20px)",
        position: "relative",
        transition: "transform 0.2s, box-shadow 0.2s",
        border: `1px solid ${color}15`,
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
            top: 12,
            right: 12,
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
          fontWeight: 700,
          color,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 10,
          opacity: 0.8,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "var(--metric-value-size, 28px)", fontWeight: 700, color, marginBottom: 4, lineHeight: 1, letterSpacing: "-0.02em" }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color, opacity: 0.6 }}>{sub}</div>
    </div>
  );
}

export function SectionTitle({ children, style = {} }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 800,
        color: "var(--text)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: 16,
        ...style
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
        gap: 16,
        marginBottom: 16,
        transition: "opacity 0.2s",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "var(--radius-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: done
            ? "var(--green-light)"
            : active
              ? "var(--primary-light)"
              : "var(--surface)",
          border: `1.5px solid ${done ? "var(--green)" : active ? "var(--primary)" : "var(--border)"
            }`,
          fontSize: 12,
          fontWeight: 800,
          color: done
            ? "var(--green)"
            : active
              ? "var(--primary)"
              : "var(--text-dim)",
          transition: "all 0.3s ease",
        }}
      >
        {done ? "✓" : step}
      </div>
      <div style={{ paddingTop: 4 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: active || done ? 700 : 500,
            color: active || done ? "var(--text)" : "var(--text-dim)",
            transition: "color 0.2s",
          }}
        >
          {label}
        </div>
        {sub && (
          <div
            style={{
              fontSize: 12,
              color: "var(--text-dim)",
              marginTop: 4,
              lineHeight: 1.5,
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
    <div className="animate-fade-in" style={{ textAlign: "center", padding: "60px 20px" }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "var(--radius-lg)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          margin: "0 auto 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          opacity: 0.6
        }}
      >
        📑
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "var(--text)",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 14,
          color: "var(--text-muted)",
          lineHeight: 1.6,
          maxWidth: 320,
          margin: "0 auto",
        }}
      >
        {sub}
      </div>
    </div>
  );
}

export function Spinner({ size = 16, color = "var(--primary)" }) {
  return (
    <div
      className="animate-spin"
      style={{
        width: size,
        height: size,
        border: `2.5px solid ${color}20`,
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
        background: disabled ? "var(--border)" : "var(--primary)",
        color: "#fff",
        border: "none",
        borderRadius: "var(--radius-md)",
        padding: "14px 20px",
        fontSize: 14,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        transition: "all 0.2s ease",
        letterSpacing: "0.02em",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "var(--primary-dark)";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 8px 20px -4px rgba(2,132,199,0.3)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "var(--primary)";
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
        background: "#ffffff",
        border: "1.5px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "12px 18px",
        fontSize: 13,
        fontWeight: 600,
        color: "var(--text-muted)",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.15s ease",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--primary)";
        e.currentTarget.style.color = "var(--primary)";
        e.currentTarget.style.background = "var(--primary-light)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.color = "var(--text-muted)";
        e.currentTarget.style.background = "#ffffff";
      }}
    >
      {children}
    </button>
  );
}

