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

import {max, min} from 'd3-array';
import {scaleBand, scaleLinear} from 'd3-scale';
import {line} from 'd3-shape';
import {useEffect, useRef, useState} from 'react';
import {timeToSecs} from './utils';

// Define an interface for our data points to ensure type safety.
interface ChartDataPoint {
  time: string;
  value?: string | number;
}

export default function Chart({
  data,
  yLabel,
  jumpToTimecode,
}: {
  data: ChartDataPoint[];
  yLabel: string;
  jumpToTimecode: (timeInSecs: number) => void;
}) {
  const chartRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(1);
  const [height, setHeight] = useState(1);
  const margin = 55;
  const xMax = width;
  const yMax = height - margin;

  const chartData = data.filter(
    (d): d is ChartDataPoint & {value: string | number} => d.value != null,
  );

  const xScale = scaleBand()
    .range([margin + 10, xMax])
    .domain(chartData.map((d) => d.time))
    .padding(0.2);

  // Ensure all values are treated as numbers for scaling.
  const vals = chartData.map((d) => Number(d.value));
  const yScale = scaleLinear()
    .domain([min(vals) ?? 0, max(vals) ?? 0])
    .nice()
    .range([yMax, margin]);

  const yTicks = yScale.ticks(Math.floor(height / 70));

  // Specify the data type for the line generator to fix accessor errors.
  const lineGen = line<ChartDataPoint & {value: string | number}>()
    .x((d) => xScale(d.time)!)
    .y((d) => yScale(Number(d.value)));

  useEffect(() => {
    const setSize = () => {
      if (chartRef.current) {
        setWidth(chartRef.current.clientWidth);
        setHeight(chartRef.current.clientHeight);
      }
    };

    setSize();
    addEventListener('resize', setSize);
    return () => removeEventListener('resize', setSize);
  }, []);

  return (
    <svg className="lineChart" ref={chartRef}>
      <g className="axisLabels" transform={`translate(0 ${0})`}>
        {yTicks.map((tick) => {
          const y = yScale(tick);

          return (
            <g key={tick} transform={`translate(0 ${y})`}>
              <text x={margin - 10} dy="0.25em" textAnchor="end">
                {tick}
              </text>
            </g>
          );
        })}
      </g>

      <g
        className="axisLabels timeLabels"
        transform={`translate(0 ${yMax + 40})`}>
        {chartData.map(({time}, i) => {
          return (
            <text
              key={i}
              x={xScale(time)}
              role="button"
              onClick={() => jumpToTimecode(timeToSecs(time))}>
              {time.length > 5 ? time.replace(/^00:/, '') : time}
            </text>
          );
        })}
      </g>

      <g>
        <path d={lineGen(chartData) ?? ''} />
      </g>

      <g>
        {chartData.map(({time, value}, i) => {
          const numValue = Number(value);
          return (
            <g key={i} className="dataPoint">
              <circle cx={xScale(time)} cy={yScale(numValue)} r={4} />

              <text x={xScale(time)} y={yScale(numValue) - 12}>
                {numValue}
              </text>
            </g>
          );
        })}
      </g>

      <text
        className="axisTitle"
        x={margin}
        y={-width + margin}
        transform="rotate(90)">
        {yLabel}
      </text>
    </svg>
  );
}