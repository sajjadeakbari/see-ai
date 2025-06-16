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
import {
  BoundingBoxes2DAtom,
  BoundingBoxes3DAtom,
  BoundingBoxMasksAtom,
  DetectTypeAtom,
  DrawModeAtom,
  FOVAtom,
  HoveredBoxAtom,
  LinesAtom,
  PointsAtom,
  ShareStream,
} from './atoms';
import {Palette} from './Palette';

export function ExtraModeControls() {
  const [, setBoundingBoxes2D] = useAtom(BoundingBoxes2DAtom);
  const [, setBoundingBoxes3D] = useAtom(BoundingBoxes3DAtom);
  const [, setBoundingBoxMasks] = useAtom(BoundingBoxMasksAtom);
  const [stream, setStream] = useAtom(ShareStream) as [
    MediaStream | null,
    (update: MediaStream | null | ((prev: MediaStream | null) => MediaStream | null)) => void
  ];
  const [detectType] = useAtom(DetectTypeAtom);
  const [fov, setFoV] = useAtom(FOVAtom);
  const [, setPoints] = useAtom(PointsAtom);
  const [, _setHoveredBox] = useAtom(HoveredBoxAtom);
  const [drawMode, setDrawMode] = useAtom(DrawModeAtom);
  const [, setLines] = useAtom(LinesAtom);

  const showStreamControls = stream;
  const show3DControls = detectType === '3D bounding boxes';
  // Note: The 3D warning div was removed from here and moved to DetectTypeSelector.tsx
  const showExtraBar = showStreamControls || show3DControls;


  return (
    <>
      {/* 3D Experimental Warning is now in DetectTypeSelector.tsx */}
      {drawMode ? (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 px-3 py-2.5 sm:py-3 items-center justify-between border-t dark:border-gray-700">
          <div className="flex flex-wrap gap-2 sm:gap-3"> 
            <button
              className="button secondary flex gap-2 items-center text-xs sm:text-sm px-3 py-1.5" 
              onClick={() => {
                setDrawMode(false);
              }}>
              <div className="text-base">✅</div>
              <div>انجام شد</div>
            </button>
            <button
              className="button secondary flex gap-2 items-center text-xs sm:text-sm px-3 py-1.5"
              onClick={() => {
                setLines([]);
              }}>
              <div className="text-sm">🗑️</div>
              پاک کردن
            </button>
          </div>
          <div className="flex justify-center my-2 sm:my-0"> 
            <Palette />
          </div>
          <div className="hidden sm:block sm:w-[160px] lg:w-[210px] flex-shrink-0"></div> {/* Adjusted spacer */}
        </div>
      ) : null}
      {showExtraBar ? (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 px-3 py-2.5 sm:py-3 border-t dark:border-gray-700 items-center justify-center">
          {showStreamControls ? (
            <button
              className="button secondary flex gap-2 items-center text-xs sm:text-sm w-full sm:w-auto px-3 py-1.5"
              onClick={() => {
                stream?.getTracks().forEach((track) => track.stop());
                setStream(null);
                setBoundingBoxes2D([]);
                setBoundingBoxes3D([]);
                setBoundingBoxMasks([]);
                setPoints([]);
              }}>
              <div className="text-sm">🔴</div>
              <div className="whitespace-nowrap">توقف اشتراک صفحه</div>
            </button>
          ) : null}
          {show3DControls ? (
            <>
              <div className="text-xs sm:text-sm mx-1 sm:mx-2 text-[var(--text-color-secondary)]">
                <span className="font-mono">{fov}°</span>
              </div> 
              <input
                className="w-full sm:w-auto sm:max-w-[140px] md:max-w-xs grow cursor-pointer" 
                type="range"
                min="30"
                max="120"
                value={fov}
                onChange={(e) => setFoV(+e.target.value)}
                aria-label="میدان دید"
                dir="ltr"
              />
              <div className="text-xs sm:text-sm ml-1 sm:ml-0 mr-1 text-[var(--text-color-secondary)]">میدان دید (FOV)</div>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}