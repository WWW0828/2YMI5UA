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
import {useCallback, useEffect, useRef, useState} from 'react';
import {
  generateContent,
  getExplanationForNote,
  shortenText,
  translateTexts,
  uploadFile,
} from './api';
import Flashcards from './Flashcards.jsx';
import functions from './functions';
import Header from './Header.jsx';
import HistoryPanel from './HistoryPanel.jsx';
import modes from './modes';
import NotesPanel from './NotesPanel.jsx';
import Quiz from './Quiz.jsx';
import Toast from './Toast.jsx';
import {formatTime, timeToSecs} from './utils';
import VideoPlayer from './VideoPlayer.jsx';
import MarkdownRenderer from './MarkdownRenderer.tsx';

interface Timecode {
  time: string;
  text?: string;
  objects?: string[];
  value?: number;
  translatedText?: string;
}

export interface Note {
  id: number;
  time: number;
  text: string;
  response: string | null;
  isLoadingResponse: boolean;
}

export interface LearningHistory {
  [videoId: string]: {
    fileName: string;
    watchProgress?: number;
    watchedRanges?: [number, number][];
    quizScore?: {
      score: number;
      total: number;
    };
    flashcardMastery?: {[term: string]: number};
  };
}

export default function App() {
  const [vidUrl, setVidUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [timecodeList, setTimecodeList] = useState<Timecode[] | null>(null);
  const [quizData, setQuizData] = useState(null);
  const [flashcardData, setFlashcardData] = useState(null);
  const [requestedTimecode, setRequestedTimecode] = useState(null);
  const [selectedMode, setSelectedMode] = useState(Object.keys(modes)[0]);
  const [activeMode, setActiveMode] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [isShortening, setIsShortening] = useState(false);
  const [isSummaryShortened, setIsSummaryShortened] = useState(false);
  const [originalTimecodeList, setOriginalTimecodeList] = useState<
    Timecode[] | null
  >(null);
  const [originalActiveMode, setOriginalActiveMode] = useState<
    string | undefined
  >(undefined);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  );
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [isTranslating, setIsTranslating] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auth and Learning History State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [learningHistory, setLearningHistory] = useState<LearningHistory>(
    () => {
      const savedHistory = localStorage.getItem('learningHistory');
      return savedHistory ? JSON.parse(savedHistory) : {};
    },
  );

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('learningHistory', JSON.stringify(learningHistory));
  }, [learningHistory]);

  // This effect triggers translation automatically after the script is fetched.
  useEffect(() => {
    const autoTranslate = async () => {
      if (!timecodeList || timecodeList.length === 0 || !file) {
        return;
      }
      setIsTranslating(true);
      try {
        const originalTexts = timecodeList.map((item) => item.text);
        const translatedTexts = await translateTexts(
          originalTexts,
          targetLanguage,
        );
        const updatedTimecodeList = timecodeList.map((item, index) => ({
          ...item,
          translatedText: translatedTexts[index],
        }));
        setTimecodeList(updatedTimecodeList);
      } catch (e) {
        console.error('Auto-translation failed:', e);
        setToastMessage('Could not automatically translate the script.');
      } finally {
        setIsTranslating(false);
      }
    };

    if (
      activeMode === 'Script/Translation' &&
      !isLoading &&
      timecodeList &&
      timecodeList.length > 0 &&
      // Only run if no translation exists yet
      timecodeList.every((item) => item.translatedText === undefined)
    ) {
      autoTranslate();
    }
  }, [activeMode, isLoading, timecodeList, targetLanguage, file]);

  const scrollRef = useRef<HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadCancellationRef = useRef(false);
  const generationCancellationRef = useRef({isCancelled: false});

  const modeDefinition = modes[selectedMode];
  const isCustomMode = !!modeDefinition?.isCustom;
  const hasSubMode = isCustomMode;

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleToggleNotes = () => {
    if (isLoggedIn && showHistoryPanel) setShowHistoryPanel(false);
    setShowNotesPanel(!showNotesPanel);
  };

  const handleToggleHistory = () => {
    if (showNotesPanel) setShowNotesPanel(false);
    setShowHistoryPanel(!showHistoryPanel);
  };

  const handleToggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const setTimecodes = ({timecodes}) => {
    const newTimecodes = timecodes.map((t) => ({
      ...t,
      text: t.text?.replaceAll("\\'", "'"),
    }));
    setTimecodeList((prev) => (prev ? [...prev, ...newTimecodes] : newTimecodes));
  };


  const onModeSelect = async (mode) => {
    if (!file) {
      setToastMessage('Please upload a video to start.');
      return;
    }

    const modeDef = modes[mode];
    if (!modeDef.isCustom) {
      setCustomPrompt('');
    }

    setIsSummaryShortened(false);
    setOriginalTimecodeList(null);
    setOriginalActiveMode(undefined);
    generationCancellationRef.current.isCancelled = false;
    setTimecodeList(null);
    setQuizData(null);
    setFlashcardData(null);
    setActiveMode(mode);
    setIsLoading(true);

    const fnMap = {
      set_timecodes: setTimecodes,
      set_timecodes_with_translation: setTimecodes,
      set_quiz: ({questions}) => setQuizData(questions),
      set_flashcards: ({cards}) => setFlashcardData(cards),
    };

    try {
      let prompt: string;
      if (modeDef.isCustom && typeof modeDef.prompt === 'function') {
        prompt = modeDef.prompt(customPrompt);
      } else {
        prompt = modeDef.prompt as string;
      }

      const resp = await generateContent(prompt, functions(fnMap), file);

      if (generationCancellationRef.current.isCancelled) {
        return;
      }
      
      if (resp.functionCalls) {
        for (const call of resp.functionCalls) {
            if (fnMap[call.name]) {
              fnMap[call.name](call.args);
            }
        }
      } else if (resp.text) {
        // Fallback to display text if no function call is made
        setTimecodeList([{ time: "0:00", text: resp.text }]);
      }
    } catch (e) {
      console.error('Error during content generation:', e);
      if (!generationCancellationRef.current.isCancelled) {
        setToastMessage('An error occurred while generating content.');
      }
    } finally {
      if (!generationCancellationRef.current.isCancelled) {
        setIsLoading(false);
        scrollRef.current?.scrollTo({top: 0});
      }
    }
  };

  const processAndUploadFile = async (selectedFile: File) => {
    if (!selectedFile) return;

    setIsSummaryShortened(false);
    setOriginalTimecodeList(null);
    setOriginalActiveMode(undefined);
    uploadCancellationRef.current = false;
    setIsLoadingVideo(true);
    setVidUrl(URL.createObjectURL(selectedFile));
    setCurrentVideoId(selectedFile.name);
    setTimecodeList(null);
    setQuizData(null);
    setFlashcardData(null);
    setNotes([]);
    setActiveMode(undefined);
    setVideoError(false);
    setFile(null); // Reset file state while new one is processing

    try {
      const res = await uploadFile(selectedFile);
      if (!uploadCancellationRef.current) {
        setFile(res);
      }
    } catch (e) {
      if (!uploadCancellationRef.current) {
        setVideoError(true);
      }
    } finally {
      if (!uploadCancellationRef.current) {
        setIsLoadingVideo(false);
      }
    }
  };

  const handleCancelUpload = () => {
    uploadCancellationRef.current = true;
    setVidUrl(null);
    setIsLoadingVideo(false);
    setVideoError(false);
    setFile(null);
    setCurrentVideoId(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processAndUploadFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processAndUploadFile(selectedFile);
    }
    // Reset the input value to allow re-uploading the same file
    if (e.target) {
      e.target.value = '';
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  const handleNewVideoClick = () => {
    triggerFileSelect();
  };

  const handleStopGenerating = () => {
    generationCancellationRef.current.isCancelled = true;
    setIsLoading(false);
    setToastMessage('Content generation stopped.');
  };

  const handleTranslate = async () => {
    if (!timecodeList || timecodeList.length === 0) return;

    setIsTranslating(true);
    const originalTexts = timecodeList.map((item) => item.text);

    try {
      const translatedTexts = await translateTexts(
        originalTexts,
        targetLanguage,
      );
      const updatedTimecodeList = timecodeList.map((item, index) => ({
        ...item,
        translatedText: translatedTexts[index],
      }));
      setTimecodeList(updatedTimecodeList);
    } catch (e) {
      console.error('Translation failed', e);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleToggleShorten = async () => {
    if (isSummaryShortened) {
      // If already shortened, expand back to the original content
      setTimecodeList(originalTimecodeList);
      setActiveMode(originalActiveMode);
      setOriginalTimecodeList(null);
      setOriginalActiveMode(undefined);
      setIsSummaryShortened(false);
    } else {
      // If not shortened, proceed to shorten the text
      if (!timecodeList) return;

      setOriginalTimecodeList(timecodeList); // Save the original content
      setOriginalActiveMode(activeMode); // Save the original mode
      setIsShortening(true);
      scrollRef.current?.scrollTo({top: 0});
      try {
        const fullText = timecodeList.map((item) => item.text ?? '').join('\n');
        if (!fullText.trim()) {
          setToastMessage('There is no text to shorten.');
          setOriginalTimecodeList(null); // Clean up if nothing to do
          setOriginalActiveMode(undefined);
          return;
        }
        const shortenedText = await shortenText(fullText);
        setTimecodeList([{time: '0:00', text: shortenedText}]);
        setActiveMode('Summary'); // Set mode to Summary for correct rendering
        setIsSummaryShortened(true); // Mark as shortened
      } catch (e) {
        console.error('Failed to shorten text:', e);
        setToastMessage('An error occurred while shortening the text.');
        setOriginalTimecodeList(null); // Clean up on error
        setOriginalActiveMode(undefined);
      } finally {
        setIsShortening(false);
      }
    }
  };

  const handleAddNote = (noteText: string) => {
    const newNote: Note = {
      id: Date.now(),
      time: currentVideoTime,
      text: noteText,
      response: null,
      isLoadingResponse: false,
    };
    setNotes((prevNotes) => [...prevNotes, newNote]);
  };

  const handleNoteAction = async (
    noteId: number,
    action: 'explain' | 'summarize' | 'translate',
    language?: string,
  ) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note || !file) return;

    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? {...n, isLoadingResponse: true, response: null} : n,
      ),
    );

    try {
      const responseText = await getExplanationForNote(
        action,
        note,
        file,
        language,
      );
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId ? {...n, response: responseText} : n,
        ),
      );
    } catch (e) {
      console.error(`Failed to ${action} note:`, e);
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? {...n, response: `Error: Could not ${action} note.`}
            : n,
        ),
      );
    } finally {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId ? {...n, isLoadingResponse: false} : n,
        ),
      );
    }
  };

  const handleWatchProgress = useCallback(
    (watchedDuration: number, totalDuration: number) => {
      if (!currentVideoId || !isLoggedIn) return;
      const progress = totalDuration > 0 ? watchedDuration / totalDuration : 0;
      setLearningHistory((prev) => ({
        ...prev,
        [currentVideoId]: {
          ...prev[currentVideoId],
          fileName: currentVideoId,
          watchProgress: progress,
        },
      }));
    },
    [currentVideoId, isLoggedIn],
  );

  const handleQuizComplete = useCallback(
    (score: number, total: number) => {
      if (!currentVideoId || !isLoggedIn) return;
      setLearningHistory((prev) => ({
        ...prev,
        [currentVideoId]: {
          ...prev[currentVideoId],
          fileName: currentVideoId,
          quizScore: {score, total},
        },
      }));
    },
    [currentVideoId, isLoggedIn],
  );

  const handleCardFlip = useCallback(
    (word: string) => {
      if (!currentVideoId || !isLoggedIn) return;
      setLearningHistory((prev) => {
        const videoHistory = prev[currentVideoId] || {fileName: currentVideoId};
        const flashcardMastery = videoHistory.flashcardMastery || {};
        return {
          ...prev,
          [currentVideoId]: {
            ...videoHistory,
            flashcardMastery: {
              ...flashcardMastery,
              [word]: (flashcardMastery[word] || 0) + 1,
            },
          },
        };
      });
    },
    [currentVideoId, isLoggedIn],
  );

  const handleClearHistory = () => {
    setLearningHistory({});
  };

  const shouldShowTranslation =
    timecodeList && activeMode === 'Script/Translation';

  const showPanel = showNotesPanel || (isLoggedIn && showHistoryPanel);
  const panelType = isLoggedIn && showHistoryPanel ? 'history' : 'notes';

  return (
    <div className={c('appWrapper', theme)}>
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onToggleNotes={handleToggleNotes}
        isNotesPanelVisible={showNotesPanel}
        onToggleHistory={handleToggleHistory}
        isHistoryPanelVisible={showHistoryPanel}
        isLoggedIn={isLoggedIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoadingVideo={isLoadingVideo}
        onToggleSidebar={handleToggleSidebar}
        onNewVideoClick={handleNewVideoClick}
      />
      <main
        className={c({
          notesOpen: showPanel,
          historyOpen: showPanel && panelType === 'history',
          sidebarOpen: showSidebar,
        })}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}>
        <div className="mainGrid">
          <div
            className={c('tools', {
              inactive: !file || isLoading,
            })}>
            <div className={c('modeSelector', {hide: !showSidebar})}>
              {file ? (
                <>
                  <div>
                    <h2>Tools</h2>
                    <div className="modeList">
                      {Object.entries(modes).map(([id, {emoji, isCustom}]) =>
                        isCustom ? null : (
                          <button
                            key={id}
                            className={c('button', {active: activeMode === id})}
                            onClick={() => onModeSelect(id)}>
                            <span className="icon">{emoji}</span>
                            {id}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                  <div>
                    <h2>Q/A Bot</h2>
                    <div className="modeList">
                      {Object.entries(modes).map(([id, {emoji, isCustom}]) =>
                        isCustom ? (
                          <>
                            <textarea
                              placeholder="Ask a question about the video..."
                              rows={4}
                              value={customPrompt}
                              onChange={(e) => setCustomPrompt(e.target.value)}
                            />
                            <button
                              key={id}
                              className="button generateButton"
                              disabled={!customPrompt}
                              onClick={() => onModeSelect(id)}>
                              <span className="icon">{emoji}</span>
                              Ask
                            </button>
                          </>
                        ) : null,
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="modeSelectorPlaceholder">
                  <div>
                    <div
                      className="placeholder-item"
                      style={{width: '80%', marginBottom: '15px'}}></div>
                    <div
                      className="placeholder-item"
                      style={{marginBottom: '10px'}}></div>
                    <div
                      className="placeholder-item"
                      style={{marginBottom: '10px'}}></div>
                    <div
                      className="placeholder-item"
                      style={{marginBottom: '10px'}}></div>
                  </div>
                  <div>
                    <div
                      className="placeholder-item"
                      style={{width: '60%', marginBottom: '15px'}}></div>
                    <div
                      className="placeholder-item"
                      style={{height: '80px', marginBottom: '10px'}}></div>
                    <div
                      className="placeholder-item generate"
                      style={{marginBottom: '10px'}}></div>
                  </div>
                </div>
              )}
            </div>
            <button
              className="collapseButton"
              onClick={handleToggleSidebar}
              aria-label={showSidebar ? 'Collapse sidebar' : 'Expand sidebar'}>
              <span className="icon">
                {showSidebar ? 'chevron_left' : 'chevron_right'}
              </span>
            </button>
            <section className="output" ref={scrollRef}>
              {isLoading || isShortening ? (
                <div className="loading">
                  <p>{isLoading ? 'Analyzing video...' : 'Shortening...'}</p>
                  Thinking<span>...</span>
                  {isLoading && (
                    <button
                      className="button stop-generating-button"
                      onClick={handleStopGenerating}>
                      Stop Generating
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {shouldShowTranslation && (
                    <div className="translationControls">
                      <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        disabled={isTranslating}>
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Japanese">Japanese</option>
                        <option value="Korean">Korean</option>
                        <option value="Mandarin Chinese">Mandarin Chinese</option>
                      </select>
                      <button
                        className="button"
                        onClick={handleTranslate}
                        disabled={isTranslating}>
                        {isTranslating ? 'Translating...' : 'Translate'}
                      </button>
                    </div>
                  )}
                  {timecodeList &&
                    timecodeList.length > 0 &&
                    activeMode === 'Summary' && (
                      <div className="output-actions">
                        <button
                          className="button"
                          onClick={handleToggleShorten}
                          aria-label={
                            isSummaryShortened
                              ? 'View original summary'
                              : 'Summarize output in three sentences'
                          }>
                          <span className="icon">
                            {isSummaryShortened ? 'expand_content' : 'compress'}
                          </span>
                          {isSummaryShortened ? 'View Original' : 'Shorten'}
                        </button>
                      </div>
                    )}
                  {timecodeList && (
                    <MarkdownRenderer
                      timecodeList={timecodeList}
                      jumpToTimecode={setRequestedTimecode}
                      activeMode={activeMode}
                      currentVideoTime={currentVideoTime}
                    />
                  )}
                  {quizData && (
                    <Quiz
                      data={quizData}
                      jumpToTimecode={setRequestedTimecode}
                      onQuizComplete={handleQuizComplete}
                    />
                  )}
                  {flashcardData && (
                    <Flashcards
                      data={flashcardData}
                      onCardFlip={handleCardFlip}
                    />
                  )}
                  {!activeMode && file && (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '20px',
                        opacity: 0.7,
                      }}>
                      <span
                        className="icon"
                        style={{fontSize: '48px', marginBottom: '10px'}}>
                        insights
                      </span>
                      <p>
                        Video analysis complete.
                        <br />
                        Select a tool from the left to get started.
                      </p>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
          <VideoPlayer
            url={vidUrl}
            timecodeList={timecodeList}
            requestedTimecode={requestedTimecode}
            jumpToTimecode={setRequestedTimecode}
            isLoadingVideo={isLoadingVideo}
            videoError={videoError}
            onUploadClick={triggerFileSelect}
            onTimeUpdate={setCurrentVideoTime}
            onWatchProgress={handleWatchProgress}
            onCancelUpload={handleCancelUpload}
          />
        </div>
        {showPanel && panelType === 'notes' && (
          <NotesPanel
            isOpen={showNotesPanel}
            onClose={handleToggleNotes}
            notes={notes}
            onAddNote={handleAddNote}
            onNoteAction={handleNoteAction}
            jumpToTimecode={setRequestedTimecode}
            isDisabled={!file}
          />
        )}
        {showPanel && panelType === 'history' && (
          <HistoryPanel
            isOpen={showHistoryPanel}
            onClose={handleToggleHistory}
            historyData={learningHistory}
            onClearHistory={handleClearHistory}
          />
        )}
      </main>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{display: 'none'}}
        accept="video/*"
      />
      <div className="watermark">Made with Gemini</div>
    </div>
  );
}