// Bu dosyayı oluşturun ve aşağıdaki içeriği yapıştırın.

import { ReactNode } from "react";

export interface Question {
  id: number;
  domain_name: string;
  related_nist_category: string;
  nist_function: string;
  iso27001_controls: string[];
  maturity_level: number;
  criticality: 'high' | 'medium' | 'low';
  question_text: string;
  question_type: string;
  hint: string;
  tags: string[];
}

// Message interface'ini güncelleyin
export interface Message {
  id: string;
  sender: 'AI' | 'User';
  text: string; // For AI messages, this remains the primary text.
  type: 'question' | 'user_response' | 'feedback' | 'error';
  question?: Question;

  timestamp: number; 
  
  // Fields for 'user_response' type
  answeredQuestionId?: number;
  attempts?: AnswerAttempt[]; // An array of all attempts for this question
  activeAttemptIndex?: number; // Which attempt is currently visible

  // Fields for 'feedback' type (these are now derived from the active attempt)
  ai_comment?: string;
  ai_task?: string;
}
export interface DomainStatus {
  name: string;
  status: 'Complete' | 'In Progress' | 'Pending';
  score: number;
  // widen proficiency to include your in-flight states:
  proficiency: 'Mature' 
             | 'Developing' 
             | 'Foundational' 
             | 'In Progress' 
             | 'Pending';
  answeredInDomain: number;
  // allow a numeric duration in minutes or null if not yet available
  timeTaken: number | null;
}

export interface AnswerAttempt {
  text: string;
  score: number;
  ai_comment: string;
  ai_task: string;
  db_answer_id: number;
  next_question_id: number | null;
}

interface Fork {
  id: string;
  parentMessageId: string | null; // Hangi mesajdan dallandı
  messages: Message[]; // Bu daldaki tüm mesajlar
  isActive: boolean; // Şu anda görüntülenen dal mı
}