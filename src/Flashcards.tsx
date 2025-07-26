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

interface CardData {
  word: string;
  definition: string;
  lang: string;
  furigana?: string;
}

interface FlashcardProps {
  card: CardData;
  onCardFlip: (word: string) => void;
}

function Flashcard({card, onCardFlip}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (onCardFlip) {
      onCardFlip(card.word);
    }
  };

  const handlePronounce = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents the card from flipping back
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(card.word);
      utterance.lang = card.lang;
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('Text-to-speech not supported by this browser.');
      alert('Sorry, your browser does not support text-to-speech.');
    }
  };

  return (
    <div
      className={c('flashcard', {flipped: isFlipped})}
      onClick={handleFlip}
      role="button"
      aria-pressed={isFlipped}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleFlip();
        }
      }}>
      <div className="flashcardInner">
        <div className="flashcardFront" lang={card.lang}>
          <div className="flashcard-content">
            {card.furigana && <div className="furigana">{card.furigana}</div>}
            <div className="word">{card.word}</div>
          </div>
          <button
            className="pronounceButton"
            onClick={handlePronounce}
            aria-label={`Pronounce ${card.word}`}
            title={`Pronounce ${card.word}`}>
            <span className="icon">volume_up</span>
          </button>
        </div>
        <div className="flashcardBack">
          <p>{card.definition}</p>
        </div>
      </div>
    </div>
  );
}

interface FlashcardsProps {
  data: CardData[];
  onCardFlip: (word: string) => void;
}

export default function Flashcards({data, onCardFlip}: FlashcardsProps) {
  if (!data) return null;

  return (
    <div className="flashcardGrid">
      {data.map((card, i) => (
        <Flashcard key={i} card={card} onCardFlip={onCardFlip} />
      ))}
    </div>
  );
}