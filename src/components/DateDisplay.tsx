'use client';

interface DateDisplayProps {
  dateString: string;
}

export default function DateDisplay({ dateString }: DateDisplayProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    
    // デバッグログ
    console.log('Original dateStr:', dateStr);
    console.log('Parsed date:', date.toISOString());
    console.log('Current time:', now.toISOString());
    
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return diffInMinutes < 1 ? 'たった今' : `${diffInMinutes}分前`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}時間前`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}日前`;
    } else {
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
  };

  return (
    <span style={{
      fontSize: '12px',
      color: '#999',
      fontStyle: 'italic'
    }}>
      {formatDate(dateString)}
    </span>
  );
}