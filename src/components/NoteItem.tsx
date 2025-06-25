'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faEdit, faTrash, faSave, faTimes, faStar, faImage, faPlus } from '@fortawesome/free-solid-svg-icons';
import HighlightText from './HighlightText';
import DateDisplay from './DateDisplay';

interface NoteImage {
  id: number;
  note_id: number;
  image_url: string;
  filename: string;
  created_at: string;
}

interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
  images?: NoteImage[];
}

interface NoteItemProps {
  note: Note;
  isEditing: boolean;
  searchQuery?: string;
  onEdit: (id: number) => void;
  onSave: (id: number, title: string, content: string) => Promise<void>;
  onDelete: (id: number) => void;
  onCopy: (text: string) => void;
  onToggleFavorite: (id: number) => void;
  onRefresh: () => void;
}

export default function NoteItem({ 
  note, 
  isEditing, 
  searchQuery = '',
  onEdit, 
  onSave, 
  onDelete, 
  onCopy,
  onToggleFavorite,
  onRefresh
}: NoteItemProps) {
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);
  const [isToggling, setIsToggling] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Reset states when editing mode changes or note images change
  useEffect(() => {
    if (isEditing) {
      setEditTitle(note.title);
      setEditContent(note.content);
      setImagesToDelete([]);
    } else {
      // Clear deletion list when exiting edit mode
      setImagesToDelete([]);
    }
  }, [isEditing, note.title, note.content]);

  // Clear deletion list when exiting edit mode
  useEffect(() => {
    if (!isEditing && !isSaving) {
      // Clear deletion list when not in edit mode and not saving
      setImagesToDelete([]);
    }
  }, [isEditing, isSaving]);

  const pastelColors = [
    '#FFE5E5', '#E5F3FF', '#E5FFE5', '#FFF5E5', '#F0E5FF',
    '#FFE5F5', '#E5FFFF', '#F5FFE5', '#FFE5EC', '#E5E5FF'
  ];
  
  const backgroundColor = pastelColors[note.id % pastelColors.length];

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Store images to delete before clearing the list
      const imagesToDeleteIds = [...imagesToDelete];
      
      // Optimistic UI: immediately apply changes locally
      // Clear deletion list first (optimistic)
      setImagesToDelete([]);
      
      // Save note content
      await onSave(note.id, editTitle, editContent);
      
      // Delete selected images in background
      const deletePromises = imagesToDeleteIds.map(imageId => 
        fetch(`/api/notes/images?id=${imageId}`, {
          method: 'DELETE',
        }).catch(error => {
          console.error('Error deleting image:', error);
          // In case of error, could revert optimistic changes here
        })
      );
      
      // Wait for all deletions to complete in background
      await Promise.all(deletePromises);
      
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(note.title);
    setEditContent(note.content);
    setImagesToDelete([]);
    onEdit(note.id);
  };

  const handleToggleFavorite = async () => {
    setIsToggling(true);
    try {
      await onToggleFavorite(note.id);
    } finally {
      setIsToggling(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('noteId', note.id.toString());
      formData.append('image', file);

      const response = await fetch('/api/notes/images', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Image uploaded successfully');
      onRefresh(); // Refresh notes to show new image
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleImageDelete = (imageId: number) => {
    setImagesToDelete(prev => [...prev, imageId]);
  };

  const handleCopyWithImages = () => {
    let copyText = note.content;
    
    if (note.images && note.images.length > 0) {
      copyText += '\n\n';
      note.images.forEach((image) => {
        // Extract filename without extension from the image URL
        const filename = image.image_url.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
        copyText += `https://litenote-silk.vercel.app/image/${filename}\n`;
      });
    }
    
    onCopy(copyText);
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
          
          {/* 添付画像の表示 - テキストエリア直下 */}
          {note.images && note.images.filter(image => !imagesToDelete.includes(image.id)).length > 0 && (
            <div style={{ marginTop: '15px', marginBottom: '15px' }}>
              <div style={{
                fontSize: '14px',
                color: '#1976d2',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px'
              }}>
                <FontAwesomeIcon icon={faImage} />
                <span>添付画像: {note.images.filter(image => !imagesToDelete.includes(image.id)).length}枚</span>
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '15px'
              }}>
                {note.images.filter(image => !imagesToDelete.includes(image.id)).map((image) => (
                  <div key={image.id} style={{ 
                    position: 'relative',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '10px',
                    backgroundColor: '#f9f9f9',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      width: '100%',
                      minHeight: '150px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      borderRadius: '4px',
                      backgroundColor: 'white'
                    }}>
                      <img
                        src={image.image_url}
                        alt={image.filename}
                        loading="lazy"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '300px',
                          objectFit: 'contain',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                    <button
                      onClick={() => handleImageDelete(image.id)}
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        background: 'rgba(220, 53, 69, 0.8)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                      title={`${image.filename}を削除`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="note-buttons">
            <label className="image-upload-btn" style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 12px',
              backgroundColor: isUploading ? '#999' : '#17a2b8',
              color: 'white',
              borderRadius: '8px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              border: 'none',
              transition: 'background-color 0.3s'
            }}>
              <FontAwesomeIcon icon={isUploading ? faTimes : faImage} />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
                style={{ display: 'none' }}
              />
            </label>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, flex: 1 }}>
              <HighlightText text={note.title} searchQuery={searchQuery} />
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleToggleFavorite}
                disabled={isToggling}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: isToggling ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  color: isToggling ? '#999' : (note.is_favorite ? '#ffc107' : '#ddd'),
                  padding: '2px',
                  transition: 'color 0.2s, transform 0.1s',
                  transform: isToggling ? 'scale(1.2)' : 'scale(1)',
                  opacity: isToggling ? 0.7 : 1
                }}
                title={isToggling ? '処理中...' : (note.is_favorite ? 'お気に入りから削除' : 'お気に入りに追加')}
              >
                <FontAwesomeIcon 
                  icon={faStar} 
                  style={{
                    animation: isToggling ? 'pulse 0.5s infinite alternate' : 'none'
                  }}
                />
              </button>
              <DateDisplay dateString={note.updated_at} />
            </div>
          </div>
          <p>
            <HighlightText text={note.content} searchQuery={searchQuery} />
          </p>
          
          {/* Images display */}
          {note.images && note.images.filter(image => !imagesToDelete.includes(image.id)).length > 0 && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
              gap: '15px', 
              marginTop: '15px',
              marginBottom: '15px'
            }}>
              {note.images.filter(image => !imagesToDelete.includes(image.id)).map((image) => (
                <div key={image.id} style={{ 
                  position: 'relative',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '10px',
                  backgroundColor: '#f9f9f9',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: '100%',
                    minHeight: '150px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderRadius: '4px',
                    backgroundColor: 'white'
                  }}>
                    <img
                      src={image.image_url}
                      alt={image.filename}
                      loading="lazy"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        objectFit: 'contain',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                  <button
                    onClick={() => handleImageDelete(image.id)}
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      background: 'rgba(220, 53, 69, 0.8)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: isEditing ? 'block' : 'none'
                    }}
                    title={`${image.filename}を削除`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="note-buttons">
            <button onClick={handleCopyWithImages} className="copy-btn">
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