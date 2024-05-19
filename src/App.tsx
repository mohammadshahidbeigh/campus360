import React, { useState } from "react";
import ChatbotHeader from "./components/ChatbotHeader";
import ChatbotConversation from "./components/ChatbotConversation";
import ChatbotInput from "./components/ChatbotInput";

const App: React.FC = () => {
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);

  const toggleChatbotVisibility = () => {
    setIsChatbotVisible(!isChatbotVisible);
  };

  return (
    <div className="App">
      <button
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-full shadow-lg z-50"
        onClick={toggleChatbotVisibility}
      >
        {isChatbotVisible ? "Close Chat" : "Open Chat"}
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
