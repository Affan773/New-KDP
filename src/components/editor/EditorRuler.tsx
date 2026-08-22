import React from 'react';
import { RulerUnit } from '../../context/EditorContext';

interface EditorRulerProps {
  orientation: 'horizontal' | 'vertical';
  lengthPx: number; // Page width or height in unscaled pixels
  zoom: number;
  unit: RulerUnit;
  mousePos: number | null; // unscaled pixel position of mouse
  dpi?: number;
}

export const EditorRuler: React.FC<EditorRulerProps> = ({
  orientation,
  lengthPx,
  zoom,
  unit,
  mousePos,
  dpi = 96,
}) => {
  const isHorizontal = orientation === 'horizontal';
  const scaledLength = lengthPx * zoom;

  // In inches mode: 96px = 1 inch
  // In px mode: 1px = 1px
  const unitSizePx = unit === 'in' ? dpi : 100;
  const majorTickStep = unit === 'in' ? 1 : 100; // 1 inch or 100px
  const minorTicksPerMajor = unit === 'in' ? 8 : 10; // 1/8 inch ticks or 10px ticks

  const totalUnits = unit === 'in' ? lengthPx / dpi : lengthPx / 100;
  const majorTicksCount = Math.ceil(totalUnits) + 1;

  return (
    <div
      style={{
        width: isHorizontal ? `${scaledLength}px` : '24px',
        height: isHorizontal ? '24px' : `${scaledLength}px`,
      }}
      className={`bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-800 text-[9px] font-mono text-neutral-500 dark:text-neutral-400 select-none relative overflow-hidden shrink-0 ${
        isHorizontal ? 'border-b' : 'border-r'
      }`}
    >
      {/* Ticks and Labels */}
      {Array.from({ length: majorTicksCount }).map((_, i) => {
        const majorPosPx = i * unitSizePx * zoom;
        if (majorPosPx > scaledLength + 10) return null;

        const label = unit === 'in' ? `${i}"` : `${i * 100}`;

        return (
          <React.Fragment key={`major-${i}`}>
            {/* Major tick mark */}
            <div
              style={{
                [isHorizontal ? 'left' : 'top']: `${majorPosPx}px`,
                [isHorizontal ? 'bottom' : 'right']: 0,
                [isHorizontal ? 'width' : 'height']: '1px',
                [isHorizontal ? 'height' : 'width']: '12px',
              }}
              className="absolute bg-neutral-400 dark:bg-neutral-600 pointer-events-none"
            />

            {/* Major tick label */}
            <span
              style={{
                [isHorizontal ? 'left' : 'top']: `${majorPosPx + 3}px`,
                [isHorizontal ? 'top' : 'left']: '2px',
                transform: isHorizontal ? 'none' : 'rotate(-90deg)',
                transformOrigin: 'top left',
              }}
              className="absolute font-bold text-[8px] leading-none pointer-events-none opacity-80"
            >
              {label}
            </span>

            {/* Minor ticks between major ticks */}
            {Array.from({ length: minorTicksPerMajor - 1 }).map((_, mIdx) => {
              const minorPosPx = majorPosPx + ((mIdx + 1) * (unitSizePx / minorTicksPerMajor)) * zoom;
              if (minorPosPx > scaledLength) return null;

              const isHalf = (mIdx + 1) === minorTicksPerMajor / 2;
              const tickHeight = isHalf ? 8 : 4;

              return (
                <div
                  key={`minor-${i}-${mIdx}`}
                  style={{
                    [isHorizontal ? 'left' : 'top']: `${minorPosPx}px`,
                    [isHorizontal ? 'bottom' : 'right']: 0,
                    [isHorizontal ? 'width' : 'height']: '1px',
                    [isHorizontal ? 'height' : 'width']: `${tickHeight}px`,
                  }}
                  className="absolute bg-neutral-300 dark:bg-neutral-700 pointer-events-none"
                />
              );
            })}
          </React.Fragment>
        );
      })}

      {/* Mouse position tracking indicator line */}
      {mousePos !== null && mousePos >= 0 && mousePos <= lengthPx && (
        <div
          style={{
            [isHorizontal ? 'left' : 'top']: `${mousePos * zoom}px`,
            [isHorizontal ? 'top' : 'left']: 0,
            [isHorizontal ? 'width' : 'height']: '1.5px',
            [isHorizontal ? 'height' : 'width']: '100%',
          }}
          className="absolute bg-amber-500 z-20 pointer-events-none shadow-xs"
        />
      )}
    </div>
  );
};
