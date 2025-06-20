// Bu dosyayı oluşturun ve aşağıdaki içeriği yapıştırın.

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
}

export interface AnswerAttempt {
  text: string;
  score: number;
  ai_comment: string;
  ai_task: string;
  db_answer_id: number;
  next_question_id: number | null;
}