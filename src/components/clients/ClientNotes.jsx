import { useState, useEffect } from 'react';
import { clientsApi } from '../../api/clients.api';

export default function ClientNotes({ clientId }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    note: '',
    type: 'general',
    priority: 'normal',
  });

  const loadNotes = async () => {
    try {
      const response = await clientsApi.getNotes(clientId);
      setNotes(response.data.data);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [clientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await clientsApi.createNote(clientId, formData);
      setFormData({ note: '', type: 'general', priority: 'normal' });
      setShowForm(false);
      loadNotes();
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleTogglePin = async (noteId) => {
    try {
      await clientsApi.toggleNotePin(clientId, noteId);
      loadNotes();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
    };
    return colors[priority] || colors.normal;
  };

  const getTypeIcon = (type) => {
    const icons = {
      general: '📝',
      call: '📞',
      meeting: '👥',
      support: '🎧',
    };
    return icons[type] || '📝';
  };

  if (loading) {
    return <div className="flex justify-center py-4">Loading notes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Client Notes</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Note
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="call">Call</option>
                <option value="meeting">Meeting</option>
                <option value="support">Support</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save Note
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {notes.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No notes yet</p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={`border rounded-lg p-4 ${
                note.is_pinned ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{getTypeIcon(note.type)}</span>
                    <span className="text-sm font-medium text-gray-600 capitalize">{note.type}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(note.priority)}`}>
                      {note.priority}
                    </span>
                    {note.is_pinned && (
                      <span className="text-yellow-600 text-sm">📌 Pinned</span>
                    )}
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">{note.note}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    By {note.creator?.name || 'Unknown'} on {new Date(note.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handleTogglePin(note.id)}
                  className="ml-4 text-gray-400 hover:text-yellow-600"
                  title={note.is_pinned ? 'Unpin' : 'Pin'}
                >
                  {note.is_pinned ? '📌' : '📌'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}