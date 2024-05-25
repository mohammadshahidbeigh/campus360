import React, { useState, useEffect } from "react";
import { ConversationEntry } from "../types";

interface ChatbotConversationProps {
  conversation: ConversationEntry[];
  handleSuggestivePromptClick: (prompt: string) => void;
  isLoading: boolean; // Add loading state as a prop
}

const ChatbotConversation: React.FC<ChatbotConversationProps> = ({
  conversation,
  handleSuggestivePromptClick,
  isLoading, // Use loading state
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

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      console.error("Invalid timestamp:", timestamp); // Log invalid timestamp
      return "Invalid Date";
    }
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else {
      const options: Intl.DateTimeFormatOptions = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      };
      return new Intl.DateTimeFormat("en-GB", options).format(date);
    }
  };

  const isFirstMessageOfDay = (
    currentMessage: ConversationEntry,
    index: number
  ): boolean => {
    if (!currentMessage.timestamp) return false;
    if (index === 0) return true;
    const currentDate = new Date(currentMessage.timestamp).toDateString();
    const previousDate = new Date(
      conversation[index - 1].timestamp!
    ).toDateString();
    return currentDate !== previousDate;
  };

  return (
    <div
      className="chatbot-conversation rounded-lg overflow-y-auto h-80"
      id="chatbot-conversation"
    >
      {conversation.map((entry, index) => (
        <React.Fragment key={index}>
          {isFirstMessageOfDay(entry, index) && entry.timestamp && (
            <div className="date-separator text-center my-2 text-gray-500">
              {formatDate(entry.timestamp)}
            </div>
          )}
          <div className={`speech speech-${entry.speaker} my-2`}>
            <div
              className={`text-sm speech-bubble ${
                entry.speaker === "ai" ? "speech-ai" : "speech-human"
              } p-2 rounded-lg`}
            >
              <div dangerouslySetInnerHTML={{ __html: entry.text }} />
            </div>
            {entry.timestamp && (
              <div
                className={`timestamp ${
                  entry.speaker === "ai" ? "speech-ai" : "speech-human"
                }`}
              >
                {new Date(entry.timestamp).toLocaleTimeString()}
              </div>
            )}
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
        </React.Fragment>
      ))}
      {isLoading && ( // Conditionally render loading indicator
        <div className="speech speech-ai my-2">
          <div className="text-sm p-2 rounded-lg blinking-cursor"></div>
        </div>
      )}
    </div>
  );
};

export default ChatbotConversation;
