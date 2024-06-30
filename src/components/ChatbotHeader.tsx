import React from "react";
import mietLogo from "../assets/images/miet-logo.png"; // Adjust the path according to your project structure

interface ChatbotHeaderProps {
  clearConversation: () => void;
}

const ChatbotHeader: React.FC<ChatbotHeaderProps> = ({ clearConversation }) => {
  return (
    <div className="chatbot-header text-center">
      <img src={mietLogo} className="logo mx-auto" alt="MIET Logo" />
      <h1 className="text-lg font-bold text-white">CAMPUS 360</h1>
      <h2 className="text-xs text-white">
        A virtual assistant from MIET, Jammu.
      </h2>
      <button
        className="clear-btn bg-white text-blue-500 text-xs px-2 py-1 rounded mt-2"
        id="clear-btn"
        onClick={clearConversation}
      >
        Start Over
      </button>
    </div>
  );
};

export default ChatbotHeader;
