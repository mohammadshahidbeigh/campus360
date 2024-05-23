import React, { useEffect } from "react";
import { ConversationEntry } from "../types";

interface ChatbotConversationProps {
  conversation: ConversationEntry[];
}

const ChatbotConversation: React.FC<ChatbotConversationProps> = ({
  conversation,
}) => {
  useEffect(() => {
    const chatContainer = document.getElementById("chatbot-conversation");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [conversation]);

  return (
    <div
      className="chatbot-conversation bg-gray-100 p-2 rounded-lg overflow-y-auto h-64"
      id="chatbot-conversation"
    >
      {conversation.map((entry, index) => (
        <div key={index} className={`speech speech-${entry.speaker} my-2`}>
          <div
            className={`text-sm ${
              entry.speaker === "ai"
                ? "bg-blue-100 text-blue-800"
                : "bg-green-100 text-green-800"
            } p-2 rounded-lg`}
          >
            {entry.text}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatbotConversation;
