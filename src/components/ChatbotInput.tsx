import React, { useState } from "react";

const ChatbotInput: React.FC = () => {
  const [input, setInput] = useState<string>("");

  const handleSubmit = () => {
    // Add your input handling logic here
    setInput("");
  };

  return (
    <div className="chatbot-input-container text-sm relative flex items-center mt-6 bg-gray-100 p-2 rounded-lg">
      <input
        name="user-input"
        type="text"
        placeholder="Send your message"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="flex-1 p-2 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
      <div className="absolute right-0 flex space-x-1 pr-2">
        <button
          id="microphone-btn"
          className="p-2 w-10 h-10 flex items-center justify-center rounded-lg"
        >
          <img
            src="src\assets\images\microphone.png"
            className="microphone-icon w-5 h-5 "
            alt="Microphone"
          />
        </button>
        <button
          id="submit-btn"
          className="text-white p-2 w-10 h-10 flex items-center justify-center rounded-lg"
          onClick={handleSubmit}
        >
          <img
            src="src\assets\images\send-btn-icon.png"
            className="send-btn-icon w-5 h-5"
            alt="Send"
          />
        </button>
      </div>
    </div>
  );
};

export default ChatbotInput;
