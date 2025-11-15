import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeSnippetGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const languages = [
    { value: 'javascript', label: 'JavaScript', icon: '🟨' },
    { value: 'python', label: 'Python', icon: '🐍' },
    { value: 'java', label: 'Java', icon: '☕' },
    { value: 'cpp', label: 'C++', icon: '⚙️' },
    { value: 'go', label: 'Go', icon: '🔵' },
    { value: 'rust', label: 'Rust', icon: '🦀' },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setGeneratedCode('');
    let accumulated = '';

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Generate ${language} code for: ${prompt}. Only provide the code with minimal comments, no explanations. Use proper markdown code blocks.`,
          stream: true
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.chunk) {
                accumulated += data.chunk;
                setGeneratedCode(accumulated);
              }
              
              if (data.error) {
                setGeneratedCode('// Error generating code: ' + data.error);
              }
            } catch (e) {
              console.warn('Parse error:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setGeneratedCode('// Error generating code');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
      <div className="flex items-center space-x-3 mb-6">
  <div className="w-12 h-12 bg-linear-to-br from-secondary to-tertiary rounded-xl flex items-center justify-center shadow-lg">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-dark">Code Generator</h2>
          <p className="text-gray-500 text-sm">AI-powered snippet creation</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Language Selection */}
        <div>
          <label className="block text-sm font-semibold text-dark mb-2">Language</label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {languages.map((lang) => (
              <button
                key={lang.value}
                onClick={() => setLanguage(lang.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  language === lang.value
                    ? 'bg-linear-to-r from-secondary to-tertiary text-white shadow-lg'
                    : 'bg-gray-100 text-dark hover:bg-gray-200'
                }`}
              >
                <span className="mr-1">{lang.icon}</span>
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div>
          <label className="block text-sm font-semibold text-dark mb-2">What do you want to create?</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., A function to sort an array of objects by date..."
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 resize-none"
            rows="3"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isLoading}
          className="w-full px-6 py-3 bg-linear-to-r from-secondary to-tertiary text-white rounded-xl font-semibold hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Generating...</span>
            </span>
          ) : (
            'Generate Code'
          )}
        </button>

        {/* Generated Code */}
        {generatedCode && (
          <div className="relative animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-dark">Generated Code</label>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-dark rounded-lg transition-all flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-gray-700">
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  fontSize: '0.875rem',
                  borderRadius: '0.75rem'
                }}
                showLineNumbers={true}
              >
                {generatedCode.replace(/```[\w]*\n?/g, '').replace(/```$/g, '')}
              </SyntaxHighlighter>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeSnippetGenerator;
