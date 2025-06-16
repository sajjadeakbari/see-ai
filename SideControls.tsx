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
  BumpSessionAtom,
  ImageSrcAtom,
  IsUploadedImageAtom,
} from './atoms';
import {useResetState} from './hooks';
import {ScreenshareButton} from './ScreenshareButton';

export function SideControls() {
  const [, setImageSrc] = useAtom(ImageSrcAtom);
  const [, setIsUploadedImage] = useAtom(IsUploadedImageAtom);
  const [, setBumpSession] = useAtom(BumpSessionAtom);
  const resetState = useResetState();

  return (
    <div className="flex flex-col gap-2 sm:gap-3 w-full">
      <label className="flex items-center justify-center button bg-[#3B68FF] px-4 sm:px-6 py-2 sm:py-3 !text-white !border-none w-full text-sm sm:text-base">
        <input
          className="hidden"
          type="file"
          accept=".jpg, .jpeg, .png, .webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (ev) => {
                resetState();
                setImageSrc(ev.target?.result as string);
                setIsUploadedImage(true);
                setBumpSession((prev) => prev + 1);
              };
              reader.readAsDataURL(file);
            }
            // Reset file input to allow uploading the same file again
            e.target.value = '';
          }}
        />
        <div>بارگذاری تصویر</div>
      </label>
      <ScreenshareButton />
    </div>
  );
}