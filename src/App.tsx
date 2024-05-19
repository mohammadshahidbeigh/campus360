import React, { useState } from "react";
import ChatbotHeader from "./components/ChatbotHeader";
import ChatbotConversation from "./components/ChatbotConversation";
import ChatbotInput from "./components/ChatbotInput";
import "./index.css"; // Make sure to import your CSS file

const App: React.FC = () => {
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);

  const toggleChatbotVisibility = () => {
    setIsChatbotVisible(!isChatbotVisible);
  };

  return (
    <div
      className="App bg-cover bg-center min-h-screen"
      style={{ backgroundImage: "url('src/assets/images/miet-bg.png')" }}
    >
      <button
        className={`fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-full shadow-lg z-50 flex items-center justify-center transition-transform ${
          !isChatbotVisible ? "animate-bounce" : ""
        }`}
        onClick={toggleChatbotVisibility}
      >
        {isChatbotVisible ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 9.293l4.646-4.647a1 1 0 011.414 1.414L11.414 10l4.646 4.646a1 1 0 01-1.414 1.414L10 11.414l-4.646 4.646a1 1 0 01-1.414-1.414L8.586 10 3.94 5.354a1 1 0 011.414-1.414L10 8.586z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          "Chat With MietBot 🤖"
        )}
      </button>

      {isChatbotVisible && (
        <div className="fixed bottom-20 right-4 w-80 h-[32rem] bg-white p-4 rounded-lg shadow-lg transition-transform transform-gpu z-50">
          <main>
            <section className="chatbot-container">
              <ChatbotHeader />
              <ChatbotConversation />
              <ChatbotInput />
            </section>
          </main>
        </div>
      )}
    </div>
  );
};

export default App;
