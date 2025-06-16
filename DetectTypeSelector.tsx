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
import {DetectTypeAtom, HoverEnteredAtom} from './atoms';
import {DetectTypes} from './Types';

const typeLabels: Record<DetectTypes, string> = {
  '2D bounding boxes': 'کادرهای دوبعدی',
  'Segmentation masks': 'ماسک‌های تقسیم‌بندی',
  'Points': 'نقاط کلیدی',
  '3D bounding boxes': 'کادرهای سه‌بعدی',
};

export function DetectTypeSelector() {
  const [detectType] = useAtom(DetectTypeAtom);

  return (
    <div className="flex flex-col w-full h-full"> {/* Occupy full height of its container */}
      <div className="mb-2 sm:mb-3 uppercase text-sm font-medium text-[var(--text-color-secondary)]">نوع شناسایی:</div>
      <div className="flex flex-col gap-2 sm:gap-2.5 grow justify-around md:justify-start"> {/* Distribute space for buttons or stack them */}
        {(Object.keys(typeLabels) as DetectTypes[]).map((typeKey) => (
          <SelectOption key={typeKey} typeKey={typeKey} label={typeLabels[typeKey]} />
        ))}
      </div>
      {detectType === '3D bounding boxes' && (
        <div 
          className="mt-3 flex gap-2 sm:gap-3 px-3 py-2.5 sm:py-3 items-center justify-center text-center text-xs sm:text-sm rounded-md"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent-color) 20%, transparent)',
            color: 'var(--accent-color)'
          }}
          role="alert"
        >
          <span className="font-semibold">توجه:</span> قابلیت کادرهای سه‌بعدی در مرحله آزمایشی است. برای دقت بالاتر از کادرهای دوبعدی استفاده کنید.
        </div>
      )}
    </div>
  );
}

function SelectOption({typeKey, label}: {typeKey: DetectTypes; label: string}) {
  const [currentDetectType, setDetectType] = useAtom(DetectTypeAtom);
  const [, setHoverEntered] = useAtom(HoverEnteredAtom);
  const isSelected = currentDetectType === typeKey;

  return (
    <button
      className={`w-full py-2.5 sm:py-3 px-3 items-center text-center gap-3 text-sm rounded-md border transition-all duration-200
        ${isSelected 
            ? 'border-[var(--accent-color)] bg-[var(--accent-color-subtle)] text-[var(--accent-color)] font-semibold shadow-sm' 
            : 'border-[var(--border-color)] bg-transparent hover:border-[var(--accent-color)] hover:bg-[var(--accent-color-subtle)]'
        }`}
      onClick={() => {
        setHoverEntered(false);
        setDetectType(typeKey);
      }}>
      {label}
    </button>
  );
}