import { useState, useEffect } from 'react';
import { getClientCustomFieldValues, updateClientCustomFieldValues } from '../../api/clients.api';

export default function ClientCustomFields({ clientId }) {
  const [fields, setFields] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const loadData = async () => {
    try {
      const response = await getClientCustomFieldValues(clientId);
      setFields(response.fields || []);
      setValues(response.values || {});
    } catch (error) {
      console.error('Failed to load custom fields:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [clientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateClientCustomFieldValues(clientId, values);
      setEditing(false);
    } catch (error) {
      console.error('Failed to update custom fields:', error);
    }
  };

  const handleChange = (fieldName, value) => {
    setValues({ ...values, [fieldName]: value });
  };

  const renderField = (field) => {
    const value = values[field.name] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            disabled={!editing}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!editing}
          >
            <option value="">Select...</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={value === true || value === 'true'}
            onChange={(e) => handleChange(field.name, e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            disabled={!editing}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!editing}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!editing}
          />
        );

      case 'url':
        return (
          <input
            type="url"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!editing}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!editing}
          />
        );
    }
  };

  if (loading) {
    return <div className="flex justify-center py-4">Loading custom fields...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Custom Fields</h3>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditing(false);
                loadData();
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {fields.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No custom fields defined</p>
      ) : (
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.id} className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderField(field)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}