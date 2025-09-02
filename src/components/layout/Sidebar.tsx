import React from 'react';

// Placeholder data to simulate chat history
const chatHistory = [
  { id: 1, title: 'Welcome Chat' },
  { id: 2, title: 'SQL Performance Analysis' },
  { id: 3, title: 'Monthly User Report from Q2' },
  { id: 4, title: 'Customer Churn Prediction' },
];

export const Sidebar = () => {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-700 bg-gray-800 md:flex">
      {/* Top section: New Chat button */}
      <div className="p-4">
        <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-600 py-2 font-semibold text-white transition-colors hover:bg-gray-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          New Chat
        </button>
      </div>

      {/* Middle section: Chat history list */}
      <nav className="flex-1 overflow-y-auto px-4">
        <ul className="space-y-1">
          {chatHistory.map((chat) => (
            <li key={chat.id}>
              <a
                href="#"
                className="block truncate rounded-md px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
              >
                {chat.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom section: User profile */}
      <div className="mt-auto border-t border-gray-700 p-4">
        <div className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-gray-700">
          <div className="h-8 w-8 rounded-full bg-electric-blue"></div>
          <span className="font-semibold text-white">Raif</span>
        </div>
      </div>
    </aside>
  );
};
