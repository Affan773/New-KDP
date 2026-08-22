import React from 'react';
import {
  GeneratedPuzzle,
  PuzzleStyleOptions,
  PuzzleVisualPresetKey,
  WordSearchData,
  SudokuData,
  CrosswordData,
  MazeData,
  CryptogramData,
  WordScrambleData,
  NumberPuzzleData,
  LogicGridData,
  WordSearchSettings,
  SudokuSettings,
} from '../types';

export const VISUAL_PRESETS: Record<PuzzleVisualPresetKey, Partial<PuzzleStyleOptions>> = {
  clean_editorial: {
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    textColor: '#1E293B',
    borderColor: '#334155',
    lineColor: '#64748B',
    highlightColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
    gridBorderWidth: 1.5,
    cellBorderWidth: 1,
    borderStyle: 'solid',
  },
  modern_bold: {
    fontFamily: 'Inter, sans-serif',
    textColor: '#0F172A',
    borderColor: '#0F172A',
    lineColor: '#334155',
    highlightColor: '#6366F1',
    backgroundColor: '#FFFFFF',
    gridBorderWidth: 2.5,
    cellBorderWidth: 1.5,
    borderStyle: 'solid',
  },
  minimalist_slate: {
    fontFamily: 'Inter, sans-serif',
    textColor: '#334155',
    borderColor: '#94A3B8',
    lineColor: '#CBD5E1',
    highlightColor: '#06B6D4',
    backgroundColor: '#F8FAFC',
    gridBorderWidth: 1,
    cellBorderWidth: 0.5,
    borderStyle: 'solid',
  },
  warm_golden: {
    fontFamily: 'Merriweather, serif',
    textColor: '#292524',
    borderColor: '#78350F',
    lineColor: '#B45309',
    highlightColor: '#FBBF24',
    backgroundColor: '#FFFDF9',
    gridBorderWidth: 2,
    cellBorderWidth: 1,
    borderStyle: 'solid',
  },
  classic_charcoal: {
    fontFamily: 'Courier New, monospace',
    textColor: '#000000',
    borderColor: '#000000',
    lineColor: '#000000',
    highlightColor: '#FEF08A',
    backgroundColor: '#FFFFFF',
    gridBorderWidth: 2,
    cellBorderWidth: 1,
    borderStyle: 'solid',
  },
  blueprint_blue: {
    fontFamily: 'Roboto Mono, monospace',
    textColor: '#0F2942',
    borderColor: '#0284C7',
    lineColor: '#38BDF8',
    highlightColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
    gridBorderWidth: 2,
    cellBorderWidth: 1,
    borderStyle: 'solid',
  },
  forest_botanical: {
    fontFamily: 'Playfair Display, serif',
    textColor: '#064E3B',
    borderColor: '#047857',
    lineColor: '#10B981',
    highlightColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
    gridBorderWidth: 1.5,
    cellBorderWidth: 1,
    borderStyle: 'solid',
  },
};

export const DEFAULT_PUZZLE_STYLE: PuzzleStyleOptions = {
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  titleFontSize: 16,
  subtitleFontSize: 12,
  instructionsFontSize: 10,
  gridFontSize: 13,
  clueFontSize: 10,
  textColor: '#111827',
  borderColor: '#111827',
  titleColor: '#111827',
  instructionsColor: '#6B7280',
  gridBorderWidth: 2,
  cellBorderWidth: 1,
  cellPadding: 2,
  lineColor: '#374151',
  highlightColor: '#F59E0B',
  showTitle: true,
  showSubtitle: true,
  showPuzzleNumber: true,
  showInstructions: true,
  showWordBank: true,
  showSolution: false,
  backgroundColor: '#FFFFFF',
  layoutColumns: 1,
  presetKey: 'clean_editorial',
  borderStyle: 'solid',
};

interface PuzzleRendererProps {
  puzzle: GeneratedPuzzle;
  styleOptions?: Partial<PuzzleStyleOptions>;
  showSolutionOverride?: boolean;
  width?: number;
  height?: number;
}

