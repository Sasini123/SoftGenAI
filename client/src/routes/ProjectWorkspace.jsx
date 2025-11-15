import React, { useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import MermaidChart from '../components/MermaidChart';
import {
  fetchProjectDetail,
  addProjectMember,
  fetchPresence,
  updatePresence,
  fetchDocuments,
  createDocument,
  uploadDocument,
  fetchDocumentById,
  updateDocument,
  fetchChatMessages,
  sendChatMessage,
} from '../services/projectService';
import { API_BASE } from '../services/api';

const presenceColor = (status) => {
  switch (status) {
    case 'editing':
      return 'bg-green-500';
    case 'viewing':
      return 'bg-amber-400';
    default:
      return 'bg-gray-400';
  }
};

const LANGUAGE_OPTIONS = [
  {
    value: 'markdown',
    label: 'Markdown',
    template: `# Project Notes

- [ ] Key tasks
- [ ] Owners

## Decisions
`,
  },
  {
    value: 'javascript',
    label: 'JavaScript',
    template: `// Entry point
function main() {
  console.log('Hello team!');
}

main();
`,
  },
  {
    value: 'react',
    label: 'React',
    template: `import React from 'react';

export default function Component() {
  return (
    <section className="p-4">
      <h1>New Feature</h1>
      <p>Describe intent here.</p>
    </section>
  );
}
`,
  },
  {
    value: 'python',
    label: 'Python',
    template: `def main():
    print("Hello from SoftGenAI")

if __name__ == "__main__":
    main()
`,
  },
  {
    value: 'java',
    label: 'Java',
    template: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello team!");
    }
}
`,
  },
  {
    value: 'c++',
    label: 'C++',
    template: `#include <iostream>

int main() {
    std::cout << "Hello team!" << std::endl;
    return 0;
}
`,
  },
  {
    value: 'c',
    label: 'C',
    template: `#include <stdio.h>

int main(void) {
    printf("Hello team!\n");
    return 0;
}
`,
  },
];

const LANGUAGE_TEMPLATE = (lang) =>
  LANGUAGE_OPTIONS.find((option) => option.value === lang)?.template || '';

const mapToMonacoLanguage = (lang) => {
  if (lang === 'react') return 'javascript';
  if (lang === 'c++') return 'cpp';
  return lang || 'markdown';
};

const socketStatusStyles = {
  connected: 'bg-emerald-100 text-emerald-700',
  connecting: 'bg-amber-100 text-amber-700',
  disconnected: 'bg-gray-100 text-gray-600',
  error: 'bg-red-100 text-red-700',
};

const socketStatusLabel = {
  connected: 'Live sync on',
  connecting: 'Connecting…',
  disconnected: 'Offline mode',
  error: 'Sync error',
};

const ProjectWorkspace = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [project, setProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [selectedDocumentMeta, setSelectedDocumentMeta] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [editorLanguage, setEditorLanguage] = useState('markdown');
  const [chatMessages, setChatMessages] = useState([]);
  const [presence, setPresence] = useState([]);
  const [memberIdentifier, setMemberIdentifier] = useState('');
  const [memberFeedback, setMemberFeedback] = useState('');
  const [docForm, setDocForm] = useState({ title: '', type: 'text', language: 'markdown' });
  const [messageDraft, setMessageDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingDoc, setSavingDoc] = useState(false);
  const [socketStatus, setSocketStatus] = useState('connecting');
  const socketRef = useRef(null);

  const isHead = useMemo(() => {
    if (!project) return false;
    return project.members?.some(
      (member) => member.role === 'head' && member.user?._id === user?._id
    );
  }, [project, user?._id]);

  useEffect(() => {
    if (!projectId || !token) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchProjectDetail(token, projectId);
        setProject(data.project);
        setDocuments(data.documents || []);
        setChatMessages(data.chat || []);
        setPresence(data.project?.members || []);
        if (data.documents?.length) {
          selectDocument(data.documents[0]._id);
        }
      } catch (err) {
        setError(err.message || 'Unable to load project');
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, token]);

  useEffect(() => {
    if (!projectId || !token) return undefined;
    let cancelled = false;
    const syncPresence = async (status = 'viewing') => {
      try {
        await updatePresence(token, projectId, status);
        const { members } = await fetchPresence(token, projectId);
        if (!cancelled) setPresence(members || []);
      } catch (err) {
        console.error('Presence update failed', err.message);
      }
    };

    syncPresence('viewing');
    const interval = setInterval(syncPresence, 20000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      updatePresence(token, projectId, 'offline').catch(() => {});
    };
  }, [projectId, token]);

  useEffect(() => {
    if (!projectId || !token) return undefined;
    const loadChat = async () => {
      try {
        const { messages } = await fetchChatMessages(token, projectId);
        setChatMessages(messages || []);
      } catch (err) {
        console.error('Failed to load chat', err.message);
      }
    };
    loadChat();
    const interval = setInterval(loadChat, 15000);
    return () => clearInterval(interval);
  }, [projectId, token]);

  useEffect(() => {
    if (!token || !projectId) {
      setSocketStatus('disconnected');
      return undefined;
    }

    const socket = io(API_BASE, {
      auth: { token },
      transports: ['websocket'],
      withCredentials: true,
    });
    socketRef.current = socket;
    setSocketStatus('connecting');

    const joinRoom = () => socket.emit('joinProject', { projectId });

    socket.on('connect', () => {
      setSocketStatus('connected');
      joinRoom();
    });
    socket.on('disconnect', () => setSocketStatus('disconnected'));
    socket.on('connect_error', () => setSocketStatus('error'));
    socket.on('reconnect_attempt', () => setSocketStatus('connecting'));
    socket.on('reconnect', () => {
      setSocketStatus('connected');
      joinRoom();
    });

    socket.on('presence:update', (members) => {
      if (Array.isArray(members)) {
        setPresence(members);
      }
    });

    socket.on('chat:message', (message) => {
      if (!message) return;
      setChatMessages((prev) => {
        if (message._id && prev.some((msg) => msg._id === message._id)) {
          return prev.map((msg) => (msg._id === message._id ? message : msg));
        }
        return [...prev, message];
      });
    });

    return () => {
      socket.emit('leaveProject', { projectId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [projectId, token]);

  const emitPresence = (status) => {
    if (!projectId) return;
    socketRef.current?.emit('presence:update', { projectId, status });
  };

  const refreshDocuments = async () => {
    const { documents: list } = await fetchDocuments(token, projectId);
    setDocuments(list || []);
  };

  const selectDocument = async (documentId) => {
    try {
      const { document } = await fetchDocumentById(token, documentId);
      setSelectedDocumentId(documentId);
      setSelectedDocumentMeta(document);
      const resolvedContent = document.content?.length
        ? document.content
        : LANGUAGE_TEMPLATE(document.language);
      setEditorContent(resolvedContent || '');
      setEditorLanguage(document.language || 'markdown');
      const nextStatus = document.type === 'file' ? 'viewing' : 'editing';
      await updatePresence(token, projectId, nextStatus);
      emitPresence(nextStatus);
    } catch (err) {
      setError(err.message || 'Failed to load document');
    }
  };

  const handleEditorLanguageChange = (value) => {
    setEditorLanguage(value);
    if (!editorContent.trim()) {
      const template = LANGUAGE_TEMPLATE(value);
      if (template) {
        setEditorContent(template);
      }
    }
  };

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    try {
      await createDocument(token, projectId, {
        ...docForm,
      });
      setDocForm({ title: '', type: 'text', language: 'markdown' });
      await refreshDocuments();
    } catch (err) {
      setError(err.message || 'Failed to create document');
    }
  };

  const handleUploadDocument = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await uploadDocument(token, projectId, file);
      await refreshDocuments();
      event.target.value = '';
    } catch (err) {
      setError(err.message || 'Failed to upload file');
    }
  };

  const handleSaveDocument = async () => {
    if (!selectedDocumentId) return;
    if (selectedDocumentMeta?.type === 'file') {
      setError('Uploaded files are read-only. Download the asset to edit it locally.');
      return;
    }
    setSavingDoc(true);
    setError('');
    try {
      const { document } = await updateDocument(token, selectedDocumentId, {
        content: editorContent,
        language: editorLanguage,
      });
      setSelectedDocumentMeta(document);
      await refreshDocuments();
      emitPresence('editing');
    } catch (err) {
      setError(err.message || 'Failed to save document');
    } finally {
      setSavingDoc(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberIdentifier.trim()) return;
    try {
      const { project: updated } = await addProjectMember(
        token,
        projectId,
        memberIdentifier.trim()
      );
      setProject(updated);
      setPresence(updated.members || []);
      setMemberIdentifier('');
      setMemberFeedback('Colleague added successfully');
      setTimeout(() => setMemberFeedback(''), 4000);
    } catch (err) {
      setMemberFeedback(err.message || 'Failed to add member');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageDraft.trim()) return;
    const trimmed = messageDraft.trim();
    if (socketRef.current?.connected) {
      socketRef.current.emit('chat:message', { projectId, message: trimmed });
      setMessageDraft('');
      return;
    }
    try {
      const { message } = await sendChatMessage(token, projectId, trimmed);
      setChatMessages((prev) => [...prev, message]);
      setMessageDraft('');
    } catch (err) {
      setError(err.message || 'Failed to send message');
    }
  };

  const activeMembers = presence.map((member) => ({
    id: member.user?._id,
    name: member.user?.displayName || member.user?.username || member.user?.email,
    avatar: member.user?.avatarUrl,
    presence: member.presence,
    role: member.role,
  }));

  const collaborationDiagram = useMemo(() => {
    const projectName = project?.name || 'Project';
    const documentCount = documents.length;
    const memberCount = activeMembers.length;
    return `graph TD
  A[${projectName}] --> B{Collaboration Hub}
  B -->|${memberCount} members| C[Team Presence]
  B -->|${documentCount} docs| D[Documents]
  D --> E[Editor]
  C --> F[Chat]
  F --> A
`;
  }, [project?.name, documents.length, activeMembers.length]);

  const isFileDocument = selectedDocumentMeta?.type === 'file';
  const socketBadgeClass = socketStatusStyles[socketStatus] || socketStatusStyles.disconnected;
  const socketBadgeLabel = socketStatusLabel[socketStatus] || socketStatusLabel.disconnected;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-14 h-14 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500">Loading workspace...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-red-500 mb-4">{error || 'Project not found'}</p>
        <button
          onClick={() => navigate('/home')}
          className="px-6 py-3 bg-linear-to-r from-secondary to-tertiary text-white rounded-xl font-semibold"
        >
          Back to home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-primary via-white to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-500">Workspace</p>
              <h1 className="text-3xl font-bold text-dark">{project.name}</h1>
              {project.description && <p className="text-gray-500 mt-1">{project.description}</p>}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/home')}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
              >
                Back to Home
              </button>
              {isHead && (
                <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={memberIdentifier}
                    onChange={(e) => setMemberIdentifier(e.target.value)}
                    placeholder="Enter email or username"
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-linear-to-r from-secondary to-tertiary text-white rounded-xl font-semibold"
                  >
                    Add member
                  </button>
                </form>
              )}
            </div>
          </div>
          {memberFeedback && (
            <div className="mt-4 text-sm text-secondary">{memberFeedback}</div>
          )}
          <div className="mt-6 flex -space-x-3 flex-wrap gap-2">
            {activeMembers.map((member) => (
              <div key={member.id} className="relative">
                <div className={`absolute -right-1 -bottom-1 w-3 h-3 rounded-full border-2 border-white ${presenceColor(member.presence)}`}></div>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-tertiary">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    member.name?.[0]?.toUpperCase()
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-dark">Documents</h2>
                <label className="text-sm text-secondary cursor-pointer">
                  Upload
                  <input type="file" className="hidden" onChange={handleUploadDocument} />
                </label>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {documents.map((doc) => (
                  <div key={doc._id} className="space-y-1">
                    <button
                      onClick={() => selectDocument(doc._id)}
                      className={`w-full text-left p-3 rounded-xl border ${
                        selectedDocumentId === doc._id
                          ? 'border-secondary bg-secondary/10'
                          : 'border-gray-200'
                      }`}
                    >
                      <p className="font-semibold text-dark flex items-center justify-between">
                        <span>{doc.title}</span>
                        {doc.type === 'file' && (
                          <span className="text-[10px] uppercase tracking-widest text-secondary font-semibold">
                            File
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {doc.type === 'file' ? doc.mimeType || 'binary' : doc.language}
                      </p>
                    </button>
                    {doc.type === 'file' && doc.filePath && (
                      <a
                        href={`${API_BASE}${doc.filePath}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-xs text-secondary underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Download ({Math.max(1, Math.round((doc.size || 0) / 1024))} KB)
                      </a>
                    )}
                  </div>
                ))}
                {documents.length === 0 && (
                  <p className="text-gray-500 text-sm">No documents yet.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow p-4">
              <h2 className="text-lg font-semibold text-dark mb-4">New document</h2>
              <form onSubmit={handleCreateDocument} className="space-y-3">
                <input
                  type="text"
                  value={docForm.title}
                  onChange={(e) => setDocForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Document title"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                  required
                />
                <select
                  value={docForm.type}
                  onChange={(e) => setDocForm((prev) => ({ ...prev, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2"
                >
                  <option value="text">Notes / brief</option>
                  <option value="code">Code</option>
                </select>
                <input
                  type="text"
                  value={docForm.language}
                  onChange={(e) => setDocForm((prev) => ({ ...prev, language: e.target.value }))}
                  placeholder="Language (e.g. react, python)"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-linear-to-r from-secondary to-tertiary text-white rounded-xl font-semibold"
                >
                  Create
                </button>
              </form>
            </div>
          </div>

          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 shadow p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-dark">Document editor</h2>
                {selectedDocumentMeta && (
                  <p className="text-xs text-gray-500">
                    Last updated {new Date(selectedDocumentMeta.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${socketBadgeClass}`}>
                {socketBadgeLabel}
              </span>
              <div className="flex items-center space-x-3">
                <select
                  value={editorLanguage}
                  onChange={(e) => handleEditorLanguageChange(e.target.value)}
                  className="border border-gray-300 rounded-xl px-3 py-2"
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const template = LANGUAGE_TEMPLATE(editorLanguage);
                    if (!template) return;
                    if (
                      editorContent.trim() &&
                      !window.confirm('Replace current content with the template?')
                    ) {
                      return;
                    }
                    setEditorContent(template);
                  }}
                  className="px-4 py-2 border border-secondary text-secondary rounded-xl font-semibold"
                >
                  Templates
                </button>
                <button
                  onClick={handleSaveDocument}
                  disabled={savingDoc || isFileDocument}
                  className="px-4 py-2 bg-secondary text-white rounded-xl font-semibold"
                >
                  {isFileDocument ? 'Read-only' : savingDoc ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
            <div className="flex-1 border border-gray-200 rounded-2xl overflow-hidden relative">
              {isFileDocument && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 text-center px-6">
                  <p className="text-lg font-semibold text-secondary mb-2">
                    File uploads are read-only
                  </p>
                  <p className="text-sm text-gray-600">
                    Use the download link in the Documents panel to open this asset.
                  </p>
                </div>
              )}
              {selectedDocumentId && !isFileDocument ? (
                <Editor
                  height="60vh"
                  language={mapToMonacoLanguage(editorLanguage)}
                  theme="vs-light"
                  value={editorContent}
                  onChange={(value) => setEditorContent(value ?? '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true,
                    padding: { top: 12 },
                  }}
                />
              ) : (
                <div className="h-[60vh] flex items-center justify-center text-gray-400 text-sm">
                  Select or create a document to start editing
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-1 bg-white rounded-2xl border border-gray-200 shadow flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-dark">Project chat</h2>
              <p className="text-xs text-gray-500">Messages are kept for 7 days</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => (
                <div key={msg._id} className={`p-3 rounded-xl ${msg.sender?._id === user?._id ? 'bg-secondary/10 text-secondary-900' : 'bg-gray-100'}`}>
                  <p className="text-sm font-semibold">
                    {msg.sender?.displayName || msg.sender?.username || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
              {chatMessages.length === 0 && (
                <p className="text-sm text-gray-500">No messages yet.</p>
              )}
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100">
              <textarea
                rows="2"
                value={messageDraft}
                onChange={(e) => setMessageDraft(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 focus:border-secondary focus:ring-2 focus:ring-secondary/20 resize-none"
                placeholder="Share updates with your team"
              />
              <button
                type="submit"
                className="mt-2 w-full py-2 bg-linear-to-r from-secondary to-tertiary text-white rounded-xl font-semibold"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-500">visual snapshot</p>
              <h2 className="text-2xl font-bold text-dark">Live collaboration diagram</h2>
              <p className="text-gray-500">
                This auto-generated Mermaid chart highlights how your team, chat, and documents tie together.
              </p>
            </div>
          </div>
          <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50 overflow-auto">
            <MermaidChart chart={collaborationDiagram} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectWorkspace;
