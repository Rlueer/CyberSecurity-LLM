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

  useEffect(() => {
    fetch("http://localhost:3001/questions")
      .then((res) => res.json())
      .then((data) => setQuestions(data))
      .catch((err) => console.error("Error fetching questions:", err));
  }, []);

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">
        Cybersecurity Questions
      </h1>
      <div className="grid gap-4 md:grid-cols-2">
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

      {/* Gemini formu */}
      <PromptForm />
    </div>
  );
};

export default App;
