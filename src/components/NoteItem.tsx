'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faEdit, faTrash, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';

interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

interface NoteItemProps {
  note: Note;
  isEditing: boolean;
  onEdit: (id: number) => void;
  onSave: (id: number, title: string, content: string) => void;
  onDelete: (id: number) => void;
  onCopy: (text: string) => void;
}

export default function NoteItem({ 
  note, 
  isEditing, 
  onEdit, 
  onSave, 
  onDelete, 
  onCopy 
}: NoteItemProps) {
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