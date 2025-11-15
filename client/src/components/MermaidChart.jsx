import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

export default function MermaidChart({ chart }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!chart) return undefined;

    const container = ref.current;
    if (!container) return undefined;

    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    });

    const id = `m${Math.random().toString(36).slice(2)}`;

    let mounted = true;
    const renderDiagram = async () => {
      try {
        const { svg } = await mermaid.render(id, chart);
        if (mounted && container) {
          container.innerHTML = svg;
        }
      } catch (error) {
        console.error('Mermaid render failed', error);
        if (mounted && container) {
          container.innerHTML = '<p class="text-red-500 text-sm">Unable to render diagram.</p>';
        }
      }
    };

    renderDiagram();

    return () => {
      mounted = false;
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [chart]);

  return <div ref={ref} className="w-full overflow-auto" />;
}
