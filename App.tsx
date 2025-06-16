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
import {useEffect} from 'react';
import {Content} from './Content';
import {DetectTypeSelector} from './DetectTypeSelector';
import {ExampleImages} from './ExampleImages';
import {ExtraModeControls} from './ExtraModeControls';
import {Prompt} from './Prompt';
import {SideControls} from './SideControls';
import {TopBar} from './TopBar';
import { InitFinishedAtom } from './atoms';


function App() {
  const [initFinished] = useAtom(InitFinishedAtom);

  useEffect(() => {
    if (!window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] bg-[var(--bg-color)] text-[var(--text-color-primary)]">
      {/* Top Header */}
      <div className="shrink-0 p-3 sm:p-4 text-center sm:text-right bg-gray-200 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700">
        <h2 className="text-lg sm:text-xl font-semibold text-[var(--accent-color)]">
          بینای هوشمند
        </h2>
      </div>

      {/* Hero Section */}
      <header className="shrink-0 p-4 sm:p-5 md:p-6 text-center bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--accent-color)] mb-2 sm:mb-3">
          درک فضایی پیشرفته با هوش مصنوعی
        </h1>
        <div className="text-sm sm:text-base text-[var(--text-color-secondary)] max-w-3xl mx-auto leading-relaxed space-y-2">
          <p>
            این یک ابزار پیشرفته برای درک فضایی تصاویر با استفاده از هوش مصنوعی است. شما می‌توانید یک تصویر از دستگاه خود بارگذاری کنید یا صفحه نمایش خود را به اشتراک بگذارید.
          </p>
          <p>
            سپس، با انتخاب نوع شناسایی (مانند کادرهای دوبعدی، ماسک‌های تقسیم‌بندی، نقاط کلیدی، یا کادرهای سه‌بعدی) و نوشتن یک اعلان سفارشی، از مدل بخواهید اشیاء یا ویژگی‌های مورد نظرتان را در تصویر پیدا و مشخص کند. این برنامه برای توسعه‌دهندگان، طراحان و هر کسی که به قابلیت‌های پیشرفته بینایی کامپیوتر علاقه‌مند است، مفید خواهد بود.
          </p>
        </div>
      </header>

      {/* Example Images Section */}
      <section 
        className="shrink-0 p-4 sm:p-5 text-center border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
        aria-labelledby="example-images-heading"
      >
        <h3 id="example-images-heading" className="text-sm sm:text-base font-medium text-[var(--text-color-secondary)] mb-3 sm:mb-4">
          یا با یکی از تصاویر نمونه شروع کنید:
        </h3>
        <div className="flex justify-center">
            <ExampleImages />
        </div>
      </section>
      
      {/* Main Application Layout: Sidebar + Content Area */}
      <div className="flex flex-col md:flex-row-reverse grow overflow-hidden">
        {/* Sidebar (Appears on the right for md+ due to flex-row-reverse) */}
        <aside 
          className="w-full md:w-80 lg:w-96 xl:w-[400px] flex-shrink-0 p-4 sm:p-5 
                     border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 
                     overflow-y-auto bg-gray-50 dark:bg-gray-900/30 
                     flex flex-col gap-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800"
          aria-labelledby="controls-sidebar-heading"
        >
          <h2 id="controls-sidebar-heading" className="sr-only">کنترل‌های برنامه</h2>
          
          <section aria-labelledby="input-methods-heading">
            <h3 id="input-methods-heading" className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-3 tracking-wider">
              ورودی تصویر
            </h3>
            <div className="flex flex-col gap-3">
              {/* ExampleImages was here, now moved above */}
              <SideControls /> {/* Now only contains Upload & Screenshare */}
            </div>
          </section>

          <section aria-labelledby="detection-settings-heading">
            <h3 id="detection-settings-heading" className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-3 tracking-wider">
              تنظیمات شناسایی
            </h3>
            <DetectTypeSelector />
          </section>

          {/* Prompt section takes remaining space in sidebar */}
          <section aria-labelledby="prompt-heading" className="flex flex-col grow min-h-0"> 
            <h3 id="prompt-heading" className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-3 tracking-wider">
              اعلان (Prompt)
            </h3>
            {/* Simplified: Prompt component itself handles its internal flex growth */}
            <Prompt />
          </section>
        </aside>

        {/* Main Content View (Appears on the left for md+ due to flex-row-reverse) */}
        <main className="flex flex-col grow overflow-hidden bg-gray-100 dark:bg-gray-800/80">
          <TopBar /> {/* Will contain Reset, Reveal on Hover, Draw Toggle */}
          {initFinished ? <Content /> : null} {/* Content should grow */}
          <ExtraModeControls /> {/* Palette, 3D FOV, Stop Stream */}
        </main>
      </div>

      {/* Footer */}
      <footer className="shrink-0 text-center py-3 px-3 sm:px-5 bg-gray-100 dark:bg-gray-800 text-xs sm:text-sm text-gray-600 dark:text-gray-400 border-t dark:border-gray-700">
        <div>
          <a 
            href="https://sajjadakbari.ir" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-[var(--accent-color)] transition-colors"
          >
            توسعه یافته توسط سجاد اکبری
          </a>
        </div>
        {/* The detailed description was moved to the Hero section */}
      </footer>
    </div>
  );
}

export default App;