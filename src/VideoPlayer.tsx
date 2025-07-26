/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
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
import {CSSProperties, useCallback, useEffect, useMemo, useState} from 'react';
import {formatTime, timeToSecs} from './utils';

export default function VideoPlayer({
  url,
  timecodeList,
  requestedTimecode,
  isLoadingVideo,
  videoError,
  jumpToTimecode,
  onUploadClick,
  onTimeUpdate,
  onWatchProgress,
  onCancelUpload,
}) {
  const [video, setVideo] = useState(null);
  const [duration, setDuration] = useState(0);
  const [scrubberTime, setScrubberTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [currentCaption, setCurrentCaption] = useState(null);
  const currentSecs = duration * scrubberTime || 0;
  const currentPercent = scrubberTime * 100;
  const timecodeListReversed = useMemo(
    () => timecodeList?.toReversed(),
    [timecodeList],
  );

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  }, [isPlaying, video]);

  const updateDuration = () => setDuration(video.duration);

  const updateTime = () => {
    if (!video) return;
    if (!isScrubbing) {
      setScrubberTime(video.currentTime / video.duration);
    }

    if (onTimeUpdate) {
      onTimeUpdate(video.currentTime);
    }

    if (timecodeList) {
      setCurrentCaption(
        timecodeListReversed.find(
          (t) => timeToSecs(t.time) <= video.currentTime,
        )?.text,
      );
    }
  };

  const onPlay = () => setIsPlaying(true);
  const onPause = () => setIsPlaying(false);

  useEffect(() => {
    setScrubberTime(0);
    setIsPlaying(false);
  }, [url]);

  useEffect(() => {
    if (video && requestedTimecode !== null) {
      video.currentTime = requestedTimecode;
    }
  }, [video, requestedTimecode]);

  useEffect(() => {
    const onKeyPress = (e) => {
      if (
        e.target.tagName !== 'INPUT' &&
        e.target.tagName !== 'TEXTAREA' &&
        e.key === ' '
      ) {
        togglePlay();
      }
    };

    addEventListener('keypress', onKeyPress);

    return () => {
      removeEventListener('keypress', onKeyPress);
    };
  }, [togglePlay]);

  useEffect(() => {
    if (!video || !onWatchProgress) return;

    const interval = setInterval(() => {
      const {duration, played} = video;
      if (duration > 0 && played.length > 0) {
        let watchedDuration = 0;
        for (let i = 0; i < played.length; i++) {
          watchedDuration += played.end(i) - played.start(i);
        }
        onWatchProgress(watchedDuration, duration);
      }
    }, 5000); // Report every 5 seconds

    return () => clearInterval(interval);
  }, [video, onWatchProgress]);

  return (
    <div className="videoPlayer">
      {url ? (
        <>
          <div>
            <video
              src={url}
              ref={setVideo}
              onClick={togglePlay}
              preload="auto"
              crossOrigin="anonymous"
              onDurationChange={updateDuration}
              onTimeUpdate={updateTime}
              onPlay={onPlay}
              onPause={onPause}
            />

            {currentCaption && (
              <div className="videoCaption">{currentCaption}</div>
            )}
          </div>

          <div className="videoControls">
            <div className="videoScrubber">
              <input
                style={{'--pct': `${currentPercent}%`} as CSSProperties}
                type="range"
                min="0"
                max="1"
                value={scrubberTime || 0}
                step="0.000001"
                onChange={(e) => {
                  setScrubberTime(e.target.valueAsNumber);
                  video.currentTime = e.target.valueAsNumber * duration;
                }}
                onPointerDown={() => setIsScrubbing(true)}
                onPointerUp={() => setIsScrubbing(false)}
              />
            </div>
            <div className="timecodeMarkers">
              {timecodeList?.map(({time, text, value}, i) => {
                const secs = timeToSecs(time);
                const pct = (secs / duration) * 100;

                return (
                  <div
                    className="timecodeMarker"
                    key={i}
                    style={{left: `${pct}%`}}>
                    <div
                      className="timecodeMarkerTick"
                      onClick={() => jumpToTimecode(secs)}>
                      <div />
                    </div>
                    <div
                      className={c('timecodeMarkerLabel', {right: pct > 50})}>
                      <div>{time}</div>
                      <p>{value || text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="videoTime">
              <button>
                <span className="icon" onClick={togglePlay}>
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              {formatTime(currentSecs)} / {formatTime(duration)}
            </div>
          </div>
        </>
      ) : (
        <div className="emptyVideo">
          <div className="upload-cta">
            <span className="icon">upload_file</span>
            <p>
              {isLoadingVideo
                ? 'Processing video...'
                : videoError
                  ? 'Error processing video.'
                  : 'Drag and drop a video file to start'}
            </p>
            {!isLoadingVideo && !videoError && (
              <button className="button" onClick={onUploadClick}>
                Or Select Video File
              </button>
            )}
            {isLoadingVideo && (
              <button className="button cancel-button" onClick={onCancelUpload}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
