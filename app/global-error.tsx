"use client";

// Граница ошибок корневого layout (WR-05): заменяет весь документ, поэтому
// свои html и body, без зависимостей от провайдеров и шрифтов.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ru">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <main
          style={{
            maxWidth: 448,
            minHeight: "60vh",
            margin: "0 auto",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Что-то пошло не так</h1>
          <p style={{ color: "#5B6270", margin: 0 }}>
            Не удалось загрузить приложение. Проверьте соединение и повторите попытку.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              height: 44,
              padding: "0 20px",
              borderRadius: 9999,
              border: 0,
              background: "#C9F14C",
              color: "#0A0D12",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Повторить
          </button>
        </main>
      </body>
    </html>
  );
}
