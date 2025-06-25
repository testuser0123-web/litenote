import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faEdit, faTrash, faPlus, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import './App.css';

function App() {
  const [notes, setNotes] = useState([]);
  const [editingId, setEditingId] = useState(null);
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

  const deleteNote = async (id) => {
    if (window.confirm('このノートを削除しますか？')) {
      try {
        await fetch(`/api/notes/${id}`, {
          method: 'DELETE',
        });
        setNotes(notes.filter(note => note.id !== id));
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const updateNote = async (id, updatedNote) => {
    try {
      const response = await fetch(`/api/notes/${id}`, {
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopyMessage('コピーしました！');
    setTimeout(() => setCopyMessage(''), 2000);
  };

  const handleEdit = (id) => {
    setEditingId(editingId === id ? null : id);
  };

  const handleSave = (id, title, content) => {
    updateNote(id, { title, content });
  };

  return (
    <div className="App">
      <header className="App-header">
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

function NoteItem({ note, isEditing, onEdit, onSave, onDelete, onCopy }) {
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);
  
  const pastelColors = [
    '#FFE5E5', '#E5F3FF', '#E5FFE5', '#FFF5E5', '#F0E5FF',
    '#FFE5F5', '#E5FFFF', '#F5FFE5', '#FFE5EC', '#E5E5FF'
  ];
  
  const backgroundColor = pastelColors[note.id % pastelColors.length];

  const handleSave = () => {
    onSave(note.id, editTitle, editContent);
  };

  const handleCancel = () => {
    setEditTitle(note.title);
    setEditContent(note.content);
    onEdit(note.id);
  };

  return (
    <div className="note-item" style={{ backgroundColor }}>
      {isEditing ? (
        <div className="note-edit">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="edit-title"
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="edit-content"
          />
          <div className="note-buttons">
            <button onClick={handleSave} className="save-btn">
              <FontAwesomeIcon icon={faSave} />
            </button>
            <button onClick={handleCancel} className="cancel-btn">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>
      ) : (
        <div className="note-display">
          <h3>{note.title}</h3>
          <p>{note.content}</p>
          <div className="note-buttons">
            <button onClick={() => onCopy(note.content)} className="copy-btn">
              <FontAwesomeIcon icon={faCopy} />
            </button>
            <button onClick={() => onEdit(note.id)} className="edit-btn">
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button onClick={() => onDelete(note.id)} className="delete-btn">
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