export const PuzzleRenderer: React.FC<PuzzleRendererProps> = ({
  puzzle,
  styleOptions = {},
  showSolutionOverride,
  width,
  height,
}) => {
  const presetConfig = styleOptions.presetKey ? VISUAL_PRESETS[styleOptions.presetKey] : {};
  const style: PuzzleStyleOptions = {
    ...DEFAULT_PUZZLE_STYLE,
    ...presetConfig,
    ...styleOptions,
  };
  const showSolution = showSolutionOverride !== undefined ? showSolutionOverride : style.showSolution;

  const wsSettings = puzzle.type === 'word_search' ? (puzzle.settings as WordSearchSettings) : null;
  const wordListPos = wsSettings?.wordListPosition || 'bottom';
  const showWordList = style.showWordBank && puzzle.type === 'word_search' && wordListPos !== 'hidden';

  return (
    <div
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
        backgroundColor: style.backgroundColor || '#FFFFFF',
        color: style.textColor || '#111827',
        fontFamily: style.fontFamily,
      }}
      className="p-3 sm:p-4 select-none flex flex-col justify-between overflow-hidden relative box-border"
    >
      {/* HEADER SECTION */}
      {style.showTitle && (
        <div className="text-center mb-2 pb-1.5 border-b border-neutral-200/80 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <h3
              style={{
                fontSize: `${style.titleFontSize}px`,
                color: style.titleColor || style.textColor || '#111827',
              }}
              className="font-bold uppercase tracking-wider truncate flex-1 text-center"
            >
              {puzzle.title || puzzle.type}
            </h3>
            {showSolution && (
              <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-500 text-neutral-950 rounded-full shadow-xs shrink-0">
                SOLUTION KEY
              </span>
            )}
          </div>

          {style.showSubtitle && puzzle.settings?.subtitle && (
            <p
              style={{ fontSize: `${style.subtitleFontSize || 11}px` }}
              className="text-neutral-600 font-medium mt-0.5 truncate"
            >
              {String(puzzle.settings.subtitle)}
            </p>
          )}

          {style.showInstructions && (
            <p
              style={{
                fontSize: `${style.instructionsFontSize || 10}px`,
                color: style.instructionsColor || '#6B7280',
              }}
              className="italic mt-0.5"
            >
              {puzzle.settings?.instructions || getInstructions(puzzle.type, showSolution)}
            </p>
          )}
        </div>
      )}

      {/* TOP WORD BANK (IF POSITIONED TOP) */}
      {showWordList && wordListPos === 'top' && (
        <WordSearchBank
          data={puzzle.data as WordSearchData}
          settings={wsSettings}
          style={style}
          showSolution={showSolution}
          className="mb-3 pb-2 border-b border-neutral-200/80"
        />
      )}

      {/* PUZZLE CONTENT VIEW (WITH OPTIONAL SIDEBAR FOR LEFT/RIGHT WORD LIST) */}
      <div className={`flex-1 flex items-center justify-center overflow-hidden min-h-0 ${
        showWordList && (wordListPos === 'left' || wordListPos === 'right') ? 'flex-row gap-3' : 'flex-col'
      }`}>
        {/* LEFT WORD BANK */}
        {showWordList && wordListPos === 'left' && (
          <div className="w-1/3 max-h-full overflow-y-auto pr-2 border-r border-neutral-200">
            <WordSearchBank
              data={puzzle.data as WordSearchData}
              settings={wsSettings}
              style={style}
              showSolution={showSolution}
            />
          </div>
        )}

        <div className="flex-1 flex items-center justify-center overflow-hidden w-full h-full min-h-0">
          {puzzle.type === 'word_search' && (
            <WordSearchGrid
              data={puzzle.data as WordSearchData}
              settings={puzzle.settings as WordSearchSettings}
              style={style}
              showSolution={showSolution}
            />
          )}

          {puzzle.type === 'sudoku' && (
            <SudokuGrid
              data={puzzle.data as SudokuData}
              settings={puzzle.settings as SudokuSettings}
              style={style}
              showSolution={showSolution}
            />
          )}

          {puzzle.type === 'crossword' && (
            <CrosswordGrid
              data={puzzle.data as CrosswordData}
              style={style}
              showSolution={showSolution}
            />
          )}

          {puzzle.type === 'maze' && (
            <MazeGrid
              data={puzzle.data as MazeData}
              style={style}
              showSolution={showSolution}
            />
          )}

          {puzzle.type === 'cryptogram' && (
            <CryptogramView
              data={puzzle.data as CryptogramData}
              style={style}
              showSolution={showSolution}
            />
          )}

          {puzzle.type === 'word_scramble' && (
            <WordScrambleView
              data={puzzle.data as WordScrambleData}
              style={style}
              showSolution={showSolution}
            />
          )}

          {puzzle.type === 'number_puzzle' && (
            <NumberPuzzleView
              data={puzzle.data as NumberPuzzleData}
              style={style}
              showSolution={showSolution}
            />
          )}

          {puzzle.type === 'logic_grid' && (
            <LogicGridView
              data={puzzle.data as LogicGridData}
              style={style}
              showSolution={showSolution}
            />
          )}
        </div>

        {/* RIGHT WORD BANK */}
        {showWordList && wordListPos === 'right' && (
          <div className="w-1/3 max-h-full overflow-y-auto pl-2 border-l border-neutral-200">
            <WordSearchBank
              data={puzzle.data as WordSearchData}
              settings={wsSettings}
              style={style}
              showSolution={showSolution}
            />
          </div>
        )}
      </div>

      {/* BOTTOM WORD BANK (DEFAULT) */}
      {showWordList && (wordListPos === 'bottom' || !wordListPos) && (
        <WordSearchBank
          data={puzzle.data as WordSearchData}
          settings={wsSettings}
          style={style}
          showSolution={showSolution}
          className="mt-2.5 pt-2 border-t border-neutral-200/80 shrink-0"
        />
      )}
    </div>
  );
};

