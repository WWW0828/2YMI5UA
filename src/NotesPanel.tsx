/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import c from 'classnames';
import {useState} from 'react';
import {Note} from './App';
import {formatTime} from './utils';

export default function NotesPanel({
  isOpen,
  onClose,
  notes,
  onAddNote,
  onNoteAction,
  jumpToTimecode,
  isDisabled,
}: {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onAddNote: (text: string) => void;
  onNoteAction: (
    noteId: number,
    action: 'explain' | 'summarize' | 'translate',
    language?: string,
  ) => void;
  jumpToTimecode: (timeInSecs: number) => void;
  isDisabled: boolean;
}) {
  const [newNoteText, setNewNoteText] = useState('');
  const [translationLanguage, setTranslationLanguage] = useState('Spanish');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNoteText.trim()) {
      onAddNote(newNoteText);
      setNewNoteText('');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={c('notesPanel', {disabled: isDisabled})}>
      <div className="notesHeader">
        <h2>My Notes</h2>
        <button onClick={onClose} aria-label="Close notes panel">
          <span className="icon">close</span>
        </button>
      </div>
      <div className="notesContent">
        {notes.length === 0 ? (
          <p style={{textAlign: 'center', opacity: 0.7, fontSize: '14px'}}>
            {isDisabled
              ? 'Upload a video to start taking notes.'
              : 'No notes yet. Start typing below!'}
          </p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="noteItem">
              <div className="noteHeader">
                <time
                  role="button"
                  onClick={() => jumpToTimecode(note.time)}
                  aria-label={`Jump to ${formatTime(note.time)}`}>
                  {formatTime(note.time)}
                </time>
              </div>
              <p className="noteText">{note.text}</p>
              <div className="noteActions">
                <button
                  className="button"
                  onClick={() => onNoteAction(note.id, 'explain')}
                  disabled={note.isLoadingResponse}>
                  Explain
                </button>
                <button
                  className="button"
                  onClick={() => onNoteAction(note.id, 'summarize')}
                  disabled={note.isLoadingResponse}>
                  Summarize
                </button>
                <button
                  className="button"
                  onClick={() =>
                    onNoteAction(note.id, 'translate', translationLanguage)
                  }
                  disabled={note.isLoadingResponse}>
                  Translate
                </button>
                <select
                  value={translationLanguage}
                  onChange={(e) => setTranslationLanguage(e.target.value)}
                  disabled={note.isLoadingResponse}
                  className="translationControls"
                  style={{
                    padding: '4px',
                    fontSize: '12px',
                    border: 'none',
                    borderRadius: '4px',
                  }}>
                  <option value="Spanish">ES</option>
                  <option value="French">FR</option>
                  <option value="German">DE</option>
                  <option value="Japanese">JA</option>
                </select>
              </div>
              {note.isLoadingResponse && (
                <div className="noteResponse">
                  <div className="loading">
                    Thinking<span>...</span>
                  </div>
                </div>
              )}
              {note.response && (
                <div className="noteResponse">{note.response}</div>
              )}
            </div>
          ))
        )}
      </div>
      <form className="addNoteForm" onSubmit={handleAddNote}>
        <textarea
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          placeholder="Take a timestamped note..."
          rows={3}
        />
        <button className="button" type="submit" disabled={!newNoteText.trim()}>
          Add Note
        </button>
      </form>
    </div>
  );
}
