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
import {useEffect, useMemo, useState} from 'react';
import {timeToSecs} from './utils';

function QuizQuestion({
  question,
  index,
  userAnswer,
  onAnswerChange,
  isChecked,
  onCheck,
  jumpToTimecode,
}) {
  const isCorrect = userAnswer === question.answer;

  return (
    <div className="quizQuestion">
      <div className="quizQuestionHeader">
        <h3>
          {index + 1}. {question.question}
        </h3>
        <time onClick={() => jumpToTimecode(timeToSecs(question.time))}>
          {question.time}
        </time>
      </div>
      <div className="quizOptions" role="radiogroup">
        {question.options.map((option, i) => (
          <label
            key={i}
            className={c({
              correct: isChecked && option === question.answer,
              incorrect: isChecked && !isCorrect && option === userAnswer,
            })}>
            <input
              type="radio"
              name={`question-${index}`}
              value={option}
              checked={userAnswer === option}
              onChange={() => onAnswerChange(option)}
              disabled={isChecked}
            />
            {option}
          </label>
        ))}
      </div>
      <div className="quizActions">
        {!isChecked && (
          <button
            className="button"
            onClick={onCheck}
            disabled={!userAnswer}
            aria-label={`Check answer for question ${index + 1}`}>
            Check Answer
          </button>
        )}
      </div>
    </div>
  );
}

export default function Quiz({data, jumpToTimecode, onQuizComplete}) {
  const [userAnswers, setUserAnswers] = useState({});
  const [checked, setChecked] = useState({});

  const score = useMemo(() => {
    return Object.keys(checked).reduce((correctCount, index) => {
      if (userAnswers[index] === data[index].answer) {
        return correctCount + 1;
      }
      return correctCount;
    }, 0);
  }, [checked, userAnswers, data]);

  const handleAnswerChange = (questionIndex, answer) => {
    setUserAnswers((prev) => ({...prev, [questionIndex]: answer}));
  };

  const handleCheckAnswer = (questionIndex) => {
    setChecked((prev) => ({...prev, [questionIndex]: true}));
  };

  const allQuestionsChecked =
    data && Object.keys(checked).length === data.length;

  useEffect(() => {
    if (allQuestionsChecked && onQuizComplete) {
      onQuizComplete(score, data.length);
    }
  }, [allQuestionsChecked, score, data, onQuizComplete]);

  if (!data) return null;

  return (
    <div className="quizContainer">
      {allQuestionsChecked && (
        <div className="quizScore">
          Your Score: {score} / {data.length}
        </div>
      )}
      {data.map((q, i) => (
        <QuizQuestion
          key={i}
          question={q}
          index={i}
          userAnswer={userAnswers[i]}
          onAnswerChange={(answer) => handleAnswerChange(i, answer)}
          isChecked={checked[i]}
          onCheck={() => handleCheckAnswer(i)}
          jumpToTimecode={jumpToTimecode}
        />
      ))}
    </div>
  );
}
