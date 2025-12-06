"use client";

type Props = {
  calendarEventId?: string;
  htmlLink?: string;
};

export function AddToGoogleCalendar({ calendarEventId, htmlLink }: Props) {
  const handleAdd = () => {
    if (calendarEventId) {
      window.open(
        `https://calendar.google.com/calendar/u/0/r/eventedit/${calendarEventId}`,
        "_blank"
      );
    } else if (htmlLink) {
      window.open(htmlLink, "_blank");
    }
  };

  if (!calendarEventId && !htmlLink) {
    return null;
  }

  return (
    <button
      onClick={handleAdd}
      style={{
        display: "block",
        padding: "12px 16px",
        backgroundColor: "#4285f4",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "16px",
        width: "100%",
        fontWeight: 600,
        textAlign: "center",
        textDecoration: "none",
        transition: "background-color 0.2s",
        boxShadow: "0 2px 8px rgba(66, 133, 244, 0.3)",
        marginTop: "12px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#357ae8";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#4285f4";
      }}
    >
      📅 加到 Google 日曆
    </button>
  );
}







