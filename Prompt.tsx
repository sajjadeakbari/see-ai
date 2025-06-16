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

import {GoogleGenAI, GenerateContentResponse, GenerateContentConfig, SafetySetting, HarmCategory, HarmBlockThreshold} from '@google/genai';
import {useAtom} from 'jotai';
import getStroke from 'perfect-freehand';
import {useState, useEffect} from 'react';
import {
  BoundingBoxMasksAtom,
  BoundingBoxes2DAtom,
  BoundingBoxes3DAtom,
  DetectTypeAtom,
  HoverEnteredAtom,
  ImageSrcAtom,
  IsLoadingContentAtom, 
  LinesAtom,
  PointsAtom,
  PromptsAtom,
  ShareStream,
  TemperatureAtom,
  VideoRefAtom,
} from './atoms';
import {lineOptions, defaultPromptParts, safetySettings} from './consts'; 
import {getSvgPathFromStroke, loadImage} from './utils';

const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

// Loading Spinner SVG
const LoadingSpinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);


export function Prompt() {
  const [temperature, setTemperature] = useAtom(TemperatureAtom);
  const [, setBoundingBoxes2D] = useAtom(BoundingBoxes2DAtom);
  const [, setBoundingBoxes3D] = useAtom(BoundingBoxes3DAtom);
  const [, setBoundingBoxMasks] = useAtom(BoundingBoxMasksAtom);
  const [stream] = useAtom(ShareStream);
  const [detectType] = useAtom(DetectTypeAtom);
  const [, setPoints] = useAtom(PointsAtom);
  const [, setHoverEntered] = useAtom(HoverEnteredAtom);
  const [lines] = useAtom(LinesAtom);
  const [videoRef] = useAtom(VideoRefAtom);
  const [imageSrc] = useAtom(ImageSrcAtom);
  const [targetPrompt, setTargetPrompt] = useState(defaultPromptParts['2D bounding boxes'][1]); 
  const [labelPrompt, setLabelPrompt] = useState('');
  const [showRawPrompt, setShowRawPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setIsLoadingContent] = useAtom(IsLoadingContentAtom); 


  const [prompts] = useAtom(PromptsAtom);


  const is2d = detectType === '2D bounding boxes';

  useEffect(() => {
    if (!is2d && prompts[detectType] && prompts[detectType].length > 1) {
      setTargetPrompt(prompts[detectType][1]);
    } else if (is2d) {
      setTargetPrompt(prompts['2D bounding boxes'][1]); 
      setLabelPrompt(''); 
    } else {
      setTargetPrompt(prompts[detectType]?.[1] || '');
    }
  }, [detectType, prompts, is2d]);


  const getConstructedPrompt = () => {
    if (is2d) {
      return `${prompts[detectType][0]}${targetPrompt}${labelPrompt ? `، با برچسب‌گذاری به عنوان "${labelPrompt}"` : ''}${prompts[detectType][2]}`;
    }
    // For non-2D cases, if it was using customPrompts, that logic is removed.
    // Now it will always use the structured prompt.
    const promptParts = prompts[detectType];
    if (promptParts.length === 3) { 
        return `${promptParts[0]}${targetPrompt}${promptParts[2]}`;
    }
    return promptParts.join(''); // Fallback if not 3 parts, though current structure assumes 3 or 2 parts.
  };
  
  async function handleSend() {
    setIsLoading(true);
    setIsLoadingContent(true); 
    setBoundingBoxes2D([]);
    setBoundingBoxes3D([]);
    setBoundingBoxMasks([]);
    setPoints([]);

    let activeDataURL;
    const maxSize = 640;
    const copyCanvas = document.createElement('canvas');
    const ctx = copyCanvas.getContext('2d')!;

    if (stream) {
      const video = videoRef.current!;
      const scale = Math.min(
        maxSize / video.videoWidth,
        maxSize / video.videoHeight,
      );
      copyCanvas.width = video.videoWidth * scale;
      copyCanvas.height = video.videoHeight * scale;
      ctx.drawImage(
        video,
        0,
        0,
        video.videoWidth * scale,
        video.videoHeight * scale,
      );
    } else if (imageSrc) {
      const image = await loadImage(imageSrc);
      const scale = Math.min(maxSize / image.width, maxSize / image.height);
      copyCanvas.width = image.width * scale;
      copyCanvas.height = image.height * scale;
      ctx.drawImage(image, 0, 0, image.width * scale, image.height * scale);
    } else {
      setIsLoading(false);
      setIsLoadingContent(false); 
      alert("لطفاً یک تصویر بارگذاری کنید یا اشتراک صفحه را فعال نمایید. در صورت عدم موفقیت، صفحه را تازه‌سازی کنید.");
      return;
    }
    activeDataURL = copyCanvas.toDataURL('image/png');

    if (lines.length > 0) {
      for (const line of lines) {
        const p = new Path2D(
          getSvgPathFromStroke(
            getStroke(
              line[0].map(([x, y]) => [
                x * copyCanvas.width,
                y * copyCanvas.height,
                0.5,
              ]),
              lineOptions,
            ),
          ),
        );
        ctx.fillStyle = line[1];
        ctx.fill(p);
      }
      activeDataURL = copyCanvas.toDataURL('image/png');
    }

    const currentPromptText = getConstructedPrompt();
    
    setHoverEntered(false);
    const model = 'gemini-2.5-flash-preview-04-17';
    const config: GenerateContentConfig = { 
      temperature,
      thinkingConfig: {thinkingBudget: 0},
      safetySettings,
      responseMimeType: "application/json",
    };

    try {
      const genAIResponse: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: activeDataURL.replace('data:image/png;base64,', ''),
                  mimeType: 'image/png',
                },
              },
              {text: currentPromptText},
            ],
          },
        ],
        config,
      });

      let jsonStr = genAIResponse.text.trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }
      
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(jsonStr);
      } catch (e) {
        console.error("Failed to parse JSON response:", e, "\nRaw response text from API:", jsonStr);
        alert(`خطا در تجزیه پاسخ JSON از API. لطفاً دوباره تلاش کنید، اعلان را تغییر دهید یا تصویر ورودی را بررسی کنید. جزئیات: ${(e as Error).message}. پاسخ دریافتی (اولیه): ${jsonStr.substring(0,100)}...`);
        setBoundingBoxes2D([]);
        setBoundingBoxes3D([]);
        setBoundingBoxMasks([]);
        setPoints([]);
        setIsLoading(false);
        setIsLoadingContent(false); 
        return;
      }

      if (!Array.isArray(parsedResponse)) {
        console.error("Parsed response is not an array:", parsedResponse);
        alert("پاسخ دریافت شده از API در فرمت مورد انتظار (آرایه) نیست. لطفاً اعلان را بررسی کنید.");
        setBoundingBoxes2D([]);
        setBoundingBoxes3D([]);
        setBoundingBoxMasks([]);
        setPoints([]);
        setIsLoading(false);
        setIsLoadingContent(false);
        return;
      }
      
      if (detectType === '2D bounding boxes') {
        if (parsedResponse.every(item => typeof item === 'object' && item !== null && 'box_2d' in item && 'label' in item && Array.isArray(item.box_2d) && item.box_2d.length === 4 && item.box_2d.every(num => typeof num === 'number'))) {
          const formattedBoxes = parsedResponse.map(
            (box: {box_2d: [number, number, number, number]; label: string}) => {
              const [ymin, xmin, ymax, xmax] = box.box_2d;
              return {
                x: xmin / 1000,
                y: ymin / 1000,
                width: (xmax - xmin) / 1000,
                height: (ymax - ymin) / 1000,
                label: box.label,
              };
            },
          );
          setBoundingBoxes2D(formattedBoxes);
        } else {
            alert("ساختار داده دریافت شده برای کادرهای دوبعدی نامعتبر است. لطفاً اعلان خود را بررسی کنید یا نوع شناسایی دیگری را امتحان کنید.");
            setBoundingBoxes2D([]);
        }
      } else if (detectType === 'Points') {
         if (parsedResponse.every(item => typeof item === 'object' && item !== null && 'point' in item && 'label' in item && Array.isArray(item.point) && item.point.length === 2 && item.point.every(num => typeof num === 'number'))) {
            const formattedPoints = parsedResponse.map(
            (point: {point: [number, number]; label: string}) => {
                return {
                point: {
                    x: point.point[1] / 1000,
                    y: point.point[0] / 1000,
                },
                label: point.label,
                };
            },
            );
            setPoints(formattedPoints);
        } else {
            alert("ساختار داده دریافت شده برای نقاط کلیدی نامعتبر است. لطفاً اعلان خود را بررسی کنید یا نوع شناسایی دیگری را امتحان کنید.");
            setPoints([]);
        }
      } else if (detectType === 'Segmentation masks') {
        if (parsedResponse.every(item => typeof item === 'object' && item !== null && 'box_2d' in item && 'label' in item && 'mask' in item && Array.isArray(item.box_2d) && item.box_2d.length === 4 && item.box_2d.every(num => typeof num === 'number') && typeof item.mask === 'string')) {
            const formattedBoxes = parsedResponse.map(
            (box: {
                box_2d: [number, number, number, number];
                label: string;
                mask: string; 
            }) => {
                const [ymin, xmin, ymax, xmax] = box.box_2d;
                return {
                x: xmin / 1000,
                y: ymin / 1000,
                width: (xmax - xmin) / 1000,
                height: (ymax - ymin) / 1000,
                label: box.label,
                imageData: box.mask, 
                };
            },
            );
            const sortedBoxes = formattedBoxes.sort(
            (a: any, b: any) => b.width * b.height - a.width * a.height,
            );
            setBoundingBoxMasks(sortedBoxes);
        } else {
            alert("ساختار داده دریافت شده برای ماسک‌های تقسیم‌بندی نامعتبر است. لطفاً اعلان خود را بررسی کنید یا نوع شناسایی دیگری را امتحان کنید.");
            setBoundingBoxMasks([]);
        }
      } else { // 3D bounding boxes
         if (parsedResponse.every(item => typeof item === 'object' && item !== null && 'box_3d' in item && 'label' in item && Array.isArray(item.box_3d) && item.box_3d.length === 9 && item.box_3d.every(num => typeof num === 'number'))) {
            const formattedBoxes = parsedResponse.map(
            (box: {
                box_3d: [
                number, number, number, number, number, number, number, number, number,
                ];
                label: string;
            }) => {
                const center = box.box_3d.slice(0, 3) as [number, number, number];
                const size = box.box_3d.slice(3, 6) as [number, number, number];
                const rpy = box.box_3d
                .slice(6)
                .map((x: number) => (x * Math.PI) / 180) as [number, number, number];
                return { center, size, rpy, label: box.label };
            },
            );
            setBoundingBoxes3D(formattedBoxes);
        } else {
            alert("ساختار داده دریافت شده برای کادرهای سه‌بعدی نامعتبر است. لطفاً اعلان خود را بررسی کنید یا نوع شناسایی دیگری را امتحان کنید.");
            setBoundingBoxes3D([]);
        }
      }
    } catch (error) {
      console.error("Error calling AI API:", error);
      alert(`خطا در ارتباط با API هوش مصنوعی. لطفاً اتصال اینترنت خود، تنظیمات API Key یا اعلان را بررسی کرده و دوباره تلاش کنید. جزئیات: ${(error as Error).message}`);
      setBoundingBoxes2D([]);
      setBoundingBoxes3D([]);
      setBoundingBoxMasks([]);
      setPoints([]);
    } finally {
      setIsLoading(false);
      setIsLoadingContent(false); 
    }
  }

  return (
    <div className="flex grow flex-col gap-2 sm:gap-3 h-full">
      <div className="flex justify-between items-center">
        <div className="uppercase text-sm font-medium text-[var(--text-color-secondary)]">اعلان:</div>
        <label className="flex gap-1 sm:gap-2 select-none items-center cursor-pointer">
          <input
            type="checkbox"
            checked={showRawPrompt}
            onChange={() => setShowRawPrompt(!showRawPrompt)}
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-[var(--accent-color)] rounded focus:ring-2 focus:ring-offset-1 focus:ring-offset-[var(--bg-color)] focus:ring-[var(--accent-color)]"
          />
          <div className="text-xs sm:text-sm">نمایش اعلان خام</div>
        </label>
      </div>
      <div className="w-full flex flex-col grow">
        {showRawPrompt ? (
          <div className="mb-2 text-xs sm:text-sm text-[var(--text-color-secondary)] p-3 bg-gray-100 dark:bg-gray-800/50 rounded-md whitespace-pre-wrap min-h-[70px] sm:min-h-[90px] grow overflow-y-auto border border-gray-200 dark:border-gray-700">
            {getConstructedPrompt()}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 sm:gap-2 grow">
            <div className="text-xs sm:text-sm text-[var(--text-color-secondary)]">{prompts[detectType][0]}</div>
            <textarea
              className="w-full bg-[var(--input-color)] rounded-md resize-y p-3 sm:p-3.5 text-sm sm:text-base min-h-[45px] sm:min-h-[55px]"
              placeholder={is2d ? "چه نوع اشیائی؟ (مثال: گربه‌ها)" : "چه چیزی را شناسایی کنیم؟"}
              value={targetPrompt}
              onChange={(e) => setTargetPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            {is2d && (
              <>
                <div className="text-xs sm:text-sm mt-1 text-[var(--text-color-secondary)]">برچسب هر کدام با: (اختیاری)</div>
                <textarea
                  className="w-full bg-[var(--input-color)] rounded-md resize-y p-3 sm:p-3.5 text-sm sm:text-base min-h-[45px] sm:min-h-[55px]"
                  placeholder="چگونه برچسب‌گذاری شوند؟ (مثال: رنگ)"
                  value={labelPrompt}
                  onChange={(e) => setLabelPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
              </>
            )}
             {prompts[detectType].length > 2 && !is2d && (
               <div className="text-xs sm:text-sm text-[var(--text-color-secondary)] mt-1 grow overflow-y-auto">
                 {prompts[detectType].slice(2).join(' ')}
               </div>
            )}
             <div className="grow"></div> {/* Spacer to push controls down */}
          </div>
        )}
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mt-auto pt-2">
        <button
          className="button primary flex items-center justify-center px-8 sm:px-10 py-2.5 sm:py-3 text-sm sm:text-base disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
          onClick={handleSend}
          disabled={isLoading || (!imageSrc && !stream)}>
          {isLoading ? (
            <>
              <LoadingSpinner />
              <span>در حال ارسال...</span>
            </>
          ) : 'ارسال'}
        </button>
        <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm w-full sm:w-auto justify-between sm:justify-start">
          <span className="text-[var(--text-color-secondary)]">دما:</span>
          <input
            type="range"
            min="0"
            max="1" 
            step="0.05"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="w-24 sm:w-28 md:w-32 cursor-pointer" 
            aria-label="دما"
            dir="ltr"
          />
          <span className="font-mono text-xs text-[var(--text-color-secondary)] w-8 text-right">{temperature.toFixed(2)}</span>
        </label>
      </div>
    </div>
  );
}