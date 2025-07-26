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
import React from 'react';

export default function Header({
  theme,
  onToggleTheme,
  onToggleNotes,
  isNotesPanelVisible,
  onToggleHistory,
  isHistoryPanelVisible,
  isLoggedIn,
  onLogin,
  onLogout,
  isLoadingVideo,
  onToggleSidebar,
  onNewVideoClick,
}: {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onToggleNotes: () => void;
  isNotesPanelVisible: boolean;
  onToggleHistory: () => void;
  isHistoryPanelVisible: boolean;
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  isLoadingVideo: boolean;
  onToggleSidebar: () => void;
  onNewVideoClick: () => void;
}) {
  return (
    <header className="appHeader">
      <div className="headerTitle">
        <button
          className="button menuButton"
          onClick={onToggleSidebar}
          aria-label="Toggle tools menu">
          <span className="icon">menu</span>
        </button>
        <h1>VidLense AI</h1>
        {isLoadingVideo && <div className="header-spinner"></div>}
      </div>
      <div className="headerActions">
        <button
          onClick={onNewVideoClick}
          className="button"
          disabled={isLoadingVideo}
          aria-label="Upload a new video">
          <span className="icon">upload_file</span>
          <span className="button-label">New Video</span>
        </button>

        <button
          onClick={onToggleNotes}
          className={c('notesToggle', 'button', {
            active: isNotesPanelVisible,
          })}
          aria-label="Toggle notes panel">
          <span className="icon">description</span>
          <span className="button-label">My Notes</span>
        </button>

        {isLoggedIn && (
          <button
            onClick={onToggleHistory}
            className={c('historyToggle', 'button', {
              active: isHistoryPanelVisible,
            })}
            aria-label="Toggle learning history panel">
            <span className="icon">history</span>
            <span className="button-label">Learning History</span>
          </button>
        )}

        <button
          onClick={onToggleTheme}
          className="button"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          <span className="icon">
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </span>
          <span className="button-label">
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </button>
        {isLoggedIn ? (
          <button onClick={onLogout} className="button">
            <span className="icon">logout</span>
            <span className="button-label">Logout</span>
          </button>
        ) : (
          <button onClick={onLogin} className="button login-button">
            <span className="icon">login</span>
            <span className="button-label">
              Login for tracking your learning history!
            </span>
          </button>
        )}
      </div>
    </header>
  );
}