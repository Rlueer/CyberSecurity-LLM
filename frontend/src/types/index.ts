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

export interface Message {
  id: string;
  sender: 'AI' | 'User';
  text: string;
  type: 'question' | 'user_response' | 'feedback' | 'error';
  question?: Question;
  ai_comment?: string;
  ai_task?: string;
}

export interface DomainStatus {
  name: string;
  status: 'Complete' | 'In Progress' | 'Pending';
  score: number;
}