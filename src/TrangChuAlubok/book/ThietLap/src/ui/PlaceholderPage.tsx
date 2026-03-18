'use client';
// ============================================================
// PlaceholderPage — Generic "coming soon" placeholder
// Used for D7 (Print Templates) and future tabs
// ============================================================

import React from 'react';
import { FiClock } from 'react-icons/fi';

export default function PlaceholderPage({ title, description }: { title: string; description: string }): React.ReactElement {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1e1e2e',
      gap: 12,
    }}>
      <FiClock size={40} style={{ color: '#45475a' }} />
      <h2 style={{ color: '#cdd6f4', fontSize: 18, fontWeight: 600, margin: 0 }}>{title}</h2>
      <p style={{ color: '#6c7086', fontSize: 13, margin: 0, maxWidth: 400, textAlign: 'center' }}>{description}</p>
      <span style={{ padding: '4px 12px', borderRadius: 4, backgroundColor: 'rgba(249,226,175,0.1)', color: '#f9e2af', fontSize: 12, fontWeight: 600 }}>
        Sắp ra mắt
      </span>
    </div>
  );
}
