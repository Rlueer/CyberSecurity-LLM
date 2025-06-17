import React, { useEffect, useState } from "react";
import PromptForm from "./components/PromptForm";

interface Question {
  id: number;
  domain: string;
  question_text: string;
  maturity_level: number;
}

const App: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  // 2. İyileştirme: State tanımı string | null olarak güncellendi.
  const [llmResponse, setLlmResponse] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:3001/questions")
      .then((res) => res.json())
      .then((data) => setQuestions(data))
      .catch((err) => console.error("Error fetching questions:", err));
  }, []);

  const handleLlmResponse = (response: string) => {
    setLlmResponse(response);
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">
        Cybersecurity Questionssss
      </h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {questions.map((q) => (
          <div
            key={q.id}
            className="bg-white p-4 rounded shadow hover:shadow-lg transition"
          >
            <p className="font-semibold text-gray-800">{q.domain}</p>
            <p className="text-gray-600">{q.question_text}</p>
            <p className="text-sm text-gray-500 mt-2">
              Level {q.maturity_level}
            </p>
          </div>
        ))}
      </div>

      {/* 1. İyileştirme: Gösterim koşulu .trim() ile daha sağlam hale getirildi. */}
      {llmResponse && llmResponse.trim() && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Genel Değerlendirme
          </h2>
          <p className="text-blue-700 whitespace-pre-wrap">{llmResponse}</p>
        </div>
      )}

      <PromptForm onResponse={handleLlmResponse} />
    </div>
  );
};

export default App;