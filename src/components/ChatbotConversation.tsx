import React, { useEffect, useState } from "react";
import { ConversationEntry } from "../types";

interface ChatbotConversationProps {
  conversation: ConversationEntry[];
  handleSuggestivePromptClick: (prompt: string) => void;
}

const ChatbotConversation: React.FC<ChatbotConversationProps> = ({
  conversation,
  handleSuggestivePromptClick,
}) => {
  const [clickedPrompts, setClickedPrompts] = useState<string[]>([]);

  useEffect(() => {
    const chatContainer = document.getElementById("chatbot-conversation");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [conversation]);

  const handleClick = (prompt: string) => {
    setClickedPrompts((prev) => [...prev, prompt]);
    handleSuggestivePromptClick(prompt);
  };

  return (
    <div
      className="chatbot-conversation p-2 rounded-lg overflow-y-auto h-64"
      id="chatbot-conversation"
    >
      {conversation.map((entry, index) => (
        <div key={index} className={`speech speech-${entry.speaker} my-2`}>
          <div
            className={`text-sm speech-bubble ${
              entry.speaker === "ai" ? "speech-ai" : "speech-human"
            } p-2 rounded-lg`}
          >
            {entry.text}
          </div>
          {entry.prompts && entry.prompts.length > 0 && (
            <div className="chatbot-prompts-container">
              {entry.prompts.map((prompt, promptIndex) => (
                <button
                  key={promptIndex}
                  className={`suggestive-prompt-button ${
                    clickedPrompts.includes(prompt.text) ? "clicked" : ""
                  }`}
                  onClick={() => handleClick(prompt.text)}
                >
                  {prompt.text}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ChatbotConversation;
