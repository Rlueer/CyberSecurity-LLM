// src/types/index.ts

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

// GÜNCELLENDİ: Mesaj tipini daha esnek hale getiriyoruz.
export interface Message {
  id: string; // Her mesaja benzersiz bir ID verelim (React key'leri için)
  sender: 'AI' | 'User';
  text: string;
  type: 'question' | 'user_response' | 'task_confirmation' | 'error'; // Mesaj türü
  question?: Question;
  ai_comment?: string; // Soruya ait AI yorumunu burada tutacağız
  ai_task?: string;    // Kullanıcıya verilen görevi burada tutacağız
}

export interface DomainStatus {
  name: string;
  status: 'Complete' | 'In Progress' | 'Pending';
  score: number;
}