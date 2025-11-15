import { useState } from 'react';
import MermaidChart from './MermaidChart';
import { saveDiagram, loadDiagram } from '../services/diagramService';
import { useAuth } from '../context/AuthContext';

const DEFAULT_SNIPPET = `sequenceDiagram
  participant User
  participant API
  User->>API: Create diagram
  API-->>User: Diagram ID
`;

export default function MermaidEditor() {
  const [text, setText] = useState(DEFAULT_SNIPPET);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [diagramId, setDiagramId] = useState('');
  const [diagramCode, setDiagramCode] = useState('');
  const [loadId, setLoadId] = useState('');
  const [feedback, setFeedback] = useState('');
  const { token } = useAuth();

  const showFeedback = (message) => {
    setFeedback(message);
    setTimeout(() => setFeedback(''), 4000);
  };

  const handleSave = async () => {
    if (!token) {
      showFeedback('Sign in to save diagrams.');
      return;
    }
    setSaving(true);
    try {
  const { id, code } = await saveDiagram(token, text);
  setDiagramId(id);
  setDiagramCode(code);
  setLoadId(code || id);
  showFeedback('Diagram saved successfully. Share the code below to reopen it.');
    } catch (error) {
      showFeedback(error.message || 'Unable to save diagram');
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = async (event) => {
    event.preventDefault();
    if (!token) {
      showFeedback('Sign in to load diagrams.');
      return;
    }
    if (!loadId.trim()) {
      showFeedback('Enter a diagram ID to load.');
      return;
    }
    setLoading(true);
    try {
      const diagram = await loadDiagram(token, loadId.trim());
      if (diagram?.source) {
        setText(diagram.source);
        setDiagramId(diagram._id);
        showFeedback('Diagram loaded.');
      } else {
        showFeedback('Diagram not found.');
      }
    } catch (error) {
      const message = (error.message || '').toLowerCase().includes('authorization')
        ? 'Your session expired. Sign in again to load diagrams.'
        : error.message || 'Unable to load diagram';
      showFeedback(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500">Diagram editor</p>
          <h1 className="text-3xl font-bold text-dark">Create live Mermaid diagrams</h1>
          <p className="text-gray-500">Type markdown-like syntax on the left to see instant previews on the right.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-3 bg-linear-to-r from-secondary to-tertiary text-white rounded-xl font-semibold disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save diagram'}
          </button>
          <form onSubmit={handleLoad} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={loadId}
              onChange={(e) => setLoadId(e.target.value)}
              placeholder="Diagram ID"
              className="px-4 py-3 border border-gray-300 rounded-xl"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 border border-secondary text-secondary rounded-xl font-semibold disabled:opacity-60"
            >
              {loading ? 'Loading…' : 'Load'}
            </button>
          </form>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-secondary/10 text-secondary text-sm">
          {feedback}
          {diagramId && (
            <span className="block text-xs text-gray-600 mt-1">
              Current diagram code: <strong>{diagramCode || diagramId}</strong>
            </span>
          )}
          {diagramCode && (
            <span className="block text-[11px] text-gray-500">
              (Full ID: {diagramId})
            </span>
          )}
        </div>
      )}

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded-3xl border border-gray-200 shadow-xl">
        <textarea
          className="border border-gray-200 rounded-2xl p-4 h-96 focus:border-secondary focus:ring-2 focus:ring-secondary/20 font-mono text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="border border-gray-200 rounded-2xl p-4 h-96 overflow-auto bg-gray-50">
          <MermaidChart chart={text} />
        </div>
      </div>
    </div>
  );
}
