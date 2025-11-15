import { useNavigate } from 'react-router-dom';
import MermaidEditor from '../components/MermaidEditor';

export default function DiagramEditor() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-linear-to-br from-primary via-white to-gray-100 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-tertiary transition-colors"
        >
          <span aria-hidden="true">←</span>
          Back
        </button>
        <MermaidEditor />
      </div>
    </div>
  );
}