function getInstructions(type: string, showSolution: boolean): string {
  if (showSolution) return 'Answer key and completed solution.';
  switch (type) {
    case 'word_search':
      return 'Find all the hidden words in the letter grid in any direction.';
    case 'sudoku':
      return 'Fill each row, column, and block with numbers 1 to 9 without repeating.';
    case 'crossword':
      return 'Use the numbered clues to fill in the crossword grid.';
    case 'maze':
      return 'Navigate from the green start arrow to the red finish flag.';
    case 'cryptogram':
      return 'Decrypt the substitution cipher to reveal the inspirational quote.';
    case 'word_scramble':
      return 'Unscramble each jumbled word to find the secret vocabulary term.';
    case 'number_puzzle':
      return 'Discover the mathematical pattern to calculate the missing numbers.';
    case 'logic_grid':
      return 'Deduce the correct pairings using only the clues provided.';
    default:
      return 'Complete the puzzle challenge.';
  }
}

// ================= WORD SEARCH BANK =================

const WordSearchBank: React.FC<{
  data: WordSearchData;
  settings?: WordSearchSettings | null;
  style: PuzzleStyleOptions;
  showSolution: boolean;
  className?: string;
}> = ({ data, settings, style, showSolution, className = '' }) => {
  const words = data.words || [];
  if (words.length === 0) return null;

  const cols = settings?.wordListColumns || (words.length > 15 ? 4 : words.length > 8 ? 3 : 2);
  const gridColClass =
    cols === 4 ? 'grid-cols-4' : cols === 3 ? 'grid-cols-3' : cols === 2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <div className={className}>
      <div
        style={{ fontSize: `${Math.max(9, style.clueFontSize)}px` }}
        className="font-bold uppercase tracking-wider text-neutral-500 mb-1 flex items-center justify-between"
      >
        <span>Word List ({words.length})</span>
      </div>
      <div
        style={{ fontSize: `${style.clueFontSize}px` }}
        className={`grid ${gridColClass} gap-x-2 gap-y-0.5 font-medium text-neutral-800`}
      >
        {words.map((word, idx) => (
          <div
            key={idx}
            className={`truncate flex items-center gap-1 ${
              showSolution ? 'font-bold text-amber-700' : ''
            }`}
          >
            <span className="text-neutral-400">•</span>
            <span>{word}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ================= WORD SEARCH GRID =================

const WordSearchGrid: React.FC<{
  data: WordSearchData;
  settings?: WordSearchSettings;
  style: PuzzleStyleOptions;
  showSolution: boolean;
}> = ({ data, settings, style, showSolution }) => {
  const { grid, placements } = data;
  if (!grid || grid.length === 0) return null;

  const rows = grid.length;
  const cols = grid[0].length;
  const solutionMode = settings?.solutionMode || 'highlight';

  // Build a set of solution coordinates
  const solutionCoords = new Set<string>();
  if (showSolution && placements && solutionMode !== 'answer_list_only') {
    for (const p of placements) {
      const [dRow, dCol] = p.direction;
      for (let i = 0; i < p.word.length; i++) {
        solutionCoords.add(`${p.startRow + i * dRow},${p.startCol + i * dCol}`);
      }
    }
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gap: '2px',
        fontSize: `${style.gridFontSize}px`,
        borderColor: style.borderColor || '#CBD5E1',
        borderWidth: `${style.gridBorderWidth || 1}px`,
        borderStyle: style.borderStyle || 'solid',
      }}
      className="w-full max-w-lg aspect-square p-2 rounded bg-neutral-50/50 font-mono font-bold text-center select-none"
    >
      {grid.map((row, r) =>
        row.map((letter, c) => {
          const isSolved = solutionCoords.has(`${r},${c}`);

          let cellBg = 'transparent';
          let cellBorder = 'transparent';
          let cellRadius = '2px';
          let textDecoration = 'none';

          if (isSolved) {
            if (solutionMode === 'highlight') {
              cellBg = style.highlightColor || '#FDE68A';
            } else if (solutionMode === 'capsule') {
              cellBg = `${style.highlightColor || '#F59E0B'}33`;
              cellBorder = style.highlightColor || '#F59E0B';
              cellRadius = '9999px';
            } else if (solutionMode === 'circle') {
              cellBorder = style.highlightColor || '#F59E0B';
              cellRadius = '9999px';
            } else if (solutionMode === 'underline') {
              textDecoration = 'underline';
            }
          }

          return (
            <div
              key={`${r}-${c}`}
              style={{
                backgroundColor: cellBg,
                borderColor: cellBorder,
                borderWidth: cellBorder !== 'transparent' ? '1.5px' : '0px',
                borderRadius: cellRadius,
                textDecoration,
                color: isSolved && solutionMode === 'highlight' ? '#000000' : style.textColor || '#111827',
              }}
              className={`flex items-center justify-center transition-all ${
                isSolved ? 'font-black scale-105 shadow-2xs' : ''
              }`}
            >
              {letter}
            </div>
          );
        })
      )}
    </div>
  );
};

// ================= SUDOKU GRID =================

const ROMAN_NUMERALS: Record<number, string> = {
  1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V',
  6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX',
};

const CIRCLED_NUMERALS: Record<number, string> = {
  1: '①', 2: '②', 3: '③', 4: '④', 5: '⑤',
  6: '⑥', 7: '⑦', 8: '⑧', 9: '⑨',
};

const SudokuGrid: React.FC<{
  data: SudokuData;
  settings?: SudokuSettings;
  style: PuzzleStyleOptions;
  showSolution: boolean;
}> = ({ data, settings, style, showSolution }) => {
  const { size, initialGrid, solutionGrid, boxWidth, boxHeight } = data;
  const displayGrid = showSolution ? solutionGrid : initialGrid;
  const numberStyle = settings?.numberStyle || 'standard';

  if (!displayGrid) return null;

  const formatNumber = (val: number | null): string => {
    if (!val) return '';
    if (numberStyle === 'roman') return ROMAN_NUMERALS[val] || String(val);
    if (numberStyle === 'circled') return CIRCLED_NUMERALS[val] || String(val);
    return String(val);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
        borderWidth: `${style.gridBorderWidth || 2}px`,
        borderColor: style.borderColor || '#111827',
        fontSize: `${style.gridFontSize || 14}px`,
      }}
      className="w-full max-w-sm aspect-square bg-white font-mono font-bold text-center border-solid"
    >
      {displayGrid.map((row, r) =>
        row.map((val, c) => {
          const isInitialClue = initialGrid && initialGrid[r][c] !== null;
          const isThickRight = (c + 1) % boxWidth === 0 && c !== size - 1;
          const isThickBottom = (r + 1) % boxHeight === 0 && r !== size - 1;

          return (
            <div
              key={`${r}-${c}`}
              style={{
                borderRightWidth: isThickRight ? '2.5px' : `${style.cellBorderWidth || 1}px`,
                borderBottomWidth: isThickBottom ? '2.5px' : `${style.cellBorderWidth || 1}px`,
                borderColor: style.borderColor || '#111827',
                color: isInitialClue ? '#000000' : showSolution ? '#D97706' : style.textColor,
                fontWeight: isInitialClue ? '900' : '600',
              }}
              className="flex items-center justify-center border-solid"
            >
              {formatNumber(val)}
            </div>
          );
        })
      )}
    </div>
  );
};

