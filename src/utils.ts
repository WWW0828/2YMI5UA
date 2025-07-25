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

export const timeToSecs = (timecode) => {
  if (!timecode) return 0;
  const split = timecode.split(':').map(parseFloat);

  return split.length === 2
    ? split[0] * 60 + split[1]
    : split[0] * 3600 + split[1] * 60 + split[2];
};

export const formatTime = (t) => {
  if (isNaN(t) || t === 0) return '0:00';
  const minutes = Math.floor(t / 60);
  const seconds = Math.floor(t % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
};
