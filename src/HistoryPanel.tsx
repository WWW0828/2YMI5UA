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

import React from 'react';
import {LearningHistory} from './App';

export default function HistoryPanel({
  isOpen,
  onClose,
  historyData,
  onClearHistory,
}: {
  isOpen: boolean;
  onClose: () => void;
  historyData: LearningHistory;
  onClearHistory: () => void;
}) {
  if (!isOpen) {
    return null;
  }

  const historyItems = Object.values(historyData);

  const getRecommendations = (item: (typeof historyItems)[0]) => {
    const recommendations = [];
    if (item.watchProgress !== undefined && item.watchProgress < 0.9) {
      recommendations.push('Finish watching the video to not miss anything.');
    }
    if (item.quizScore) {
      const {score, total} = item.quizScore;
      if (score / total < 0.6) {
        recommendations.push(
          `Your quiz score was low (${score}/${total}). Try reviewing the key moments.`,
        );
      }
    }
    if (item.flashcardMastery) {
      const difficultTerms = Object.entries(item.flashcardMastery)
        .filter(([, count]) => count > 2)
        .map(([term]) => term);
      if (difficultTerms.length > 0) {
        recommendations.push(
          `Review these flashcards: ${difficultTerms.join(', ')}.`,
        );
      }
    }
    return recommendations;
  };

  return (
    <div className="historyPanel">
      <div className="historyHeader">
        <h2>Learning History</h2>
        <button
          onClick={onClearHistory}
          className="button"
          aria-label="Clear all learning history">
          Clear History
        </button>
        <button onClick={onClose} aria-label="Close history panel">
          <span className="icon">close</span>
        </button>
      </div>
      <div className="historyContent">
        {historyItems.length === 0 ? (
          <p style={{textAlign: 'center', opacity: 0.7, fontSize: '14px'}}>
            No history yet. Analyze a video to start tracking your progress!
          </p>
        ) : (
          historyItems.map((item, index) => {
            const recommendations = getRecommendations(item);
            return (
              <div key={index} className="historyItem">
                <h3>{item.fileName}</h3>
                {item.watchProgress !== undefined && (
                  <div className="progressItem">
                    <span className="icon">visibility</span>
                    <div className="progressBar">
                      <div
                        className="progressBarFill"
                        style={{width: `${item.watchProgress * 100}%`}}></div>
                    </div>
                    <span>{Math.round(item.watchProgress * 100)}%</span>
                  </div>
                )}
                {item.quizScore && (
                  <div className="progressItem">
                    <span className="icon">quiz</span>
                    <span>
                      Quiz Score: {item.quizScore.score} / {item.quizScore.total}
                    </span>
                  </div>
                )}
                {recommendations.length > 0 && (
                  <div className="recommendations">
                    <h4>Recommendations</h4>
                    {recommendations.map((rec, i) => (
                      <p key={i} className="recommendationItem">
                        {rec}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
