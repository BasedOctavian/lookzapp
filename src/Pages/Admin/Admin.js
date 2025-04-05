import React, { useState, useMemo, useCallback } from 'react';
import { useReactTable, flexRender, getCoreRowModel } from '@tanstack/react-table';
import TopBar from '../../Components/TopBar';
import Footer from '../../Components/Footer';
import '../../App.css';
import useAdminInfluencers from '../../hooks/admin/useAdminInfluencers';

function Admin() {
  // State definitions
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Data and functions from custom hook
  const { influencers, loading, error, updateInfluencer, uploadPhoto } = useAdminInfluencers();

  const correctPassword = 'Octavian';

  // Field definitions for the table
  const fields = [
    { name: 'id', type: 'text', editable: false },
    { name: 'name', type: 'text', editable: true },
    { name: 'category', type: 'select', options: ['celebs', 'models', 'athletes', 'other'], editable: true },
    { name: 'gender', type: 'select', options: ['M', 'W'], editable: true },
    { name: 'ethnicity', type: 'select', options: ['euro', 'asian', 'african', 'hispanic', 'other'], editable: true },
    { name: 'eyeColor', type: 'select', options: ['blue', 'green', 'brown', 'hazel', 'gray'], editable: true },
    { name: 'height', type: 'number', step: '1', editable: true },
    { name: 'weight', type: 'number', step: '1', editable: true },
    { name: 'bodyRating', type: 'number', step: '0.01', editable: true },
    { name: 'eyesRating', type: 'number', step: '0.01', editable: true },
    { name: 'facialRating', type: 'number', step: '0.01', editable: true },
    { name: 'hairRating', type: 'number', step: '0.01', editable: true },
    { name: 'smileRating', type: 'number', step: '0.01', editable: true },
    { name: 'ranking', type: 'number', step: '1', editable: true },
    { name: 'timesRanked', type: 'number', step: '1', editable: true },
    { name: 'photo_url', type: 'photo', editable: true },
  ];

  // Fields that need to be parsed as numbers when saving
  const numberFields = [
    'bodyRating',
    'eyesRating',
    'facialRating',
    'hairRating',
    'height',
    'weight',
    'ranking',
    'timesRanked',
    'smileRating',
  ];

  // Handle password submission for authentication
  const handlePasswordSubmit = useCallback(() => {
    if (password === correctPassword) {
      setIsAuthenticated(true);
      console.log('Authentication successful.');
    } else {
      alert('Incorrect password. Please try again.');
      setPassword('');
      console.log('Authentication failed.');
    }
  }, [password]);

  // Handle field changes in the table
  const handleFieldChange = useCallback((id, field, value) => {
    setEditedData((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }));
    setHasUnsavedChanges(true);
    console.log(`Edited influencer id ${id}, field ${field}: ${value}`);
  }, []);

  // Save changes to Firestore, parsing number fields
  const handleSaveChanges = useCallback(async () => {
    try {
      for (const [id, updates] of Object.entries(editedData)) {
        const parsedUpdates = {};
        for (const [field, value] of Object.entries(updates)) {
          if (numberFields.includes(field)) {
            parsedUpdates[field] = parseFloat(value);
          } else {
            parsedUpdates[field] = value;
          }
        }
        await updateInfluencer(id, parsedUpdates);
        console.log(`Updated influencer ${id} in Firestore with:`, parsedUpdates);
      }
      setEditedData({});
      setHasUnsavedChanges(false);
      console.log('Changes saved successfully.');
    } catch (err) {
      console.error('Error saving changes:', err);
    }
  }, [editedData, updateInfluencer]);

  // Handle photo uploads
  const handlePhotoUpload = useCallback(async (id, file) => {
    if (file) {
      try {
        await uploadPhoto(id, file);
        console.log(`Photo uploaded successfully for influencer ${id}.`);
      } catch (err) {
        console.error('Error uploading photo:', err);
      }
    }
  }, [uploadPhoto]);

  // Define TanStack Table columns
  const columns = useMemo(() => {
    return fields.map((field) => ({
      id: field.name,
      accessorKey: field.name,
      header: field.name,
      cell: ({ row, getValue, table }) => {
        const { editedData, handleFieldChange, handlePhotoUpload } = table.options.meta;
        const inf = row.original;
        const value = getValue();
        if (!field.editable) {
          return <span>{value}</span>;
        }
        if (field.type === 'select') {
          return (
            <select
              value={editedData[inf.id]?.[field.name] ?? value ?? ''}
              onChange={(e) => handleFieldChange(inf.id, field.name, e.target.value)}
              className="table-select"
            >
              <option value="">Select</option>
              {field.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );
        } else if (field.type === 'number') {
          return (
            <input
              type="number"
              step={field.step}
              value={editedData[inf.id]?.[field.name] ?? value ?? 0}
              onChange={(e) => handleFieldChange(inf.id, field.name, e.target.value)}
              className="table-input"
            />
          );
        } else if (field.type === 'text') {
          return (
            <input
              type="text"
              value={editedData[inf.id]?.[field.name] ?? value ?? ''}
              onChange={(e) => handleFieldChange(inf.id, field.name, e.target.value)}
              className={`table-input ${field.name === 'name' ? 'name-column' : ''}`}
            />
          );
        } else if (field.type === 'photo') {
          return (
            <div>
              {inf.photo_url && (
                <img
                  src={inf.photo_url}
                  alt="Profile"
                  style={{ width: 50, height: 50, objectFit: 'cover', marginRight: 10 }}
                />
              )}
              <input
                type="file"
                onChange={(e) => handlePhotoUpload(inf.id, e.target.files[0])}
              />
            </div>
          );
        }
        return null;
      },
    }));
  }, [fields]); // Only depend on fields since other dependencies are accessed via meta

  // Initialize TanStack Table instance with meta
  const table = useReactTable({
    data: influencers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    meta: { editedData, handleFieldChange, handlePhotoUpload },
  });

  // Authentication screen
  if (!isAuthenticated) {
    return (
      <div>
        <TopBar />
        <div className="auth-container">
          <h1>Admin Access</h1>
          <p>Please enter the admin password:</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
          />
          <button onClick={handlePasswordSubmit} className="auth-button">
            Submit
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div>
        <TopBar />
        <div className="admin-container">
          <h1>Loading...</h1>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div>
        <TopBar />
        <div className="admin-container">
          <h1>Error: {error}</h1>
        </div>
        <Footer />
      </div>
    );
  }

  // Main admin interface with TanStack Table
  return (
    <div>
      <TopBar />
      <div className="admin-container">
        <h1>Influencer Management</h1>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <div className="table-container">
          <table className="influencer-table">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={row.original.height > 0 ? 'row-with-height' : ''}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cell.column.id === 'name' ? 'name-column' : ''}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasUnsavedChanges && (
          <div className="save-container">
            <button onClick={handleSaveChanges} className="save-button">
              Save Changes
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Admin;