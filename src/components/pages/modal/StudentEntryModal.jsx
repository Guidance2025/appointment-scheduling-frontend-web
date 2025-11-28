import React from 'react';

const dummyEntries = [
  { date: '2024-06-05', mood: 7, notes: 'Feeling better today.' },
  { date: '2024-06-04', mood: 5, notes: 'Had a rough day.' },
  { date: '2024-06-02', mood: 4, notes: 'Missing classes due to illness.' },
];

export default function StudentEntryModal({ student, onClose }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-content">
        <header className="modal-header">
          <h2 id="modal-title">{student.name} - Mood Entries</h2>
          <button onClick={onClose} aria-label="Close modal">✖️</button>
        </header>

        <div className="modal-body">
          <ul className="entry-list">
            {dummyEntries.map(({ date, mood, notes }, i) => (
              <li key={i} className="entry-item">
                <strong>Date:</strong> {date} | <strong>Mood:</strong> {mood}/10
                <p><strong>Notes:</strong> {notes}</p>
              </li>
            ))}
          </ul>
          {dummyEntries.length === 0 && <p>No entries available.</p>}
        </div>
      </div>
    </div>
  );
}
