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
import getStroke from 'perfect-freehand';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ResizePayload, useResizeDetector} from 'react-resize-detector';
import {
  ActiveColorAtom,
  BoundingBoxes2DAtom,
  BoundingBoxes3DAtom,
  BoundingBoxMasksAtom,
  DetectTypeAtom,
  DrawModeAtom,
  FOVAtom,
  ImageSrcAtom,
  IsLoadingContentAtom, // Import loading atom
  LinesAtom,
  PointsAtom,
  RevealOnHoverModeAtom,
  ShareStream,
  VideoRefAtom,
} from './atoms';
import {lineOptions, segmentationColorsRgb} from './consts';
import {getSvgPathFromStroke} from './utils';

// SVG Icons
const ZoomInIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
  </svg>
);

const ZoomOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
  </svg>
);

const ResetZoomIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0014.49 0M2.985 19.644l3.181-3.182m0 0a8.25 8.25 0 0114.49 0M3.75 10.875a8.25 8.25 0 01.608-3.078M2.985 19.644A8.25 8.25 0 013 12m0 0a8.25 8.25 0 0118 0m0 0v.375m0 0a8.25 8.25 0 01-3.415 6.679M18 12a8.25 8.25 0 01-3 5.625m0 0A8.25 8.25 0 013 12m0 0h4.992" />
  </svg>
);


