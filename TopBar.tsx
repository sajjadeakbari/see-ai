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

import {useAtom} from 'jotai';
import {DetectTypeAtom, DrawModeAtom, HoverEnteredAtom, RevealOnHoverModeAtom} from './atoms';
import {useResetState} from './hooks';

// SVG Icon for Pencil (Drawing)
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);


export function TopBar() {
  const resetState = useResetState();
  const [revealOnHover, setRevealOnHoverMode] = useAtom(RevealOnHoverModeAtom);
  const [detectType] = useAtom(DetectTypeAtom);
  const [, setHoverEntered] = useAtom(HoverEnteredAtom);
  const [drawMode, setDrawMode] = useAtom(DrawModeAtom);

  return (
    <div className="flex w-full items-center px-3 sm:px-4 py-2 border-b dark:border-gray-700 justify-between text-sm shrink-0">
      <div className="flex gap-3 items-center">
        <button
          onClick={() => {
            resetState();
          }}
          className="button !p-1.5 sm:!p-2 !min-h-0 text-xs sm:text-sm hover:!bg-opacity-100"
          title="بازنشانی جلسه"
          aria-label="بازنشانی جلسه"
          >
          بازنشانی
        </button>
      </div>
      <div className="flex gap-2 sm:gap-3 items-center">
        {(detectType === '2D bounding boxes' ||
        detectType === 'Segmentation masks') ? (
          <div>
            <label className="flex items-center gap-1 sm:gap-2 px-1 sm:px-3 select-none whitespace-nowrap cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700/60 rounded-md py-1 transition-colors">
              <input
                type="checkbox"
                checked={revealOnHover}
                onChange={(e) => {
                  if (e.target.checked) {
                    setHoverEntered(false);
                  }
                  setRevealOnHoverMode(e.target.checked);
                }}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-[var(--accent-color)] rounded-sm focus:ring-offset-0"
              />
              <div className="text-xs sm:text-sm">نمایش با شناور شدن</div>
            </label>
          </div>
        ) : null}
         <button
            className={`button !min-h-0 !p-1.5 sm:!p-2 flex gap-1.5 items-center text-xs sm:text-sm transition-colors
              ${drawMode 
                ? 'bg-[var(--accent-color-subtle)] text-[var(--accent-color)] border-[var(--accent-color)] hover:!bg-opacity-100' 
                : 'hover:!bg-opacity-100'
              }`}
            onClick={() => {
              setDrawMode(!drawMode);
            }}
            title={drawMode ? 'پایان طراحی' : 'شروع طراحی روی تصویر'}
            aria-pressed={drawMode}
            >
            <PencilIcon />
            <span className="hidden sm:inline">{drawMode ? 'پایان طراحی' : 'طراحی'}</span>
        </button>
      </div>
    </div>
  );
}