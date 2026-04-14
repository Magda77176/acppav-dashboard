'use client';

import { useEffect } from 'react';

export default function InterviewRedirect() {
  useEffect(() => {
    window.location.href = '/interview/index.html';
  }, []);
  
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0d1117', color: '#e6edf3',
      fontFamily: 'system-ui', fontSize: 16,
    }}>
      🎤 Chargement Interview Assistant...
    </div>
  );
}
