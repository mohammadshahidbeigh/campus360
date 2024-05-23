import React, { useState } from "react";
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

  // const llm = new ChatOpenAI({ apiKey: process.env.REACT_APP_OPENAI_API_KEY });

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

  const handleSubmit = async () => {
    if (input.trim() === "") return;

    const userMessage: ConversationEntry = {
      speaker: "human",
      text: input,
    };
    addMessage(userMessage);
    setInput("");

    const response = await progressConversation(input);
    const aiMessage: ConversationEntry = {
      speaker: "ai",
      text: response,
    };
    addMessage(aiMessage);
  };

  const progressConversation = async (question: string): Promise<string> => {
    try {
      const conv_history = formatConvHistory(
        conversation.map((entry) => entry.text)
      );
      const response = await chain.invoke({
        question: question,
        conv_history: conv_history,
      });

      console.log("Response from chain.invoke:", response);

      if (typeof response === "object" && "answer" in response) {
        const answer = (response as { answer: string }).answer;
        push(ref(database, "conversations"), {
          question: question,
          response: answer,
        });
        return answer;
      } else if (typeof response === "string") {
        // Handle case where response is a string
        push(ref(database, "conversations"), {
          question: question,
          response: response,
        });
        return response;
      } else {
        throw new Error("Invalid response format from the chain.");
      }
    } catch (error) {
      console.error("Error fetching OpenAI response:", error);
      return "Sorry, I couldn't get a response. Please try again.";
    }
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
            src="src/assets/images/microphone.png"
            className="microphone-icon w-5 h-5"
            alt="Microphone"
          />
        </button>
        <button
          id="submit-btn"
          className="bg-blue-500 text-white p-2 w-10 h-10 flex items-center justify-center rounded-lg"
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
