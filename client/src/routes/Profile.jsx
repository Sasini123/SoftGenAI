import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile, uploadAvatar, updateStatus } from '../services/userService';

const statusOptions = [
  { value: 'online', label: 'Available', color: 'bg-green-500' },
  { value: 'busy', label: 'Do not disturb', color: 'bg-amber-500' },
  { value: 'offline', label: 'Offline', color: 'bg-gray-400' },
];

const Profile = () => {
  const { user, token, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: '', bio: '', skills: '' });
  const [status, setStatus] = useState('online');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        displayName: user.displayName || '',
        bio: user.bio || '',
        skills: (user.skills || []).join(', '),
      });
      setStatus(user.status || 'online');
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await updateProfile(token, {
        displayName: form.displayName,
        bio: form.bio,
        skills: form.skills,
      });
      await refreshProfile();
      setMessage('Profile updated successfully');
    } catch (err) {
      setMessage(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (value) => {
    setStatus(value);
    try {
      await updateStatus(token, value);
      await refreshProfile();
    } catch (err) {
      setMessage(err.message || 'Failed to update status');
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadAvatar(token, file);
      await refreshProfile();
      setMessage('Profile picture updated');
    } catch (err) {
      setMessage(err.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-primary via-white to-gray-100 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => navigate('/home')}
          className="mb-6 text-secondary font-semibold flex items-center space-x-2"
        >
          <span className="text-xl">←</span>
          <span>Back to Home</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-500">Profile</p>
              <h1 className="text-3xl font-bold text-dark">Account settings</h1>
              <p className="text-gray-500">Manage your avatar, bio, and collaboration status.</p>
            </div>
            <label className="mt-4 md:mt-0 inline-flex items-center space-x-3 px-4 py-2 border border-gray-300 rounded-xl cursor-pointer text-sm font-semibold">
              <input type="file" className="hidden" onChange={handleAvatarUpload} />
              <span>{uploading ? 'Uploading...' : 'Update photo'}</span>
            </label>
          </div>

          {message && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-secondary/10 text-secondary">
              {message}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center text-4xl font-bold text-tertiary">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName || user.username} className="w-full h-full object-cover" />
                  ) : (
                    (user?.displayName || user?.username || user?.email)?.[0]?.toUpperCase()
                  )}
                </div>
              </div>
              <div className="mt-6">
                <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">Status</p>
                <div className="space-y-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusChange(option.value)}
                      className={`w-full flex items-center justify-between px-4 py-2 border rounded-xl ${
                        status === option.value ? 'border-secondary bg-secondary/10 text-secondary' : 'border-gray-200'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <span className={`w-3 h-3 rounded-full ${option.color}`}></span>
                        <span>{option.label}</span>
                      </span>
                      {status === option.value && <span className="text-xs font-semibold">Active</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:w-2/3">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-semibold text-gray-500">Display name</label>
                  <input
                    type="text"
                    name="displayName"
                    value={form.displayName}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-3 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    placeholder="What should teammates call you?"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-500">Bio</label>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    rows="3"
                    className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-3 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                    placeholder="Share your focus areas, interests, or timezone"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-500">Skills</label>
                  <input
                    type="text"
                    name="skills"
                    value={form.skills}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-3"
                    placeholder="Comma separated e.g. React, Python, UX"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-linear-to-r from-secondary to-tertiary text-white rounded-xl font-semibold hover:shadow-glow disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
