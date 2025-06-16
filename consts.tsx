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

import { HarmCategory, HarmBlockThreshold, SafetySetting } from "@google/genai";

export const colors = [
  'rgb(0, 0, 0)',
  'rgb(255, 255, 255)',
  'rgb(213, 40, 40)',
  'rgb(250, 123, 23)',
  'rgb(240, 186, 17)',
  'rgb(8, 161, 72)',
  'rgb(26, 115, 232)',
  'rgb(161, 66, 244)',
];

function hexToRgb(hex: string) {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return [r, g, b];
}

export const segmentationColors = [
  '#E6194B',
  '#3C89D0',
  '#3CB44B',
  '#FFE119',
  '#911EB4',
  '#42D4F4',
  '#F58231',
  '#F032E6',
  '#BFEF45',
  '#469990',
];
export const segmentationColorsRgb = segmentationColors.map((c) => hexToRgb(c));

const baseImageNames = [
  'origami.jpg',
  'pumpkins.jpg',
  'clock.jpg',
  'socks.jpg',
  'breakfast.jpg',
  'cat.jpg',
  'spill.jpg',
  'fruit.jpg',
  'baklava.jpg',
  'street.jpg', 
  'interior.jpg', 
];

export const imageOptions: string[] = await Promise.all(
  baseImageNames.map(async (i) => {
    try {
      const response = await fetch(
        `https://www.gstatic.com/aistudio/starter-apps/bounding-box/${i}`,
      );
      if (!response.ok) {
        console.warn(`Failed to fetch ${i}, using fallback.`);
        const fallbackResponse = await fetch(`https://www.gstatic.com/aistudio/starter-apps/bounding-box/origami.jpg`);
        return URL.createObjectURL(await fallbackResponse.blob());
      }
      return URL.createObjectURL(await response.blob());
    } catch (error) {
      console.error(`Error fetching image ${i}:`, error);
      const fallbackResponse = await fetch(`https://www.gstatic.com/aistudio/starter-apps/bounding-box/origami.jpg`);
      return URL.createObjectURL(await fallbackResponse.blob());
    }
  }),
);


export const lineOptions = {
  size: 8,
  thinning: 0,
  smoothing: 0,
  streamline: 0,
  simulatePressure: false,
};

export const defaultPromptParts = {
  '2D bounding boxes': [
    'موقعیت‌های ', 
    'اشیاء',       
    ' را به صورت یک لیست JSON نشان بده. ماسک‌ها را برنگردان. حداکثر ۲۵ مورد.', 
  ],
  'Segmentation masks': [
    'ماسک‌های تقسیم‌بندی برای ', 
    'اشیاء',                     
    ' را ارائه بده. یک لیست JSON از ماسک‌های تقسیم‌بندی خروجی بده که هر ورودی شامل کادر مرزی دو بعدی در کلید "box_2d"، ماسک تقسیم‌بندی در کلید "mask" و برچسب متنی در کلید "label" باشد. از برچسب‌های توصیفی استفاده کن.', 
  ],
  '3D bounding boxes': [
    'خروجی به صورت JSON. کادرهای مرزی سه‌بعدی ', 
    'اشیاء',                                   
    ' را شناسایی کن، حداکثر ۱۰ مورد خروجی بده. لیستی را برگردان که هر ورودی شامل نام شیء در "label" و کادر مرزی سه‌بعدی آن در "box_3d" باشد.', 
  ],
  Points: [
    'به ',    
    'نقاط مهم اشیاء', 
    ' اشاره کن، حداکثر ۱۰ مورد. پاسخ باید از فرمت JSON زیر پیروی کند: [{"point": <point>, "label": <label1>}, ...]. نقاط در فرمت [y, x] نرمال‌شده به ۰-۱۰۰۰ هستند.', 
  ],
};

const safetyLevel = HarmBlockThreshold.BLOCK_ONLY_HIGH; 

export const safetySettings: SafetySetting[] = [ 
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: safetyLevel },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: safetyLevel },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: safetyLevel },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: safetyLevel },
];