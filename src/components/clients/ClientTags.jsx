import { useState, useEffect } from 'react';
import { getClientTags, assignTagToClient, removeTagFromClient } from '../../api/clients.api';

export default function ClientTags({ clientId }) {
  const [tags, setTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const response = await getClientTags(clientId);
        if (mounted) {
          setTags(response.data || []);
        }
        
        // Load all available tags (in real app, you'd have a separate endpoint)
        // For now, we'll just use the ones assigned to the client
        if (mounted) {
          setAvailableTags([]);
        }
      } catch (error) {
        if (mounted) {
          console.error('Failed to load tags:', error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [clientId]);

  const handleAssignTag = async (tagId) => {
    try {
      await assignTagToClient(clientId, tagId);
      // Reload tags after assignment
      const response = await getClientTags(clientId);
      setTags(response.data || []);
    } catch (error) {
      console.error('Failed to assign tag:', error);
    }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      await removeTagFromClient(clientId, tagId);
      // Reload tags after removal
      const response = await getClientTags(clientId);
      setTags(response.data || []);
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-4">Loading tags...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Client Tags</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Tag
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Select a tag to assign:</p>
          <div className="flex gap-2">
            {availableTags.length === 0 ? (
              <p className="text-sm text-gray-500">No available tags</p>
            ) : (
              availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleAssignTag(tag.id)}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                >
                  {tag.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tags.length === 0 ? (
          <p className="text-gray-500 text-center py-4 w-full">No tags assigned</p>
        ) : (
          tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
              style={{ backgroundColor: tag.color + '20', color: tag.color }}
            >
              {tag.name}
              <button
                onClick={() => handleRemoveTag(tag.id)}
                className="ml-1 hover:text-red-600"
                title="Remove tag"
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}