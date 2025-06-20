import React, { useState, FormEvent } from 'react';

// 🆕 Question interface'i eklendi
interface Question {
  id: number;
  domain: string;
  question_text: string;
  maturity_level: number;
}

// 🆕 PromptFormProps interface'i güncellendi
interface PromptFormProps {
  onResponse?: (response: string) => void;
  question?: Question; // 🆕 Eklendi
  onNext?: (nextId: number | null) => void; // 🆕 Eklendi
}

const PromptForm: React.FC<PromptFormProps> = ({ onResponse, question, onNext }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResponse('');

    try {
      // 🆕 previous_question_id eklendi
      const requestBody = {
        prompt,
        previous_question_id: question?.id || null
      };

      const res = await fetch("http://localhost:3001/ask", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        throw new Error('Backend ile iletişim kurulamadı.');
      }

      const data = await res.json();
      setResponse(data.result);
      
      // 🆕 Üst component'e cevap iletiliyor
      onResponse?.(data.result);

      // 🆕 Eğer next_question_id varsa, sonraki soruya geç
      if (data.next_question_id && onNext) {
        onNext(data.next_question_id);
      }

    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 border-t-2 pt-6">
      {/* 🆕 Mevcut soru gösterimi */}
      {question && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-bold text-blue-800 mb-2">Current Question:</h3>
          <p className="text-gray-700">{question.question_text}</p>
          <p className="text-sm text-blue-600 mt-1">
            Domain: {question.domain} | Level: {question.maturity_level}
          </p>
        </div>
      )}

      <h2 className="text-2xl font-bold text-blue-600 mb-4">
        Your Answer
      </h2>
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full p-2 border rounded shadow-sm"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your answer here..."
          rows={4}
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading || !prompt.trim()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Evaluating...' : 'Submit Answer'}
        </button>
      </form>

      <div className="mt-4 p-4 bg-gray-50 rounded">
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        
        {response && (
          <div className="bg-white p-4 rounded shadow mt-2">
            <h3 className="font-semibold mb-2">Evaluation Result:</h3>
            <pre className="whitespace-pre-wrap text-gray-800 font-sans">{response}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptForm;