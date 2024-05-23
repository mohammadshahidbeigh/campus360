declare module "react-speech-recognition" {
  export interface SpeechRecognition {
    startListening: (options?: {
      continuous?: boolean;
      language?: string;
    }) => void;
    stopListening: () => void;
    abortListening: () => void;
    browserSupportsSpeechRecognition: boolean;
    listening: boolean;
    transcript: string;
    interimTranscript: string;
    finalTranscript: string;
    resetTranscript: () => void;
  }

  export const useSpeechRecognition: () => SpeechRecognition;
  export const SpeechRecognition: SpeechRecognition;
  export default SpeechRecognition;
}
