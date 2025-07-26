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

export interface Mode {
  emoji: string;
  prompt: string | ((input: string) => string);
  isList?: boolean;
  isCustom?: boolean;
}

const modes: Record<string, Mode> = {
  Summary: {
    emoji: '📄',
    prompt: `Generate a concise summary of the entire video content in a way that supports the student’s learning need. Including a focused summary tailored to the learning goal (no more than 300 words), Highlight key concepts, definitions, or steps that directly support the learning goal and 1–3 actionable takeaways or next steps for the learne if applicable. Call set_timecodes once with the full summary 
text and a timecode of "0:00". But do not show the time code, instead, organized your response paragraphs.`,
  },

  'Script/Translation': {
    emoji: '📝',
    prompt: `Your primary task is to generate a complete, time-coded script for the video in its original spoken language.
To do this, you must call the 'set_timecodes' function. For long videos, it is crucial that you make MULTIPLE calls to this function, sending chunks of the script in each call. This ensures the entire script can be processed without errors.
Each object in the 'timecodes' array you send to the function MUST contain:
1. 'time': The timestamp from the video.
2. 'text': The verbatim transcript from the video.`,
    isList: true,
  },

  'Key moments': {
    emoji: '🔑',
    prompt: `Generate bullet points for the video. Place each bullet point into an \
object sent to set_timecodes with the timecode of the bullet point in the video.`,
    isList: true,
  },

  Quiz: {
    emoji: '❓',
    prompt: `Generate a multiple choice quiz with 4-5 questions based on the video content. For each question provide 4 options and indicate the correct answer. Call set_quiz with the list of questions.`,
  },

  Flashcards: {
    emoji: '📇',
    prompt: `Your task is to create exactly 15 flashcards from the video.
1.  Analyze the video to identify 15 key terms or vocabulary words. These should be educational and relevant to the video's main topics. **Crucially, do not select the names of people or groups (like companies or organizations) as vocabulary words.**
2.  For each of the 15 items, create a flashcard object. Each object MUST strictly follow the schema for the 'set_flashcards' function.
3.  Each object must contain these properties: 'word', 'definition', and 'lang'.
4.  The 'furigana' property is OPTIONAL. Only include it if the word is Japanese and contains Kanji. Do not include it otherwise.
5.  After creating all 15 flashcard objects, use one or more calls to the 'set_flashcards' function to return them.`,
    isList: true,
  },

  'Q/A Bot': {
    emoji: '🤖',
    prompt: (input: string) => `You are a Q/A bot. Your task is to answer questions based *only* on the provided video content.
User's question: "${input}"
1. Analyze the video to find the answer.
2. If the answer is in the video, provide a concise response and the relevant timecode where the information can be found.
3. If the video **does not contain** information to answer the question, your response MUST be "The video does not contain such information." and the timecode should be "0:00".
4. Call the 'set_timecodes' function exactly once with your answer and the corresponding timecode.`,
    isCustom: true,
  },
};

export default modes;