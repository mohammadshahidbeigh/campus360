import React, { useState, useEffect, useCallback } from "react";
import ChatbotHeader from "./components/ChatbotHeader";
import ChatbotConversation from "./components/ChatbotConversation";
import ChatbotInput from "./components/ChatbotInput";
import { ConversationEntry } from "./types";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { retriever } from "./utils/retriever";
import { combineDocuments } from "./utils/combineDocuments";
import { formatConvHistory } from "./utils/formatConvHistory";
import { ref, push } from "firebase/database";
import { database } from "./firebase";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import "./index.css"; // Make sure to import your CSS file
import messageIcon from "./assets/images/message-icon.png";

const App: React.FC = () => {
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
  const [conversation, setConversation] = useState<ConversationEntry[]>([
    {
      speaker: "ai",
      text: "Hey there! Welcome to MIET virtual assistant. How can I assist you today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedEntries = localStorage.getItem("conversationEntries");
    if (storedEntries) {
      setConversation(JSON.parse(storedEntries));
    }
  }, []);

  const toggleChatbotVisibility = () => {
    setIsChatbotVisible(!isChatbotVisible);
  };

  const addMessage = useCallback((message: ConversationEntry) => {
    setConversation((prevConversation) => {
      const newConversation = [
        ...prevConversation,
        { ...message, timestamp: new Date().toISOString() },
      ];
      localStorage.setItem(
        "conversationEntries",
        JSON.stringify(newConversation)
      );
      return newConversation;
    });
  }, []);

  const clearConversation = () => {
    setConversation([
      {
        speaker: "ai",
        text: "Hey there! Welcome to MIET virtual assistant. How can I assist you today?",
        timestamp: new Date().toISOString(),
      },
    ]);
    localStorage.removeItem("conversationEntries");
  };

  const handleSuggestivePromptClick = async (prompt: string) => {
    const userMessage: ConversationEntry = {
      speaker: "human",
      text: prompt,
      timestamp: new Date().toISOString(), // Add timestamp here
    };
    addMessage(userMessage);
    setIsLoading(true);

    // Trigger the conversation progression
    await progressConversation(prompt);

    // Generate and add new suggestive prompts after processing the clicked prompt
    const newPrompts = await generateSuggestivePrompts(prompt);
    setConversation((prevConversation) => {
      const lastMessageIndex = prevConversation.length - 1;
      const lastMessage = prevConversation[lastMessageIndex];
      if (lastMessage && lastMessage.speaker === "ai") {
        lastMessage.prompts = newPrompts.map((newPrompt) => ({
          text: newPrompt,
          clicked: false,
        }));
      }
      return [...prevConversation];
    });
    setIsLoading(false);
  };

  const progressConversation = useCallback(
    async (input: string) => {
      const standaloneQuestionTemplate = `Given some conversation history (if any) and a question, convert the question to a standalone question. 
    conversation history: {conv_history}
    question: {question} 
    standalone question:`;
      const standaloneQuestionPrompt = PromptTemplate.fromTemplate(
        standaloneQuestionTemplate
      );

      const answerTemplate = `You are a supportive and dynamic conversational bot, designed to address any inquiries about MIET Jammu with the utmost precision. Your role involves analyzing the context and conversation history to provide the most accurate response. If the information needed to address the query isn't given in the context or conversation history, it's crucial to admit, "Sorry, I wasn't able to find any information about your question." At this point, kindly guide the user to reach out to info@mietjammu.in for further assistance. No hallucination, remember the focus on MIET Jammu. If the user asks a question in any language, answer in the same language and tone. Always keep your tone friendly, approachable, and informative.
      context: {context}
      conversation history: {conv_history}
      question: {question}
      answer: `;
      const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);

      const openAIApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      const llm = new ChatOpenAI({ openAIApiKey });

      const standaloneQuestionChain = standaloneQuestionPrompt
        .pipe(llm)
        .pipe(new StringOutputParser());
      const retrieverChain = RunnableSequence.from([
        (prevResult: { standalone_question: string }) =>
          prevResult.standalone_question,
        retriever,
        combineDocuments,
      ]);
      const answerChain = answerPrompt.pipe(llm).pipe(new StringOutputParser());

      const chain = RunnableSequence.from([
        {
          standalone_question: standaloneQuestionChain,
          original_input: new RunnablePassthrough(),
        },
        {
          context: retrieverChain,
          question: ({
            original_input,
          }: {
            original_input: { question: string };
          }) => original_input.question,
          conv_history: ({
            original_input,
          }: {
            original_input: { conv_history: string };
          }) => original_input.conv_history,
        },
        answerChain,
      ]);

      try {
        const conv_history = formatConvHistory(
          conversation.map((entry) => entry.text)
        );
        const response = await chain.invoke({
          question: input,
          conv_history: conv_history,
        });

        const aiMessage: ConversationEntry = {
          speaker: "ai",
          text: response,
          prompts: [], // Initialize with an empty array for prompts
        };
        addMessage(aiMessage);

        // Push conversation to Firebase
        push(ref(database, "conversations"), {
          question: input,
          response: response,
        });
      } catch (error) {
        console.error("Error fetching OpenAI response:", error);
      }
    },
    [conversation, addMessage]
  );

  const generateSuggestivePrompts = async (
    userInput: string
  ): Promise<string[]> => {
    // Handling casual greetings
    const greetings = ["hey", "hello", "hi", "hii"];
    if (greetings.includes(userInput.toLowerCase())) {
      return [
        "When was MIET established?",
        "Tell me about MIET's history.",
        "What courses are available at MIET?",
        "How can I apply to MIET?",
      ];
    }

    // Handling admission-related queries
    const admissionKeywords = [
      "admission",
      "admissions",
      "apply",
      "application",
    ];
    if (
      admissionKeywords.some((keyword) =>
        userInput.toLowerCase().includes(keyword)
      )
    ) {
      // Add notification message to the conversation
      addMessage({
        speaker: "ai",
        text: '<a href="https://admissions.mietjmu.in" target="_blank" rel="noopener noreferrer"> Click here to APPLY NOW </a>',
        timestamp: new Date().toISOString(), // Add timestamp here
      });
      return [];
    }

    try {
      // Split input into keywords and phrases to enhance search relevance
      const keywords = userInput.split(/\s+/).filter((word) => word.length > 2);

      // Use keywords to retrieve documents
      const retrievedDocuments = await retriever.invoke(keywords.join(" "));

      const combinedDocuments = combineDocuments(retrievedDocuments);

      return extractPrompts(combinedDocuments, userInput, 3);
    } catch (error) {
      console.error("Error in generateSuggestivePrompts:", error);
      return [];
    }
  };

  const extractPrompts = (
    combinedText: string,
    _userInput: string,
    limit: number
  ): string[] => {
    const questionRegex =
      /(?:What|How|Where|When|Why|Which|Can|Do|Is|Are|Should)[^.?!]*\?/g;
    const matches =
      (combinedText.match(questionRegex) as RegExpMatchArray) || [];

    const uniqueMatches = [...new Set(matches)].map((question) => {
      if (!question.trim().endsWith("?")) {
        question += "?";
      }
      return question.trim();
    });

    uniqueMatches.sort((a, b) => a.length - b.length);

    return uniqueMatches.slice(0, limit);
  };

  return (
    <div
      className="App bg-cover bg-center min-h-screen"
      style={{ backgroundImage: "url(('./assets/images/miet-bg.png')" }}
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
          <img
            src={messageIcon}
            alt="Chat with KnowItHere"
            className="h-10 w-10"
          />
        )}
      </button>

      {isChatbotVisible && (
        <>
          <div className="fixed bottom-20 right-4 w-80 h-[36rem] bg-white rounded-lg shadow-lg transition-transform transform-gpu z-50">
            <ChatbotHeader clearConversation={clearConversation} />
          </div>
          <div className="fixed bottom-20 right-4 w-80 bg-white p-4 rounded-lg shadow-lg transition-transform transform-gpu z-50">
            <main>
              <section className="chatbot-container">
                <ChatbotConversation
                  conversation={conversation}
                  handleSuggestivePromptClick={handleSuggestivePromptClick}
                  isLoading={isLoading} // Pass loading state
                />
                <ChatbotInput
                  addMessage={addMessage}
                  conversation={conversation}
                  generateSuggestivePrompts={generateSuggestivePrompts}
                  setIsLoading={setIsLoading} // Pass setLoading function
                  isLoading={isLoading} // Pass loading state
                />
              </section>
            </main>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
