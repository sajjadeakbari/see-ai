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
import {ActiveColorAtom} from './atoms';
import {colors} from './consts';

export function Palette() {
  const [activeColor, setActiveColor] = useAtom(ActiveColorAtom);
  return (
    <div
      className="flex gap-2.5 pointer-events-auto" 
      onClick={(e) => {
        e.stopPropagation();
      }}>
      {colors.map((color) => (
        <button 
          key={color}
          aria-label={`انتخاب رنگ ${color}`}
          className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 ease-in-out
            focus:outline-none 
            ${activeColor === color 
              ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-color)] ring-[var(--accent-color)] scale-110' 
              : 'hover:scale-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-color)] focus-visible:ring-[var(--accent-color)]' // Added focus-visible for non-active
            }`}
          style={{ '--current-color': color } as React.CSSProperties} 
          onClick={(e) => {
            e.stopPropagation();
            setActiveColor(color);
          }}>
          <div 
            className="w-full h-full rounded-full border border-black/10 dark:border-white/10" 
            style={{ background: color }}
           />
        </button>
      ))}
    </div>
  );
}