import React, { useState, FormEvent } from 'react';

// 2. Değişiklik: Component'in dışarıdan onResponse fonksiyonu alabilmesi için interface eklendi.
interface PromptFormProps {
  onResponse?: (response: string) => void;
}

const PromptForm: React.FC<PromptFormProps> = ({ onResponse }) => {
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
      // 1. Değişiklik: API adresi, Vite'a bağımlı kalmadan direkt olarak yazıldı.
      const res = await fetch("http://localhost:3001/ask", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error('Backend ile iletişim kurulamadı.');
      }

      const data = await res.json();
      setResponse(data.result);
      
      // 2. Değişiklik: Eğer onResponse prop'u verildiyse, cevap üst component'e iletiliyor.
      onResponse?.(data.result);

    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 border-t-2 pt-6">
      <h2 className="text-2xl font-bold text-blue-600 mb-4">
        Ask the LLM
      </h2>
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full p-2 border rounded shadow-sm"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type your questionsssss here..."
          rows={4}
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>

      <div className="mt-4 p-4 bg-gray-50 rounded">
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        
        {/* 3. Değişiklik: LLM yanıtı, daha şık bir kutu içinde gösteriliyor. */}
        {response && (
          <div className="bg-white p-4 rounded shadow mt-2">
            <h3 className="font-semibold mb-2">LLM Response:</h3>
            <pre className="whitespace-pre-wrap text-gray-800 font-sans">{response}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptForm;