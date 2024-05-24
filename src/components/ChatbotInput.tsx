import React, { useState, useEffect, useCallback } from "react";
import { ConversationEntry } from "../types";
import { database } from "../firebase";
import { ref, push } from "firebase/database";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { retriever } from "../utils/retriever";
import { combineDocuments } from "../utils/combineDocuments";
import { formatConvHistory } from "../utils/formatConvHistory";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";

interface ChatbotInputProps {
  addMessage: (message: ConversationEntry) => void;
  conversation: ConversationEntry[];
}

const ChatbotInput: React.FC<ChatbotInputProps> = ({
  addMessage,
  conversation,
}) => {
  const [input, setInput] = useState<string>("");

  const openAIApiKey = "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";
  const llm = new ChatOpenAI({ openAIApiKey });

  const standaloneQuestionTemplate = `Given some conversation history (if any) and a question, convert the question to a standalone question. 
conversation history: {conv_history}
question: {question} 
standalone question:`;
  const standaloneQuestionPrompt = PromptTemplate.fromTemplate(
    standaloneQuestionTemplate
  );

  const answerTemplate = `You are a supportive and dynamic conversational bot, designed to address any inquiries about MIET Jammu with the utmost precision. Your role involves analyzing the context and conversation history to provide the most accurate response. If the information needed to address the query isn't given in the context or conversation history, it's crucial to admit, "Sorry, I wasn't able to find any information about your question." At this point, kindly guide the user to reach out to info@mietjammu.in for further assistance. No hallucination, remember the focus on MIET Jammu. Always keep your tone friendly, approachable, and informative.
context: {context}
conversation history: {conv_history}
question: {question}
answer: `;
  const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);

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

  const generateSuggestivePrompts = useCallback(
    async (userInput: string): Promise<string[]> => {
      const suggestivePromptsTemplate = `Based on the user input "{user_input}", generate suggestive few word prompts from the stored questions in the database that are similar to "{user_input}".`;
      const suggestivePromptTemplate = PromptTemplate.fromTemplate(
        suggestivePromptsTemplate
      );

      try {
        const templateResult = await suggestivePromptTemplate.invoke({
          user_input: userInput,
        });

        const promptString = templateResult.value;

        const retrievedDocuments = await retriever.getRelevantDocuments(
          promptString
        );

        const combinedDocuments = combineDocuments(retrievedDocuments);

        return extractPrompts(combinedDocuments, userInput, 3);
      } catch (error) {
        console.error("Error in generateSuggestivePrompts:", error);
        return [];
      }
    },
    []
  );

  const progressConversation = useCallback(
    async (question: string): Promise<string | null> => {
      try {
        const conv_history = formatConvHistory(
          conversation.map((entry) => entry.text)
        );
        const response = await chain.invoke({
          question: question,
          conv_history: conv_history,
        });

        const prompts = await generateSuggestivePrompts(question);

        const newEntry: ConversationEntry = {
          speaker: "ai",
          text: response,
          prompts: prompts.map((prompt) => ({ text: prompt, clicked: false })),
        };

        addMessage(newEntry);

        push(ref(database, "conversations"), {
          question: question,
          response: response,
        });

        return null;
      } catch (error) {
        console.error("Error fetching OpenAI response:", error);
        return "Sorry, I couldn't get a response. Please try again.";
      }
    },
    [conversation, addMessage, chain, generateSuggestivePrompts]
  );

  const handleSubmit = useCallback(async () => {
    if (input.trim() === "") return;

    const userMessage: ConversationEntry = {
      speaker: "human",
      text: input,
    };
    addMessage(userMessage);
    setInput("");

    const response = await progressConversation(input);

    if (response) {
      const aiMessage: ConversationEntry = {
        speaker: "ai",
        text: response,
      };
      addMessage(aiMessage);
    }
  }, [input, addMessage, progressConversation]);

  const extractPrompts = (
    combinedText: string,
    userInput: string,
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSubmit();
      }
    };

    const inputField = document.getElementById("user-input");
    if (inputField) {
      inputField.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      if (inputField) {
        inputField.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [handleSubmit]);

  return (
    <div className="chatbot-input-container text-sm relative flex items-center mt-8 bg-gray-100 p-2 rounded-lg">
      <input
        id="user-input"
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
            src="src/assets/images/microphone.png"
            className="microphone-icon w-5 h-5"
            alt="Microphone"
          />
        </button>
        <button
          id="submit-btn"
          className="p-2 w-10 h-10 flex items-center justify-center rounded-lg"
          onClick={handleSubmit}
        >
          <img
            src="src/assets/images/send-btn-icon.png"
            className="send-btn-icon w-5 h-5"
            alt="Send"
          />
        </button>
      </div>
    </div>
  );
};

export default ChatbotInput;
