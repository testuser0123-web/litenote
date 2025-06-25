'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSignOutAlt, faStar, faImage } from '@fortawesome/free-solid-svg-icons';
import NoteItem from '../components/NoteItem';
import HighlightText from '../components/HighlightText';

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

export default function Home() {
  const { data: session, status } = useSession();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [newNoteImages, setNewNoteImages] = useState<File[]>([]);
  const [isUploadingNewNote, setIsUploadingNewNote] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  useEffect(() => {
    if (session) {
      fetchNotes();
    }
  }, [session]);

  useEffect(() => {
    let filtered = notes;
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(note => note.is_favorite);
    }
    
    setFilteredNotes(filtered);
  }, [notes, searchQuery, showFavoritesOnly]);

  if (status === 'loading') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        fontFamily: 'inherit',
        gap: '20px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        読み込み中...
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    const hasGoogleCredentials = process.env.NEXT_PUBLIC_HAS_GOOGLE_OAUTH === 'true';
    
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'inherit'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          textAlign: 'center',
          fontFamily: 'inherit'
        }}>
          <h1 style={{ marginBottom: '1rem', color: '#333', fontFamily: 'inherit' }}>LiteNote</h1>
          {hasGoogleCredentials ? (
            <>
              <p style={{ marginBottom: '2rem', color: '#666', fontFamily: 'inherit' }}>ログインしてノートを管理しましょう</p>
              <button
                onClick={() => {
                  console.log('Login button clicked');
                  signIn('google');
                }}
                style={{
                  backgroundColor: '#4285f4',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                Googleでログイン
              </button>
            </>
          ) : (
            <div>
              <p style={{ marginBottom: '1rem', color: '#666', fontFamily: 'inherit' }}>環境変数が設定されていません</p>
              <p style={{ marginBottom: '2rem', color: '#666', fontFamily: 'inherit', fontSize: '14px' }}>
                Google OAuthの設定が必要です
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes');
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('Unauthorized - user not logged in properly');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched notes:', data);
      const notesArray = Array.isArray(data) ? data : [];
      setNotes(notesArray);
      setFilteredNotes(notesArray);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setNotes([]);
      setFilteredNotes([]);
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
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Unauthorized - cannot add note');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const savedNote = await response.json();
      console.log('Added note:', savedNote);
      
      // Upload images if any
      if (newNoteImages.length > 0) {
        try {
          for (const file of newNoteImages) {
            const formData = new FormData();
            formData.append('noteId', savedNote.id.toString());
            formData.append('image', file);

            const imageResponse = await fetch('/api/notes/images', {
              method: 'POST',
              body: formData,
            });

            if (!imageResponse.ok) {
              console.error('Failed to upload image:', file.name);
            }
          }
          console.log('All images uploaded successfully');
        } catch (error) {
          console.error('Error uploading images:', error);
        }
      }
      
      setNewNote({ title: '', content: '' });
      setNewNoteImages([]);
      setShowAddForm(false);
      fetchNotes(); // Refresh to show new note with images
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const deleteNote = async (id: number) => {
    if (window.confirm('このノートを削除しますか？')) {
      try {
        const response = await fetch(`/api/notes?id=${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            console.error('Unauthorized - cannot delete note');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log('Deleted note:', id);
        setNotes(notes.filter(note => note.id !== id));
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const updateNote = async (id: number, updatedNote: { title: string; content: string }) => {
    try {
      // Find the current note to preserve image information
      const currentNote = notes.find(note => note.id === id);
      
      // Optimistic UI: immediately update local state while preserving images
      setNotes(notes.map(note => 
        note.id === id 
          ? { 
              ...note, 
              title: updatedNote.title, 
              content: updatedNote.content, 
              updated_at: new Date().toISOString(),
              // Preserve existing images
              images: currentNote?.images || []
            }
          : note
      ));
      setEditingId(null);
      
      // Then update server in background
      const response = await fetch(`/api/notes?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedNote),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Unauthorized - cannot update note');
          // Revert optimistic update on error
          fetchNotes();
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Updated note:', data);
      
      // Sync with server response for accuracy (including updated images)
      fetchNotes();
    } catch (error) {
      console.error('Error updating note:', error);
      // Revert optimistic update on error
      fetchNotes();
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

  const handleSave = async (id: number, title: string, content: string) => {
    await updateNote(id, { title, content });
  };

  const toggleFavorite = async (id: number) => {
    try {
      const response = await fetch('/api/notes/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Unauthorized - cannot toggle favorite');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedNote = await response.json();
      console.log('Toggled favorite:', updatedNote);
      
      // Update the note in both notes and filteredNotes
      setNotes(notes.map(note => note.id === id ? updatedNote : note));
      setFilteredNotes(filteredNotes.map(note => note.id === id ? updatedNote : note));
      
      // Show success feedback
      setCopyMessage(updatedNote.is_favorite ? 'お気に入りに追加しました！' : 'お気に入りから削除しました！');
      setTimeout(() => setCopyMessage(''), 1500);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setCopyMessage('エラーが発生しました');
      setTimeout(() => setCopyMessage(''), 1500);
    }
  };

  const handleNewNoteImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Add file to temporary list
    setNewNoteImages(prev => [...prev, file]);
    
    // Reset file input
    event.target.value = '';
  };

  const removeNewNoteImage = (index: number) => {
    setNewNoteImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="app">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1>LiteNote</h1>
          <span style={{ fontSize: '14px', color: '#666', fontFamily: 'inherit' }}>
            ようこそ、{session?.user?.name}さん
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="add-button"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <FontAwesomeIcon icon={faPlus} /> ノートを追加
          </button>
          <button
            onClick={() => signOut()}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'inherit'
            }}
          >
            <FontAwesomeIcon icon={faSignOutAlt} /> ログアウト
          </button>
        </div>
      </header>

      {showAddForm && (
        <div className="add-form">
          <input
            type="text"
            placeholder="ノートのタイトル"
            value={newNote.title}
            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
          />
          <textarea
            placeholder="ノートの内容"
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
          />
          
          {/* 添付画像の表示 - テキストエリア直下 */}
          {newNoteImages.length > 0 && (
            <div style={{
              marginTop: '8px',
              marginBottom: '10px',
              fontSize: '14px',
              color: '#1976d2',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FontAwesomeIcon icon={faImage} />
              <span>添付画像: {newNoteImages.length}枚</span>
              <span style={{ fontSize: '12px', color: '#666' }}>
                (保存後に表示されます)
              </span>
              <button
                onClick={() => setNewNoteImages([])}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc3545',
                  cursor: 'pointer',
                  fontSize: '12px',
                  marginLeft: '8px'
                }}
                title="すべての画像を削除"
              >
                ×すべて削除
              </button>
            </div>
          )}
          
          <div className="form-buttons">
            <button onClick={addNote}>追加</button>
            <button onClick={() => {
              setShowAddForm(false);
              setNewNote({ title: '', content: '' });
              setNewNoteImages([]);
            }}>キャンセル</button>
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 16px',
              backgroundColor: isUploadingNewNote ? '#999' : '#17a2b8',
              color: 'white',
              borderRadius: '8px',
              cursor: isUploadingNewNote ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              border: 'none',
              transition: 'background-color 0.3s'
            }}>
              <FontAwesomeIcon icon={faImage} />
              <input
                type="file"
                accept="image/*"
                onChange={handleNewNoteImageUpload}
                disabled={isUploadingNewNote}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      )}

      {copyMessage && (
        <div className="copy-message">
          {copyMessage}
        </div>
      )}

      {/* 検索ボックスとフィルタ */}
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto 20px auto',
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            placeholder="ノートを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '16px',
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
          {(filteredNotes.length !== notes.length || showFavoritesOnly) && (
            <span style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '14px',
              color: '#666',
              backgroundColor: 'white',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              {filteredNotes.length}/{notes.length}
            </span>
          )}
        </div>
        
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          style={{
            background: showFavoritesOnly ? '#ffc107' : 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '12px 16px',
            cursor: 'pointer',
            fontSize: '16px',
            color: showFavoritesOnly ? 'white' : '#666',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
          title={showFavoritesOnly ? 'すべてのノートを表示' : 'お気に入りのみ表示'}
        >
          <FontAwesomeIcon icon={faStar} />
          {showFavoritesOnly ? 'お気に入り' : 'すべて'}
        </button>
      </div>

      <div className="notes-container">
        {filteredNotes.map(note => (
          <NoteItem
            key={note.id}
            note={note}
            isEditing={editingId === note.id}
            searchQuery={searchQuery}
            onEdit={handleEdit}
            onSave={handleSave}
            onDelete={deleteNote}
            onCopy={copyToClipboard}
            onToggleFavorite={toggleFavorite}
            onRefresh={fetchNotes}
          />
        ))}
      </div>
    </div>
  );
}