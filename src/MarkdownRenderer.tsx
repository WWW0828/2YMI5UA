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
import React, {useEffect, useRef} from 'react';
import modes from './modes';
import {timeToSecs} from './utils';

interface Timecode {
  time: string;
  text?: string;
  objects?: string[];
  value?: number;
  translatedText?: string;
}

interface MarkdownRendererProps {
  timecodeList: Timecode[];
  jumpToTimecode: (timeInSecs: number) => void;
  activeMode?: string;
  currentVideoTime?: number;
}

export default function MarkdownRenderer({
  timecodeList,
  jumpToTimecode,
  activeMode,
  currentVideoTime = 0,
}: MarkdownRendererProps) {
  const activeItemRef = useRef<HTMLLIElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  if (!timecodeList || timecodeList.length === 0) {
    return null;
  }

  const modeDefinition = activeMode ? modes[activeMode] : undefined;

  const activeItemIndex =
    modeDefinition?.isList && currentVideoTime > 0
      ? timecodeList.findIndex((item, index) => {
          const startTime = timeToSecs(item.time);
          const nextItem = timecodeList[index + 1];
          const endTime = nextItem ? timeToSecs(nextItem.time) : Infinity;
          return currentVideoTime >= startTime && currentVideoTime < endTime;
        })
      : -1;

  useEffect(() => {
    // Manually scroll the container to keep the active item centered.
    // This provides more control than `scrollIntoView()` and prevents
    // the main window from scrolling.
    if (activeItemRef.current && listRef.current?.parentElement) {
      const element = activeItemRef.current;
      const container = listRef.current.parentElement as HTMLElement;

      const elementTop = element.offsetTop;
      const elementHeight = element.clientHeight;
      const containerHeight = container.clientHeight;

      const scrollTop =
        elementTop - containerHeight / 2 + elementHeight / 2;

      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth',
      });
    }
  }, [activeItemIndex]);

  if (activeMode === 'Summary') {
    return (
      <div className="summary">
        {timecodeList.map((item, index) => (
          <div key={index}>
            {item.text?.split('\n').map((paragraph, pIndex) => {
              if (paragraph.trim() === '') return null;
              return <p key={pIndex}>{paragraph}</p>;
            })}
          </div>
        ))}
      </div>
    );
  }

  if (modeDefinition?.isList) {
    return (
      <ul ref={listRef}>
        {timecodeList.map((item, index) => (
          <li
            key={index}
            className={c('outputItem', {
              'active-script-item': index === activeItemIndex,
            })}
            ref={index === activeItemIndex ? activeItemRef : null}>
            <div>
              <time
                role="button"
                onClick={() => jumpToTimecode(timeToSecs(item.time))}>
                {item.time}
              </time>
              <div className="text-wrapper">
                <p className="text">{item.text}</p>
                {item.translatedText && (
                  <span className="translatedText">{item.translatedText}</span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  // Default renderer for Q/A bot and others
  return (
    <div>
      {timecodeList.map((item, index) => (
        <div key={index} className="sentence">
          {item.time && item.time !== '0:00' && (
            <time
              role="button"
              onClick={() => jumpToTimecode(timeToSecs(item.time))}>
              {item.time}
            </time>
          )}
          <div className="text-wrapper">
            <span>{item.text}</span>
            {item.translatedText && (
              <span className="translatedText">{item.translatedText}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
