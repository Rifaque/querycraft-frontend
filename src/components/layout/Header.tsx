import React from 'react';

export const Header = () => {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-700 px-6">
      {/* Left side: App Title & Model Selector */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">
          Query<span className="text-electric-blue">Craft</span>
        </h1>
        <div className="hidden sm:flex items-center gap-2 cursor-pointer rounded-lg bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-700">
          <span>Merlin AI</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Right side: Action Icons */}
      <div className="flex items-center gap-4">
        {/* Placeholder icons */}
        <div className="h-8 w-8 rounded-full bg-gray-700"></div>
        <div className="h-8 w-8 rounded-full bg-electric-blue"></div>
      </div>
    </header>
  );
};
