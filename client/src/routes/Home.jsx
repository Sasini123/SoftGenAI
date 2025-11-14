import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GeminiChat from "../components/GeminiChat";
import CodeSnippetGenerator from "../components/CodeSnippetGenerator";
import { useAuth } from "../context/AuthContext";
import {
  fetchProjects,
  createProject,
} from "../services/projectService";

const Home = () => {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('workspace');
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectError, setProjectError] = useState('');
  const [creating, setCreating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', description: '' });
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    const loadProjects = async () => {
      setProjectError('');
      setLoadingProjects(true);
      try {
        const { projects: list } = await fetchProjects(token);
        setProjects(list || []);
      } catch (error) {
        setProjectError(error.message || 'Failed to load projects');
      } finally {
        setLoadingProjects(false);
      }
    };
    loadProjects();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectForm.name.trim()) {
      setProjectError('Project name is required');
      return;
    }

    setCreating(true);
    setProjectError('');
    try {
      await createProject(token, projectForm);
      const { projects: list } = await fetchProjects(token);
      setProjects(list || []);
      setProjectForm({ name: '', description: '' });
      setFormOpen(false);
    } catch (error) {
      setProjectError(error.message || 'Could not create project');
    } finally {
      setCreating(false);
    }
  };

  const teammates = useMemo(() => {
    const map = new Map();
    projects.forEach((project) => {
      (project.members || []).forEach((member) => {
        const { user: memberUser } = member;
        if (!memberUser || memberUser._id === user?._id) return;
        if (!map.has(memberUser._id)) {
          map.set(memberUser._id, {
            ...memberUser,
            projects: new Set([project._id]),
            presence: member.presence,
          });
        } else {
          map.get(memberUser._id).projects.add(project._id);
        }
      });
    });
    return Array.from(map.values()).map((member) => ({
      ...member,
      projects: member.projects.size,
    }));
  }, [projects, user?._id]);

  const presenceColor = (presence) => {
    switch (presence) {
      case 'editing':
        return 'bg-green-500';
      case 'viewing':
        return 'bg-amber-400';
      default:
        return 'bg-gray-400';
    }
  };

  return (
  <div className="min-h-screen bg-linear-to-br from-primary via-white to-gray-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-linear-to-br from-secondary to-tertiary rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="text-2xl font-bold gradient-text">SoftGenAI</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {user && (
                <button
                  onClick={() => navigate('/profile')}
                  className="hidden md:flex items-center space-x-3 px-4 py-2 bg-linear-to-r from-gray-50 to-white rounded-xl border border-gray-200"
                >
                  <div className="w-8 h-8 bg-linear-to-br from-secondary to-tertiary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      (user.displayName || user.username || user.email)?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-dark">{user.displayName || user.username}</p>
                    <p className="text-gray-500 text-xs">{user.email}</p>
                  </div>
                </button>
              )}
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-linear-to-r from-secondary to-tertiary text-white rounded-xl font-semibold hover:shadow-glow transition-all flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-dark mb-2">
            Welcome back, <span className="gradient-text">{user?.displayName || user?.username || 'Developer'}</span>! 👋
          </h1>
          <p className="text-gray-600 text-lg">Stay on top of every collaborative project in one place.</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex space-x-2 bg-white rounded-xl p-2 shadow-md border border-gray-200 animate-slide-up">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'workspace'
                ? 'bg-linear-to-r from-secondary to-tertiary text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              <span>Workspace</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'chat'
                ? 'bg-linear-to-r from-secondary to-tertiary text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>AI Assistant</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'generator'
                ? 'bg-linear-to-r from-secondary to-tertiary text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span>Code Generator</span>
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'workspace' && (
            <div className="space-y-8">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-gray-500">overview</p>
                    <h2 className="text-2xl font-bold text-dark">My Projects</h2>
                    <p className="text-gray-500">{projects.length || 0} active {projects.length === 1 ? 'project' : 'projects'}</p>
                  </div>
                  <button
                    onClick={() => setFormOpen((prev) => !prev)}
                    className="px-5 py-2 bg-linear-to-r from-secondary to-tertiary text-white rounded-xl font-semibold hover:shadow-glow transition-all"
                  >
                    {formOpen ? 'Close form' : 'New project'}
                  </button>
                </div>

                {formOpen && (
                  <form onSubmit={handleCreateProject} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-fade-in">
                    <div className="md:col-span-1">
                      <label className="text-sm font-semibold text-gray-500">Project name</label>
                      <input
                        type="text"
                        value={projectForm.name}
                        onChange={(e) => setProjectForm((prev) => ({ ...prev, name: e.target.value }))}
                        className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-3 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                        placeholder="e.g. Mobile banking app"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-semibold text-gray-500">Description</label>
                      <textarea
                        value={projectForm.description}
                        onChange={(e) => setProjectForm((prev) => ({ ...prev, description: e.target.value }))}
                        className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-3 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                        rows="1"
                        placeholder="Describe the goal, stack, or milestones"
                      />
                    </div>
                    <div className="md:col-span-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={creating}
                        className="px-6 py-3 bg-linear-to-r from-secondary to-tertiary text-white rounded-xl font-semibold hover:shadow-glow disabled:opacity-50"
                      >
                        {creating ? 'Creating...' : 'Create project'}
                      </button>
                    </div>
                  </form>
                )}

                {projectError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6">
                    {projectError}
                  </div>
                )}

                {loadingProjects ? (
                  <div className="py-16 text-center">
                    <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading your projects...</p>
                  </div>
                ) : projects.length === 0 ? (
                  <div className="py-16 text-center text-gray-500">
                    <p>No projects yet. Create one to start collaborating!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((project) => {
                      const memberCount = project.members?.length || 0;
                      const head = project.members?.find((member) => member.role === 'head');
                      const isHead = head?.user?._id === user?._id;
                      return (
                        <div key={project._id} className="p-5 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-semibold text-dark">{project.name}</h3>
                              {project.description && (
                                <p className="text-gray-500 text-sm mt-1">{project.description}</p>
                              )}
                            </div>
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isHead ? 'bg-secondary/20 text-secondary' : 'bg-gray-100 text-gray-600'}`}>
                              {isHead ? 'Head' : 'Member'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex -space-x-2">
                              {(project.members || []).slice(0, 4).map((member) => (
                                <div key={member.user?._id} className="relative">
                                  <div className={`absolute -right-1 -bottom-1 w-3 h-3 rounded-full border-2 border-white ${presenceColor(member.presence)}`}></div>
                                  <div className="w-8 h-8 rounded-full bg-gray-100 border border-white flex items-center justify-center text-xs font-semibold">
                                    {member.user?.avatarUrl ? (
                                      <img src={member.user.avatarUrl} alt={member.user.username} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                      (member.user?.displayName || member.user?.username || '?')[0]?.toUpperCase()
                                    )}
                                  </div>
                                </div>
                              ))}
                              {memberCount > 4 && (
                                <div className="w-8 h-8 rounded-full bg-gray-100 border border-white flex items-center justify-center text-xs font-semibold text-gray-500">+{memberCount - 4}</div>
                              )}
                            </div>
                            <div className="flex items-center space-x-3">
                              <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
                              <button
                                onClick={() => navigate(`/projects/${project._id}`)}
                                className="px-4 py-2 text-sm font-semibold text-secondary border border-secondary rounded-xl hover:bg-secondary hover:text-white transition-all"
                              >
                                Open workspace
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-gray-500">colleagues</p>
                    <h2 className="text-2xl font-bold text-dark">Who you're working with</h2>
                  </div>
                  <span className="text-sm text-gray-500">{teammates.length} collaborators</span>
                </div>

                {teammates.length === 0 ? (
                  <p className="text-gray-500">Invite teammates to collaborate on your projects.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teammates.map((member) => (
                      <div key={member._id} className="p-4 border border-gray-200 rounded-2xl bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className={`absolute -right-1 -bottom-1 w-3 h-3 rounded-full border-2 border-white ${presenceColor(member.presence)}`}></div>
                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-tertiary font-semibold text-lg">
                              {member.avatarUrl ? (
                                <img src={member.avatarUrl} alt={member.displayName || member.username} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                (member.displayName || member.username || member.email)[0]?.toUpperCase()
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-dark">{member.displayName || member.username}</p>
                            <p className="text-xs text-gray-500">Collaborating on {member.projects} project{member.projects === 1 ? '' : 's'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="h-[calc(100vh-280px)]">
              <GeminiChat />
            </div>
          )}

          {activeTab === 'generator' && (
            <CodeSnippetGenerator />
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
