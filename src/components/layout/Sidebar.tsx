import React from "react";
import styles from "./Sidebar.module.css";

// Placeholder data to simulate chat history
const chatHistory = [
  { id: 1, title: "Welcome Chat" },
  { id: 2, title: "SQL Performance Analysis" },
  { id: 3, title: "Monthly User Report from Q2" },
  { id: 4, title: "Customer Churn Prediction" },
];

export const Sidebar = () => {
  return (
    <aside className={styles.sidebar}>
      {/* Top section: New Chat button */}
      <div className={styles.top}>
        <button className={styles.newChatBtn}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={styles.icon}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Middle section: Chat history list */}
      <nav className={styles.nav}>
        <ul className={styles.list}>
          {chatHistory.map((chat) => (
            <li key={chat.id}>
              <a href="#" className={styles.chatLink}>
                {chat.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom section: User profile */}
      <div className={styles.footer}>
        <div className={styles.profileRow} role="button" tabIndex={0}>
          <div className={styles.avatar} />
          <span className={styles.username}>Raif</span>
        </div>
      </div>
    </aside>
  );
};
