'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import NoteItem from '../components/NoteItem';

interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes');
      const data = await response.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setNotes([]);
    }
  };

  const addNote = async () => {
    try {
      const noteToAdd = {
        ...newNote,
        title: newNote.title.trim() || `ノート ${notes.length + 1}`
      };
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteToAdd),
      });
      const data = await response.json();
      setNotes([data, ...notes]);
      setNewNote({ title: '', content: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const deleteNote = async (id: number) => {
    if (window.confirm('このノートを削除しますか？')) {
      try {
        await fetch(`/api/notes?id=${id}`, {
          method: 'DELETE',
        });
        setNotes(notes.filter(note => note.id !== id));
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const updateNote = async (id: number, updatedNote: { title: string; content: string }) => {
    try {
      const response = await fetch(`/api/notes?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedNote),
      });
      const data = await response.json();
      setNotes(notes.map(note => note.id === id ? data : note));
      setEditingId(null);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyMessage('コピーしました！');
    setTimeout(() => setCopyMessage(''), 2000);
  };

  const handleEdit = (id: number) => {
    setEditingId(editingId === id ? null : id);
  };

  const handleSave = (id: number, title: string, content: string) => {
    updateNote(id, { title, content });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>LiteNote</h1>
        <button 
          className="add-button"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <FontAwesomeIcon icon={faPlus} /> Add Note
        </button>
      </header>

      {showAddForm && (
        <div className="add-form">
          <input
            type="text"
            placeholder="Note title"
            value={newNote.title}
            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
          />
          <textarea
            placeholder="Note content"
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
          />
          <div className="form-buttons">
            <button onClick={addNote}>Add</button>
            <button onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {copyMessage && (
        <div className="copy-message">
          {copyMessage}
        </div>
      )}

      <div className="notes-container">
        {notes.map(note => (
          <NoteItem
            key={note.id}
            note={note}
            isEditing={editingId === note.id}
            onEdit={handleEdit}
            onSave={handleSave}
            onDelete={deleteNote}
            onCopy={copyToClipboard}
          />
        ))}
      </div>
    </div>
  );
}