// ================= CROSSWORD GRID =================

const CrosswordGrid: React.FC<{ data: CrosswordData; style: PuzzleStyleOptions; showSolution: boolean }> = ({
  data,
  style,
  showSolution,
}) => {
  const { size, grid, numbers, acrossEntries, downEntries, solutionGrid } = data;
  if (!grid) return null;

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-3 items-center">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          borderWidth: `${style.gridBorderWidth || 1}px`,
          borderColor: style.borderColor || '#111827',
        }}
        className="w-full max-w-[280px] aspect-square bg-neutral-900 border-solid shrink-0"
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isWhite = cell !== null;
            const num = numbers && numbers[r][c];
            const letter = showSolution ? solutionGrid[r][c] : '';

            return (
              <div
                key={`${r}-${c}`}
                style={{
                  backgroundColor: isWhite ? '#FFFFFF' : '#111827',
                  borderWidth: '0.5px',
                  borderColor: '#9CA3AF',
                }}
                className="relative flex items-center justify-center border-solid select-none"
              >
                {num && (
                  <span className="absolute top-0.5 left-0.5 text-[7px] font-sans font-bold leading-none text-neutral-700">
                    {num}
                  </span>
                )}
                {isWhite && letter && (
                  <span
                    style={{ fontSize: `${style.gridFontSize}px` }}
                    className="font-mono font-bold text-neutral-900"
                  >
                    {letter}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CLUES LIST */}
      <div className="flex-1 max-h-48 overflow-y-auto space-y-2 text-[9px] text-neutral-700">
        <div>
          <span className="font-bold uppercase text-neutral-900 block mb-0.5">Across:</span>
          {acrossEntries?.map(e => (
            <div key={`across-${e.number}`} className="mb-0.5">
              <b>{e.number}.</b> {e.clue} {showSolution && <span className="text-amber-600 font-bold">({e.word})</span>}
            </div>
          ))}
        </div>
        <div>
          <span className="font-bold uppercase text-neutral-900 block mb-0.5">Down:</span>
          {downEntries?.map(e => (
            <div key={`down-${e.number}`} className="mb-0.5">
              <b>{e.number}.</b> {e.clue} {showSolution && <span className="text-amber-600 font-bold">({e.word})</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ================= MAZE GRID =================

const MazeGrid: React.FC<{ data: MazeData; style: PuzzleStyleOptions; showSolution: boolean }> = ({
  data,
  style,
  showSolution,
}) => {
  const { width, height, grid, start, end, solutionPath } = data;
  if (!grid || grid.length === 0) return null;

  const cellPx = 10;
  const svgWidth = width * cellPx;
  const svgHeight = height * cellPx;

  return (
    <div className="w-full max-w-sm aspect-square flex items-center justify-center">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full stroke-neutral-900 fill-none"
        style={{ strokeWidth: `${style.gridBorderWidth || 1.5}px` }}
      >
        {/* Draw Cell Walls */}
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const x1 = c * cellPx;
            const y1 = r * cellPx;
            const x2 = x1 + cellPx;
            const y2 = y1 + cellPx;

            return (
              <g key={`${r}-${c}`}>
                {cell.walls.top && <line x1={x1} y1={y1} x2={x2} y2={y1} />}
                {cell.walls.right && <line x1={x2} y1={y1} x2={x2} y2={y2} />}
                {cell.walls.bottom && <line x1={x1} y1={y2} x2={x2} y2={y2} />}
                {cell.walls.left && <line x1={x1} y1={y1} x2={x1} y2={y2} />}
              </g>
            );
          })
        )}

        {/* Start & Finish Markers */}
        <circle
          cx={start.col * cellPx + cellPx / 2}
          cy={start.row * cellPx + cellPx / 2}
          r={cellPx / 3}
          fill="#10B981"
          stroke="none"
        />
        <circle
          cx={end.col * cellPx + cellPx / 2}
          cy={end.row * cellPx + cellPx / 2}
          r={cellPx / 3}
          fill="#EF4444"
          stroke="none"
        />

        {/* Solution Path Overlay */}
        {showSolution && solutionPath && solutionPath.length > 0 && (
          <path
            d={solutionPath.reduce(
              (acc, pt, idx) =>
                `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.col * cellPx + cellPx / 2} ${pt.row * cellPx + cellPx / 2}`,
              ''
            )}
            stroke={style.highlightColor || '#F59E0B'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  );
};

// ================= CRYPTOGRAM VIEW =================

const CryptogramView: React.FC<{ data: CryptogramData; style: PuzzleStyleOptions; showSolution: boolean }> = ({
  data,
  style,
  showSolution,
}) => {
  const { ciphertext, plaintext, author, hints } = data;
  const words = ciphertext.split(' ');
  const plainWords = plaintext.split(' ');

  return (
    <div className="w-full max-w-md p-3 space-y-4">
      <div className="flex flex-wrap gap-x-4 gap-y-5 justify-center">
        {words.map((word, wIdx) => (
          <div key={wIdx} className="flex gap-1">
            {word.split('').map((char, cIdx) => {
              const isLetter = /[A-Z]/.test(char);
              const plainChar = plainWords[wIdx]?.[cIdx] || '';
              const hintVal = hints ? hints[char] : undefined;

              return (
                <div key={cIdx} className="flex flex-col items-center">
                  <div
                    style={{ fontSize: `${style.gridFontSize || 14}px` }}
                    className="h-6 flex items-center justify-center font-bold text-amber-600 font-mono"
                  >
                    {showSolution ? plainChar : hintVal || ''}
                  </div>
                  <div
                    style={{
                      borderColor: isLetter ? style.borderColor || '#111827' : 'transparent',
                    }}
                    className="w-5 border-b-2 text-center text-xs font-mono font-bold text-neutral-900 pt-0.5"
                  >
                    {char}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {author && (
        <div className="text-right text-xs text-neutral-500 font-semibold italic">
          — {showSolution ? author : '???'}
        </div>
      )}
    </div>
  );
};

// ================= WORD SCRAMBLE VIEW =================

const WordScrambleView: React.FC<{ data: WordScrambleData; style: PuzzleStyleOptions; showSolution: boolean }> = ({
  data,
  showSolution,
}) => {
  const { items } = data;
  if (!items) return null;

  return (
    <div className="w-full max-w-md space-y-2 p-2 font-mono text-xs">
      {items.map((it, idx) => (
        <div
          key={it.id}
          className="flex items-center justify-between p-2 rounded bg-neutral-50 border border-neutral-200"
        >
          <div className="flex items-center gap-3">
            <span className="font-bold text-neutral-400 w-5">{idx + 1}.</span>
            <span className="font-bold tracking-widest text-neutral-900">{it.scrambled}</span>
          </div>

          <div className="flex items-center gap-2">
            {showSolution ? (
              <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                {it.original}
              </span>
            ) : (
              <span className="text-neutral-300 font-normal">________________</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ================= NUMBER PUZZLE VIEW =================

const NumberPuzzleView: React.FC<{ data: NumberPuzzleData; style: PuzzleStyleOptions; showSolution: boolean }> = ({
  data,
  showSolution,
}) => {
  const { sequences, missingNumbers, subType } = data;

  if (subType === 'sequence' && sequences) {
    return (
      <div className="w-full max-w-md space-y-2 p-2 font-mono text-xs">
        {sequences.map((s, idx) => (
          <div
            key={s.id}
            className="flex items-center justify-between p-2 rounded bg-neutral-50 border border-neutral-200"
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-400">{idx + 1}.</span>
              <span className="font-bold text-neutral-900">{s.sequence.join(', ')}</span>
            </div>
            {showSolution ? (
              <span className="font-bold text-amber-600">Ans: {s.answer}</span>
            ) : (
              <span className="text-neutral-300">Ans: [ &nbsp; ]</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (missingNumbers) {
    return (
      <div className="w-full max-w-md space-y-2 p-2 font-mono text-xs">
        {missingNumbers.map((m, idx) => (
          <div
            key={m.id}
            className="flex items-center justify-between p-2 rounded bg-neutral-50 border border-neutral-200"
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-400">{idx + 1}.</span>
              <span className="font-bold text-neutral-900">{m.equation}</span>
            </div>
            {showSolution && <span className="font-bold text-amber-600">{m.answer}</span>}
          </div>
        ))}
      </div>
    );
  }

  return null;
};

// ================= LOGIC GRID VIEW =================

const LogicGridView: React.FC<{ data: LogicGridData; style: PuzzleStyleOptions; showSolution: boolean }> = ({
  data,
  showSolution,
}) => {
  const { clues, solutionMatrix } = data;
  if (!clues) return null;

  return (
    <div className="w-full max-w-md space-y-3 p-2 text-xs">
      <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5">
        <span className="font-bold text-neutral-900 text-[10px] uppercase tracking-wider block">
          Deduction Clues:
        </span>
        <ol className="list-decimal list-inside space-y-1 text-neutral-700 text-[11px]">
          {clues.map(clue => (
            <li key={clue.id}>{clue.text}</li>
          ))}
        </ol>
      </div>

      {showSolution && solutionMatrix && (
        <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-[10px] font-mono">
          <span className="font-bold text-amber-900 block mb-1">Answer Matches:</span>
          {Object.entries(solutionMatrix).map(([anchor, matches]) => (
            <div key={anchor} className="text-amber-800">
              • <b>{anchor}</b>: {Object.values(matches).join(', ')}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
