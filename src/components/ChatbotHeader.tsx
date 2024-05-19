import React from "react";
import mietLogo from "../assets/images/miet-logo.png"; // Adjust the path according to your project structure

const ChatbotHeader: React.FC = () => {
  return (
    <div className="chatbot-header text-center mb-4">
      <img src={mietLogo} className="logo mx-auto mb-2" alt="MIET Logo" />
      <h1 className="text-2xl font-bold">MIETBOT</h1>
      <h2 className="text-sm text-gray-600">
        A virtual assistant from MIET, Jammu.
      </h2>
      <button
        className="clear-btn bg-blue-500 text-white px-2 py-1 rounded mt-2 "
        id="clear-btn"
      >
        Start Over
      </button>
    </div>
  );
};

export default ChatbotHeader;