export function Content() {
  const [imageSrc] = useAtom(ImageSrcAtom);
  const [boundingBoxes2D] = useAtom(BoundingBoxes2DAtom);
  const [boundingBoxes3D] = useAtom(BoundingBoxes3DAtom);
  const [boundingBoxMasks] = useAtom(BoundingBoxMasksAtom);
  const [stream] = useAtom(ShareStream);
  const [detectType] = useAtom(DetectTypeAtom);
  const [videoRef] = useAtom(VideoRefAtom);
  const [fov] = useAtom(FOVAtom);
  const [points] = useAtom(PointsAtom);
  const [revealOnHover] = useAtom(RevealOnHoverModeAtom);
  const [hoverEntered, setHoverEntered] = useState(false);
  const [hoveredBox, _setHoveredBox] = useState<number | null>(null);
  const [drawMode] = useAtom(DrawModeAtom);
  const [lines, setLines] = useAtom(LinesAtom);
  const [activeColor] = useAtom(ActiveColorAtom);
  const [isLoadingContent] = useAtom(IsLoadingContentAtom);

  // Zoom and Pan state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({x: 0, y: 0});
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({x: 0, y: 0});
  const contentWrapperRef = useRef<HTMLDivElement | null>(null); // For the transformable content

  const [containerDims, setContainerDims] = useState({
    width: 0,
    height: 0,
  });
  const [activeMediaDimensions, setActiveMediaDimensions] = useState({
    width: 1,
    height: 1,
  });

  const onResize = useCallback((el: ResizePayload) => {
    if (el.width && el.height) {
      setContainerDims({
        width: el.width,
        height: el.height,
      });
      // Reset zoom/pan on resize for simplicity
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
    }
  }, []);

  const {ref: containerRef} = useResizeDetector({onResize});

  const boundingBoxContainer = useMemo(() => {
    const {width, height} = activeMediaDimensions;
    if (width === 0 || height === 0 || containerDims.width === 0 || containerDims.height === 0) {
      return { width: 0, height: 0, offsetX: 0, offsetY: 0 };
    }
    const aspectRatio = width / height;
    const containerAspectRatio = containerDims.width / containerDims.height;
    let newWidth, newHeight;
    if (aspectRatio < containerAspectRatio) {
      newHeight = containerDims.height;
      newWidth = containerDims.height * aspectRatio;
    } else {
      newWidth = containerDims.width;
      newHeight = containerDims.width / aspectRatio;
    }
    return {
      width: newWidth,
      height: newHeight,
      // Calculate offset to center this within containerDims
      offsetX: (containerDims.width - newWidth) / 2,
      offsetY: (containerDims.height - newHeight) / 2,
    };
  }, [containerDims, activeMediaDimensions]);

  // Helper functions
  function matrixMultiply(m: number[][], v: number[]): number[] {
    return m.map((row: number[]) =>
      row.reduce((sum, val, i) => sum + val * v[i], 0),
    );
  }

  const linesAndLabels3D = useMemo(() => {
    if (!boundingBoxContainer || boundingBoxContainer.width === 0) {
      return null;
    }
    let allLines = [];
    let allLabels = [];
    for (const box of boundingBoxes3D) {
      const {center, size, rpy} = box;

      const [sr, sp, sy] = rpy.map((x) => Math.sin(x / 2));
      const [cr, cp, cz] = rpy.map((x) => Math.cos(x / 2));
      const quaternion = [
        sr * cp * cz - cr * sp * sy,
        cr * sp * cz + sr * cp * sy,
        cr * cp * sy - sr * sp * cz,
        cr * cp * cz + sr * sp * sy,
      ];

      const height = boundingBoxContainer.height;
      const width = boundingBoxContainer.width;
      const f = width / (2 * Math.tan(((fov / 2) * Math.PI) / 180));
      const cx = width / 2;
      const cy = height / 2;
      const intrinsics = [
        [f, 0, cx],
        [0, f, cy],
        [0, 0, 1],
      ];

      const halfSize = size.map((s) => s / 2);
      let corners = [];
      for (let x of [-halfSize[0], halfSize[0]]) {
        for (let y of [-halfSize[1], halfSize[1]]) {
          for (let z of [-halfSize[2], halfSize[2]]) {
            corners.push([x, y, z]);
          }
        }
      }
      corners = [
        corners[1],
        corners[3],
        corners[7],
        corners[5],
        corners[0],
        corners[2],
        corners[6],
        corners[4],
      ];

      const q = quaternion;
      const rotationMatrix = [
        [
          1 - 2 * q[1] ** 2 - 2 * q[2] ** 2,
          2 * q[0] * q[1] - 2 * q[3] * q[2],
          2 * q[0] * q[2] + 2 * q[3] * q[1],
        ],
        [
          2 * q[0] * q[1] + 2 * q[3] * q[2],
          1 - 2 * q[0] ** 2 - 2 * q[2] ** 2,
          2 * q[1] * q[2] - 2 * q[3] * q[0],
        ],
        [
          2 * q[0] * q[2] - 2 * q[3] * q[1],
          2 * q[1] * q[2] + 2 * q[3] * q[0],
          1 - 2 * q[0] ** 2 - 2 * q[1] ** 2,
        ],
      ];

      const boxVertices = corners.map((corner) => {
        const rotated = matrixMultiply(rotationMatrix, corner);
        return rotated.map((val, idx) => val + center[idx]);
      });

      const tiltAngle = 90.0;
      const viewRotationMatrix = [
        [1, 0, 0],
        [
          0,
          Math.cos((tiltAngle * Math.PI) / 180),
          -Math.sin((tiltAngle * Math.PI) / 180),
        ],
        [
          0,
          Math.sin((tiltAngle * Math.PI) / 180),
          Math.cos((tiltAngle * Math.PI) / 180),
        ],
      ];

      const points = boxVertices;
      const rotatedPoints = points.map((p) =>
        matrixMultiply(viewRotationMatrix, p),
      );
      const translatedPoints = rotatedPoints.map((p) => p.map((v) => v + 0));
      const projectedPoints = translatedPoints.map((p) =>
        matrixMultiply(intrinsics, p),
      );
      const vertices = projectedPoints.map((p) => [p[0] / p[2], p[1] / p[2]]);

      const topVertices = vertices.slice(0, 4);
      const bottomVertices = vertices.slice(4, 8);

      for (let i = 0; i < 4; i++) {
        const linesData = [
          [topVertices[i], topVertices[(i + 1) % 4]],
          [bottomVertices[i], bottomVertices[(i + 1) % 4]],
          [topVertices[i], bottomVertices[i]],
        ];

        for (let [start, end] of linesData) {
          const dx = end[0] - start[0];
          const dy = end[1] - start[1];
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          allLines.push({start, end, length, angle});
        }
      }
      const textPosition3d = points[0].map(
        (_, idx) => points.reduce((sum, p) => sum + p[idx], 0) / points.length,
      );
      textPosition3d[2] += 0.1;

      const textPoint = matrixMultiply(
        intrinsics,
        matrixMultiply(
          viewRotationMatrix,
          textPosition3d.map((v) => v + 0),
        ),
      );
      const textPos = [
        textPoint[0] / textPoint[2],
        textPoint[1] / textPoint[2],
      ];
      allLabels.push({label: box.label, pos: textPos});
    }
    return [allLines, allLabels] as const;
  }, [boundingBoxes3D, boundingBoxContainer, fov]);

  function setHoveredBox(e: React.PointerEvent) {
    const boxes = document.querySelectorAll('.bbox');
    const dimensionsAndIndex = Array.from(boxes).map((box, i) => {
      const {top, left, width, height} = box.getBoundingClientRect();
      return {
        top,
        left,
        width,
        height,
        index: i,
      };
    });
    const sorted = dimensionsAndIndex.sort(
      (a, b) => a.width * a.height - b.width * b.height,
    );
    const {clientX, clientY} = e;
    const found = sorted.find(({top, left, width, height}) => {
      return (
        clientX > left &&
        clientX < left + width &&
        clientY > top &&
        clientY < top + height
      );
    });
    if (found) {
      _setHoveredBox(found.index);
    } else {
      _setHoveredBox(null);
    }
  }

  const downRef = useRef<Boolean>(false);

  // Zoom and Pan Handlers
  const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!contentWrapperRef.current || !imageSrc || drawMode) return;
    e.preventDefault();

    const scaleAmount = 1.1;
    // Use containerRef's rect for mouse position relative to the viewport
    const viewportRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseX = e.clientX - viewportRect.left; // Mouse X relative to viewport
    const mouseY = e.clientY - viewportRect.top;  // Mouse Y relative to viewport

    const newZoomLevel = e.deltaY < 0 ? zoomLevel * scaleAmount : zoomLevel / scaleAmount;
    const clampedZoomLevel = Math.max(0.2, Math.min(newZoomLevel, 5));

    // Calculate new pan offset to keep the point under the mouse stationary
    // The panOffset is relative to the contentWrapper's initial centered position
    // (mouseX - panOffset.x - boundingBoxContainer.offsetX) is mouse pos relative to content origin before zoom
    // (mouseY - panOffset.y - boundingBoxContainer.offsetY)
    const newPanX = mouseX - (mouseX - panOffset.x - boundingBoxContainer.offsetX) * (clampedZoomLevel / zoomLevel) - boundingBoxContainer.offsetX;
    const newPanY = mouseY - (mouseY - panOffset.y - boundingBoxContainer.offsetY) * (clampedZoomLevel / zoomLevel) - boundingBoxContainer.offsetY;
    
    setZoomLevel(clampedZoomLevel);
    setPanOffset({ x: newPanX, y: newPanY });
  };

  const handlePointerDownPan = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!imageSrc || drawMode || !contentWrapperRef.current) return;
    if (drawMode) return; // Explicitly block if drawMode is on for contentWrapper
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    setIsPanning(true);
  };

  const handlePointerMovePan = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning || !imageSrc || drawMode) return;
    e.preventDefault();
    setPanOffset({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    });
  };

  const handlePointerUpPan = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!imageSrc || drawMode) return;
    if (isPanning) {
       (e.target as HTMLElement).releasePointerCapture(e.pointerId);
       setIsPanning(false);
    }
  };
  
  const zoomIn = () => {
    if (!contentWrapperRef.current || !imageSrc || drawMode) return;
    const newZoomLevel = Math.min(zoomLevel * 1.2, 5);
    const centerX = boundingBoxContainer.width / 2;
    const centerY = boundingBoxContainer.height / 2;
    const newPanX = centerX - (centerX - panOffset.x) * (newZoomLevel / zoomLevel);
    const newPanY = centerY - (centerY - panOffset.y) * (newZoomLevel / zoomLevel);
    setZoomLevel(newZoomLevel);
    setPanOffset({ x: newPanX, y: newPanY });
  };
  const zoomOut = () => {
    if (!contentWrapperRef.current || !imageSrc || drawMode) return;
    const newZoomLevel = Math.max(zoomLevel / 1.2, 0.2);
    const centerX = boundingBoxContainer.width / 2;
    const centerY = boundingBoxContainer.height / 2;
    const newPanX = centerX - (centerX - panOffset.x) * (newZoomLevel / zoomLevel);
    const newPanY = centerY - (centerY - panOffset.y) * (newZoomLevel / zoomLevel);
    setZoomLevel(newZoomLevel);
    setPanOffset({ x: newPanX, y: newPanY });
  };
  const resetZoomPan = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Coordinate normalization for drawing
  const getNormalizedCoordinates = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!contentWrapperRef.current || boundingBoxContainer.width === 0 || boundingBoxContainer.height === 0) return null;
    const rect = contentWrapperRef.current.getBoundingClientRect();

    const mouseXInWrapper = e.clientX - rect.left;
    const mouseYInWrapper = e.clientY - rect.top;

    const xOnUnzoomed = mouseXInWrapper / zoomLevel;
    const yOnUnzoomed = mouseYInWrapper / zoomLevel;
    
    const normalizedX = xOnUnzoomed / boundingBoxContainer.width;
    const normalizedY = yOnUnzoomed / boundingBoxContainer.height;

    return { x: normalizedX, y: normalizedY };
  };

  // Drawing handlers
  const handleDrawPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drawMode) return;
    const coords = getNormalizedCoordinates(e);
    if (coords) {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      downRef.current = true;
      setLines((prev) => [
        ...prev,
        [[[coords.x, coords.y]], activeColor],
      ]);
    }
  };

  const handleDrawPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drawMode || !downRef.current) return;
    const coords = getNormalizedCoordinates(e);
    if (coords) {
      setLines((prev) => [
        ...prev.slice(0, prev.length - 1),
        [
          [...prev[prev.length - 1][0], [coords.x, coords.y]],
          prev[prev.length - 1][1],
        ],
      ]);
    }
  };

  const handleDrawPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drawMode || !downRef.current) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    downRef.current = false;
  };

  const effectiveCursor = () => {
    if (drawMode) return 'crosshair';
    if (imageSrc) { // Only allow grab/grabbing if there's an image
        return isPanning ? 'grabbing' : 'grab';
    }
    return 'default';
  };


  return (
    <div 
      ref={containerRef} 
      className="w-full grow relative overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center" /* Darker bg for content, added flex for empty state */
      onWheel={imageSrc && !drawMode ? handleWheelZoom : undefined}
    >
      {!imageSrc && !stream && !isLoadingContent && (
        <div className="text-center p-6 text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-16 h-16 mx-auto mb-4 opacity-50">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p className="text-lg sm:text-xl font-medium mb-1">شروع کنید!</p>
          <p className="text-sm sm:text-base">یک تصویر بارگذاری کنید، صفحه نمایش خود را به اشتراک بگذارید، یا یکی از تصاویر نمونه را انتخاب نمایید.</p>
        </div>
      )}
      <div
        ref={contentWrapperRef}
        className={`absolute ${hoverEntered ? 'hide-box' : ''} ${(!imageSrc && !stream) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} // Hide if no content
        style={{
          width: boundingBoxContainer.width,
          height: boundingBoxContainer.height,
          left: boundingBoxContainer.offsetX,
          top: boundingBoxContainer.offsetY,
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: '0 0',
          cursor: effectiveCursor(),
          touchAction: (imageSrc && !drawMode) || drawMode ? 'none' : 'auto', 
        }}
        onPointerEnter={(e) => {
          if (revealOnHover && !drawMode && imageSrc) {
            setHoverEntered(true);
            setHoveredBox(e);
          }
        }}
        onPointerMove={(e) => {
          if (drawMode) {
            handleDrawPointerMove(e);
          } else if (isPanning && imageSrc) {
            handlePointerMovePan(e);
          } else if (revealOnHover && imageSrc) {
            setHoverEntered(true);
            setHoveredBox(e);
          }
        }}
        onPointerLeave={(e) => {
          if (revealOnHover && !drawMode && imageSrc) {
            setHoverEntered(false);
            setHoveredBox(e);
          }
          if (isPanning) { 
             handlePointerUpPan(e);
          }
        }}
        onPointerDown={(e) => {
          if (drawMode) {
            handleDrawPointerDown(e);
          } else if (imageSrc) { 
            handlePointerDownPan(e);
          }
        }}
        onPointerUp={(e) => {
          if (drawMode) {
            handleDrawPointerUp(e);
          } else if (imageSrc) {
            handlePointerUpPan(e);
          }
        }}
        >
        {stream ? (
          <video
            className="absolute top-0 left-0 w-full h-full object-contain"
            autoPlay
            onLoadedMetadata={(e) => {
              setActiveMediaDimensions({
                width: e.currentTarget.videoWidth,
                height: e.currentTarget.videoHeight,
              });
              resetZoomPan(); 
            }}
            ref={(video) => {
              videoRef.current = video;
              if (video && !video.srcObject) {
                video.srcObject = stream;
              }
            }}
          />
        ) : imageSrc ? (
          <img
            src={imageSrc}
            className="absolute top-0 left-0 w-full h-full object-contain"
            alt="تصویر بارگذاری شده"
            onLoad={(e) => {
              setActiveMediaDimensions({
                width: e.currentTarget.naturalWidth,
                height: e.currentTarget.naturalHeight,
              });
              resetZoomPan(); 
            }}
            draggable="false" 
          />
        ) : null}
        
        {lines.length > 0 && boundingBoxContainer.width > 0 && (
          <svg
            className="absolute top-0 left-0 w-full h-full"
            style={{
              pointerEvents: 'none', 
            }}>
            {lines.map(([points, color], i) => (
              <path
                key={i}
                d={getSvgPathFromStroke(
                  getStroke(
                    points.map(([x, y]) => [
                      x * boundingBoxContainer.width, 
                      y * boundingBoxContainer.height,
                      0.5,
                    ]),
                    lineOptions,
                  ),
                )}
                fill={color}
              />
            ))}
          </svg>
        )}
        {detectType === '2D bounding boxes' &&
          boundingBoxes2D.map((box, i) => (
            <div
              key={i}
              className={`absolute bbox border-2 border-[var(--accent-color)] ${i === hoveredBox ? 'reveal' : ''}`}
              style={{
                transformOrigin: '0 0',
                top: box.y * 100 + '%',
                left: box.x * 100 + '%',
                width: box.width * 100 + '%',
                height: box.height * 100 + '%',
              }}>
              <div className="bg-[var(--accent-color)] text-white absolute right-0 top-0 text-xs sm:text-sm px-1 py-0.5 rounded-bl-md">
                {box.label}
              </div>
            </div>
          ))}
        {detectType === 'Segmentation masks' &&
          boundingBoxMasks.map((box, i) => (
            <div
              key={i}
              className={`absolute bbox border-2 border-[var(--accent-color)] ${i === hoveredBox ? 'reveal' : ''}`}
              style={{
                transformOrigin: '0 0',
                top: box.y * 100 + '%',
                left: box.x * 100 + '%',
                width: box.width * 100 + '%',
                height: box.height * 100 + '%',
              }}>
              <BoxMask box={box} index={i} />
              <div className="w-full top-0 h-0 absolute">
                <div className="bg-[var(--accent-color)] text-white absolute -right-[2px] bottom-0 text-xs sm:text-sm px-1 py-0.5 rounded-tl-md">
                  {box.label}
                </div>
              </div>
            </div>
          ))}

        {detectType === 'Points' &&
          points.map((point, i) => {
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${point.point.x * 100}%`,
                  top: `${point.point.y * 100}%`,
                }}>
                <div className="absolute bg-[var(--accent-color)] text-center text-white text-xs px-1.5 py-0.5 bottom-5 rounded-md -translate-x-1/2 left-1/2 whitespace-nowrap">
                  {point.label}
                </div>
                <div className="absolute w-3.5 h-3.5 bg-[var(--accent-color)] rounded-full border-white border-2 -translate-x-1/2 -translate-y-1/2 shadow-md"></div>
              </div>
            );
          })}
        {detectType === '3D bounding boxes' && linesAndLabels3D ? (
          <>
            {linesAndLabels3D[0].map((line, i) => (
              <div
                key={i}
                className="absolute h-[2px] bg-[var(--accent-color)]"
                style={{
                  width: `${line.length}px`,
                  transform: `translate(${line.start[0]}px, ${line.start[1]}px) rotate(${line.angle}rad)`,
                  transformOrigin: '0 0',
                }}></div>
            ))}
            {linesAndLabels3D[1].map((label, i) => (
              <div
                key={i}
                className="absolute bg-[var(--accent-color)] text-white text-xs px-1.5 py-0.5 rounded-md"
                style={{
                  top: `${label.pos[1]}px`,
                  left: `${label.pos[0]}px`,
                  transform: 'translate(-50%, -50%)',
                }}>
                {label.label}
              </div>
            ))}
          </>
        ) : null}
      </div>

      {/* Zoom Controls UI (fixed position relative to containerRef) */}
      {imageSrc && !drawMode && (
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10 flex flex-col gap-1.5 p-1 bg-white/70 dark:bg-black/70 rounded-lg shadow-lg backdrop-blur-md">
          <button 
            onClick={zoomIn} 
            className="button !p-1.5 sm:!p-2 !min-h-0 aspect-square leading-none transition-colors hover:bg-black/10 dark:hover:bg-white/10" 
            aria-label="بزرگنمایی" 
            title="بزرگنمایی">
            <ZoomInIcon />
          </button>
          <button 
            onClick={zoomOut} 
            className="button !p-1.5 sm:!p-2 !min-h-0 aspect-square leading-none transition-colors hover:bg-black/10 dark:hover:bg-white/10" 
            aria-label="کوچکنمایی" 
            title="کوچکنمایی">
            <ZoomOutIcon />
          </button>
          <button 
            onClick={resetZoomPan} 
            className="button !p-1.5 sm:!p-2 !min-h-0 aspect-square leading-none transition-colors hover:bg-black/10 dark:hover:bg-white/10" 
            aria-label="بازنشانی نما" 
            title="بازنشانی نما">
            <ResetZoomIcon />
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoadingContent && (
        <div 
          className="absolute inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm transition-opacity duration-300"
          role="status"
          aria-live="polite"
          aria-label="در حال بارگذاری محتوا"
        >
          <div className="text-white text-lg sm:text-xl font-semibold p-4 bg-black/60 dark:bg-white/30 rounded-lg shadow-xl">
            در حال بارگذاری...
          </div>
        </div>
      )}
    </div>
  );
}

function BoxMask({
  box,
  index,
}: {
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    imageData: string;
  };
  index: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rgb = segmentationColorsRgb[index % segmentationColorsRgb.length];

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const image = new Image();
        image.src = box.imageData;
        image.onload = () => {
          canvasRef.current!.width = image.width;
          canvasRef.current!.height = image.height;
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(image, 0, 0);
          const pixels = ctx.getImageData(0, 0, image.width, image.height);
          const data = pixels.data;
          for (let i = 0; i < data.length; i += 4) {
            data[i + 3] = data[i]; 
            data[i] = rgb[0];     
            data[i + 1] = rgb[1];
            data[i + 2] = rgb[2];
          }
          ctx.putImageData(pixels, 0, 0);
        };
      }
    }
  }, [canvasRef, box.imageData, rgb]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full"
      style={{opacity: 0.55}} /* Slightly increased opacity for better visibility */
    />
  );
}