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

import {FunctionDeclaration, GoogleGenAI, Type} from '@google/genai';
import {Note} from './App';
import {formatTime} from './utils';

const systemInstruction = `You are a helpful assistant for video analysis. When asked to perform a task, call the relevant function to provide the answer. IMPORTANT: If the data to be returned is large (e.g., a long script), you MUST make multiple function calls with smaller chunks of the data instead of one large call, to ensure all data is returned successfully.`;

const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

interface UploadedFile {
  name: string;
  mimeType: string;
  uri: string;
}

async function generateContent(
  prompt: string,
  functionDeclarations: FunctionDeclaration[],
  file: UploadedFile,
) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {text: prompt},
          {
            fileData: {
              mimeType: file.mimeType,
              fileUri: file.uri,
            },
          },
        ],
      },
    ],
    config: {
      systemInstruction,
      temperature: 0.5,
      tools: [{functionDeclarations}],
    },
  });

  return response;
}

async function uploadFile(file: File) {
  const blob = new Blob([file], {type: file.type});

  console.log('Uploading...');
  const uploadedFile = await ai.files.upload({
    file: blob,
    config: {
      displayName: file.name,
    },
  });
  console.log('Uploaded.');
  console.log('Getting...');
  let getFile = await ai.files.get({
    name: uploadedFile.name,
  });
  while (getFile.state === 'PROCESSING') {
    getFile = await ai.files.get({
      name: uploadedFile.name,
    });
    console.log(`current file status: ${getFile.state}`);
    console.log('File is still processing, retrying in 5 seconds');

    await new Promise((resolve) => {
      setTimeout(resolve, 5000);
    });
  }
  console.log(getFile.state);
  if (getFile.state === 'FAILED') {
    throw new Error('File processing failed.');
  }
  console.log('Done');
  return getFile;
}

async function translateTexts(
  texts: (string | undefined)[],
  targetLanguage: string,
): Promise<string[]> {
  const textsToTranslate = texts
    .map((text, index) => ({id: index, text: text || ''}))
    .filter((item) => item.text.trim() !== '');

  if (textsToTranslate.length === 0) {
    return texts.map(() => '');
  }

  const translationInstruction = `For each object in the input array, translate the 'text' property into ${targetLanguage}. The source language of the text should be auto-detected.
Return a single JSON object containing a "translations" property. This property should be an array of objects, where each object has the original 'id' and the 'translatedText'.
It is crucial that the output array in the "translations" property contains an entry for every object in the input, preserving all original IDs. If a text cannot be translated, return an empty string for 'translatedText' but keep the 'id'.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `${translationInstruction}\n\nInput:\n${JSON.stringify(
      textsToTranslate,
    )}`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          translations: {
            type: Type.ARRAY,
            description: 'An array of translation objects.',
            items: {
              type: Type.OBJECT,
              properties: {
                id: {
                  type: Type.INTEGER,
                  description: 'The original index of the text.',
                },
                translatedText: {
                  type: Type.STRING,
                  description: 'The translated text.',
                },
              },
              required: ['id', 'translatedText'],
            },
          },
        },
        required: ['translations'],
      },
      temperature: 0.1,
    },
  });

  try {
    const jsonStr = response.text.trim();
    const json = JSON.parse(jsonStr);

    if (json.translations && Array.isArray(json.translations)) {
      const translatedMap = new Map<number, string>();
      for (const item of json.translations) {
        if (
          typeof item.id === 'number' &&
          typeof item.translatedText === 'string'
        ) {
          translatedMap.set(item.id, item.translatedText);
        }
      }

      // Reconstruct the full array in the original order.
      const fullTranslatedTexts = texts.map((_, index) => {
        return translatedMap.get(index) || ''; // Return translation or an empty string
      });

      return fullTranslatedTexts;
    }

    console.error('Invalid format: "translations" array not found.', json);
    return texts.map(() => 'Translation failed.');
  } catch (e) {
    console.error('Failed to parse translation response:', e);
    return texts.map(() => 'Translation failed.');
  }
}

async function getExplanationForNote(
  action: 'explain' | 'summarize' | 'translate',
  note: Note,
  file: UploadedFile,
  language?: string,
): Promise<string> {
  let promptAction: string;
  switch (action) {
    case 'explain':
      promptAction = 'Explain in detail what is happening or being discussed.';
      break;
    case 'summarize':
      promptAction = 'Briefly summarize what is happening or being discussed.';
      break;
    case 'translate':
      promptAction = `Translate the spoken words into ${language || 'Spanish'}.`;
      break;
  }

  const prompt = `At the timestamp ${formatTime(
    note.time,
  )} in the video, the user left a note: "${
    note.text
  }". Based on the video content around this specific moment, please perform the following action: ${promptAction}. Provide a direct response to the user.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      role: 'user',
      parts: [
        {text: prompt},
        {
          fileData: {
            mimeType: file.mimeType,
            fileUri: file.uri,
          },
        },
      ],
    },
    config: {
      temperature: 0.3,
    },
  });

  return response.text;
}

async function shortenText(text: string): Promise<string> {
  const prompt = `Summarize the following text in exactly 3 sentences. Provide only the summary, without any introductory text.\n\nText to summarize:\n${text}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.2,
    },
  });

  return response.text;
}

export {
  generateContent,
  uploadFile,
  translateTexts,
  getExplanationForNote,
  shortenText,
};
