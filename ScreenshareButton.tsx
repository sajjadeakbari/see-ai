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
import {ShareStream} from './atoms';
import {useResetState} from './hooks';
import { useEffect, useState } from 'react';

export function ScreenshareButton() {
  const [, setStream] = useAtom(ShareStream) as [
    MediaStream | null,
    (update: MediaStream | null | ((prev: MediaStream | null) => MediaStream | null)) => void
  ];
  const resetState = useResetState();
  const [isScreenShareSupported, setIsScreenShareSupported] = useState(true);

  useEffect(() => {
    if (!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)) {
      setIsScreenShareSupported(false);
      console.warn("Screen sharing (getDisplayMedia) is not supported in this environment. Ensure you are on localhost or HTTPS.");
    }
  }, []);

  const handleScreenshare = () => {
    if (!isScreenShareSupported) {
      alert("قابلیت اشتراک صفحه در این مرورگر یا محیط پشتیبانی نمی‌شود. لطفاً از اتصال امن (HTTPS) یا localhost استفاده کنید.");
      return;
    }
    resetState();
    navigator.mediaDevices.getDisplayMedia({video: true}).then((stream) => {
      setStream(stream);
    }).catch(err => {
      console.error("Error starting screenshare:", err);
      if (err.name === 'NotAllowedError') {
        alert("شما اجازه اشتراک صفحه را ندادید. برای استفاده از این قابلیت، لطفاً دسترسی لازم را فراهم کنید.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        alert("هیچ صفحه نمایشی برای اشتراک گذاری یافت نشد.");
      } else {
        alert("خطا در شروع اشتراک صفحه: " + err.message + ". لطفاً از اتصال امن (HTTPS) یا localhost استفاده کنید و مجدداً تلاش نمایید.");
      }
    });
  };

  return (
    <>
      <button
        className="button flex gap-2 sm:gap-3 justify-center items-center w-full text-sm sm:text-base py-2 sm:py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
        onClick={handleScreenshare}
        disabled={!isScreenShareSupported}
        title={!isScreenShareSupported ? "اشتراک صفحه پشتیبانی نمی‌شود. (نیاز به اتصال امن HTTPS یا localhost)" : "اشتراک صفحه نمایش"}
        aria-disabled={!isScreenShareSupported}
      >
        <div className="text-lg">🖥️</div>
        <div>اشتراک صفحه</div>
      </button>
      {!isScreenShareSupported && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 text-center px-1">
          اشتراک صفحه در این محیط پشتیبانی نمی‌شود. (نیاز به اتصال امن HTTPS یا localhost)
        </p>
      )}
    </>
  );
}