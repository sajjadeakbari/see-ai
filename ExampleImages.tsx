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
import {ImageSrcAtom, IsUploadedImageAtom, ShareStream} from './atoms';
import {imageOptions} from './consts';
import {useResetState} from './hooks';

export function ExampleImages() {
  const [imageSrcValue, setImageSrc] = useAtom(ImageSrcAtom);
  const [isUploadedImageValue, setIsUploadedImage] = useAtom(IsUploadedImageAtom);
  const [streamValue] = useAtom(ShareStream);
  const resetState = useResetState();

  return (
    // On small screens, flex-row with overflow-x-auto. On lg+, flex-wrap.
    <div className="flex flex-row overflow-x-auto pb-2 lg:flex-wrap lg:overflow-visible lg:pb-0 gap-2 sm:gap-3 w-full shrink-0 items-start">
      {imageOptions.map((image, index) => {
        const isActive = imageSrcValue === image && !isUploadedImageValue && !streamValue;
        return (
          <button
            key={image + '-' + index} // Add index for more robust key if image URLs can repeat after fallback
            className={`p-0 w-[56px] h-[56px] relative overflow-hidden rounded-md flex-shrink-0 transition-all duration-150 ease-in-out
              ${isActive 
                ? 'border-2 border-[var(--accent-color)] ring-2 ring-offset-1 ring-offset-[var(--bg-color)] ring-[var(--accent-color)] shadow-lg' 
                : 'border border-gray-300 dark:border-gray-600 hover:border-[var(--accent-color)] focus-visible:border-[var(--accent-color)] focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-color)]'
              }`}
            onClick={() => {
              setIsUploadedImage(false);
              setImageSrc(image);
              resetState();
            }}
            aria-label={`بارگذاری تصویر نمونه ${image.substring(image.lastIndexOf('/') + 1)} ${isActive ? '(فعال)' : ''}`}
            aria-current={isActive ? "true" : "false"}
            >
            <img
              src={image}
              className="absolute left-0 top-0 w-full h-full object-cover"
              alt={`تصویر نمونه ${image.substring(image.lastIndexOf('/') + 1)}`}
              loading="lazy" // Added lazy loading for images
            />
          </button>
        );
      })}
    </div>
  );
}