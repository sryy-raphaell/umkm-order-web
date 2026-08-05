"use client";

import {
  LuBot,
  LuShoppingBag,
  LuFlame,
  LuCheck,
  LuPlus,
  LuPackage,
  LuTrash2,
  LuFolderOpen,
  LuX,
  LuRadio,
  LuPuzzle,
  LuPencil,
  LuKey,
  LuSmartphone,
  LuTriangleAlert,
  LuMessageCircle,
  LuHash,
  LuThermometer,
  LuChartLine,
  LuCircleDot,
  LuTag,
  LuChevronLeft,
  LuChevronRight,
  LuSearch,
  LuSun,
  LuMoon,
} from "react-icons/lu";

export {
  LuBot,
  LuShoppingBag,
  LuFlame,
  LuCheck,
  LuPlus,
  LuPackage,
  LuTrash2,
  LuFolderOpen,
  LuX,
  LuRadio,
  LuPuzzle,
  LuPencil,
  LuKey,
  LuSmartphone,
  LuTriangleAlert,
  LuMessageCircle,
  LuHash,
  LuThermometer,
  LuChartLine,
  LuCircleDot,
  LuTag,
  LuChevronLeft,
  LuChevronRight,
  LuSearch,
  LuSun,
  LuMoon,
};

export const WIDGET_ICONS = {
  value: LuHash,
  gauge: LuThermometer,
  chart: LuChartLine,
  button: LuCircleDot,
  label: LuTag,
};

export function IconLabel({ icon: Icon, children, size = 14, gap = 6, style }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap, ...style }}>
      <Icon size={size} aria-hidden />
      {children}
    </span>
  );
}
