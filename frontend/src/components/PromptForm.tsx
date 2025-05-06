import React, { useState } from "react";

const PromptForm: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("http://localhost:3001/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      setResponse(data.result);
    } catch (err) {
      setResponse("❌ Hata oluştu.");
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mt-10 max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block font-semibold text-gray-700">
          Prompt girin:
          <textarea
            className="w-full border p-2 rounded mt-2"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
          />
        </label>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Gönder
        </button>
      </form>

      {loading && <p className="mt-4 text-gray-500">Yanıt bekleniyor...</p>}
      {response && (
        <div className="mt-4 p-4 border rounded bg-gray-50 whitespace-pre-wrap">
          {response}
        </div>
      )}
    </div>
  );
};

export default PromptForm;
