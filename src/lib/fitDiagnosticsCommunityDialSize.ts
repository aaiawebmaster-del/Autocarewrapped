const LOGO_FACE_RATIO = 126 / 300;
const MARK_WIDTH_SCALE = 0.84;
const MARK_HEIGHT_SCALE = 0.48;
const SINGLE_MARK_WIDTH_SCALE = 1.47;
const SINGLE_MARK_HEIGHT_SCALE = 0.84;
const BUTTON_PADDING_Y = 10;

function measureStackHeight(
  dialSize: number,
  columnWidth: number,
  logoCount: number,
  gap: number,
  buttonPaddingY = BUTTON_PADDING_Y,
): number {
  const markWidth = Math.min(dialSize * MARK_WIDTH_SCALE, columnWidth);
  const markHeight = Math.min(markWidth * LOGO_FACE_RATIO, dialSize * MARK_HEIGHT_SCALE);
  const chromeFudge = 3;
  const perLogo = markHeight + buttonPaddingY + chromeFudge;
  return logoCount * perLogo + Math.max(0, logoCount - 1) * gap;
}

function measureSingleHeight(
  dialSize: number,
  columnWidth: number,
  buttonPaddingY = BUTTON_PADDING_Y,
): number {
  const markWidth = Math.min(dialSize * SINGLE_MARK_WIDTH_SCALE, columnWidth);
  const markHeight = Math.min(markWidth * LOGO_FACE_RATIO, dialSize * SINGLE_MARK_HEIGHT_SCALE);
  const chromeFudge = 3;
  return markHeight + buttonPaddingY + chromeFudge;
}

function measureGridHeight(
  dialSize: number,
  columnWidth: number,
  logoCount: number,
  gap: number,
): number {
  const rows = Math.ceil(logoCount / 2);
  const cellWidth = (columnWidth - gap) / 2;
  const markWidth = Math.min(dialSize * MARK_WIDTH_SCALE, cellWidth);
  const markHeight = Math.min(markWidth * LOGO_FACE_RATIO, dialSize * MARK_HEIGHT_SCALE);
  const perRow = markHeight + BUTTON_PADDING_Y;
  return rows * perRow + Math.max(0, rows - 1) * gap;
}

/** Match journey community logo proportions while filling the diagnostics stats band. */
export function fitDiagnosticsCommunityDialSize({
  bandHeight,
  columnWidth,
  logoCount,
  gap,
  layout = 'stack',
  buttonPaddingY,
  bandHeightInset = 0,
}: {
  bandHeight: number;
  columnWidth: number;
  logoCount: number;
  gap: number;
  layout?: 'stack' | 'grid' | 'single';
  buttonPaddingY?: number;
  bandHeightInset?: number;
}): number {
  if (logoCount <= 0 || bandHeight <= 0 || columnWidth <= 0) {
    return 144;
  }

  const stackPaddingY = buttonPaddingY ?? BUTTON_PADDING_Y;
  const targetHeight = Math.max(0, bandHeight - bandHeightInset);

  let low = 32;
  let high = bandHeight * 2;

  while (high - low > 0.5) {
    const mid = (low + high) / 2;
    const contentHeight =
      layout === 'grid'
        ? measureGridHeight(mid, columnWidth, logoCount, gap)
        : layout === 'single'
          ? measureSingleHeight(mid, columnWidth, stackPaddingY)
          : measureStackHeight(mid, columnWidth, logoCount, gap, stackPaddingY);
    if (contentHeight <= targetHeight) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return low;
}
