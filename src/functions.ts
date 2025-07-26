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
import {FunctionDeclaration, Type} from '@google/genai';

const functions: FunctionDeclaration[] = [
  {
    name: 'set_quiz',
    description: 'Set a multiple choice quiz for the video.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: {
                type: Type.STRING,
                description:
                  'The timecode in the video relevant to the question.',
              },
              question: {
                type: Type.STRING,
                description: 'The quiz question.',
              },
              options: {
                type: Type.ARRAY,
                description: 'A list of 4 possible answers.',
                items: {
                  type: Type.STRING,
                },
              },
              answer: {
                type: Type.STRING,
                description: 'The correct answer from the options list.',
              },
            },
            required: ['time', 'question', 'options', 'answer'],
          },
        },
      },
      required: ['questions'],
    },
  },
  {
    name: 'set_flashcards',
    description: 'Set flashcards based on the video content.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        cards: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: {type: Type.STRING},
              definition: {type: Type.STRING},
              lang: {
                type: Type.STRING,
                description:
                  'The BCP-47 language code for the word (e.g., en-US, ja-JP).',
              },
              furigana: {
                type: Type.STRING,
                description: 'Optional furigana for the word.',
              },
            },
            required: ['word', 'definition', 'lang'],
          },
        },
      },
      required: ['cards'],
    },
  },
  {
    name: 'set_timecodes',
    description: 'Set the timecodes for the video with associated text',
    parameters: {
      type: Type.OBJECT,
      properties: {
        timecodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: {
                type: Type.STRING,
              },
              text: {
                type: Type.STRING,
              },
            },
            required: ['time', 'text'],
          },
        },
      },
      required: ['timecodes'],
    },
  },
  {
    name: 'set_timecodes_with_translation',
    description:
      'Set the timecodes for the video with associated text and its translation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        timecodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: {
                type: Type.STRING,
              },
              text: {
                type: Type.STRING,
                description: 'The original text from the video script.',
              },
              translatedText: {
                type: Type.STRING,
                description: 'The translated text.',
              },
            },
            required: ['time', 'text', 'translatedText'],
          },
        },
      },
      required: ['timecodes'],
    },
  },
  {
    name: 'set_timecodes_with_objects',
    description:
      'Set the timecodes for the video with associated text and object list',
    parameters: {
      type: Type.OBJECT,
      properties: {
        timecodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: {
                type: Type.STRING,
              },
              text: {
                type: Type.STRING,
              },
              objects: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
              },
            },
            required: ['time', 'text', 'objects'],
          },
        },
      },
      required: ['timecodes'],
    },
  },
];

export default (fnMap) =>
  functions.map((fn) => ({
    ...fn,
    callback: fnMap[fn.name],
  }));
