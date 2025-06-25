'use client';

interface HighlightTextProps {
  text: string;
  searchQuery: string;
}

export default function HighlightText({ text, searchQuery }: HighlightTextProps) {
  if (!searchQuery.trim()) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) => 
        regex.test(part) ? (
          <mark 
            key={index} 
            style={{ 
              backgroundColor: '#ffeb3b', 
              color: '#000',
              padding: '1px 2px',
              borderRadius: '2px',
              fontWeight: 'bold'
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
}