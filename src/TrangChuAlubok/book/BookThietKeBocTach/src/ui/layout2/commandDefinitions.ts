/**
 * commandDefinitions.ts
 *
 * STEP-5.18: Extracted from Header3.tsx
 * Pure data: CAD command definitions + shortcut lookup map.
 * Used by Header3 (command bar) to resolve shortcuts → actions.
 */

// ── Types ──────────────────────────────────────────────────────────

export interface CommandDefinition {
  shortcut: string;
  description: string;
  prompts: string[];
  action?: string;
}

// ── Command definitions with shortcuts and descriptions ────────────

export const COMMANDS: Record<string, CommandDefinition> = {
  // Draw commands
  LINE: {
    shortcut: "L",
    description: "Vẽ đường thẳng",
    prompts: ["Specify first point:", "Specify next point or [Undo]:"],
    action: "line",
  },
  POLYGON: {
    shortcut: "POL",
    description: "Vẽ đa giác (polygon)",
    prompts: [
      "Specify first point:",
      "Specify next point or [Undo]:",
      "Enter to complete polygon",
    ],
    action: "polygon",
  },
  CIRCLE: {
    shortcut: "C",
    description: "Vẽ đường tròn",
    prompts: ["Specify center point:", "Specify radius or [Diameter]:"],
    action: "circle",
  },
  ARC: {
    shortcut: "A",
    description: "Vẽ cung tròn",
    prompts: ["Specify start point:", "Specify second point or [Center/End]:"],
    action: "arc",
  },
  RECTANGLE: {
    shortcut: "REC",
    description: "Vẽ hình chữ nhật",
    prompts: ["Specify first corner:", "Specify other corner or [Dimensions]:"],
    action: "rect",
  },
  ELLIPSE: {
    shortcut: "EL",
    description: "Vẽ elip",
    prompts: ["Specify axis endpoint:", "Specify other axis endpoint:"],
    action: "ellipse",
  },
  TEXT: {
    shortcut: "T",
    description: "Chèn text",
    prompts: ["Specify start point:", "Enter text:"],
    action: "text",
  },
  TEXTSCALE: {
    shortcut: "X",
    description: "Scale text đã chọn",
    prompts: ["Enter scale factor:"],
    action: "textscale",
  },
  MTEXT: {
    shortcut: "MT",
    description: "Chèn multiline text",
    prompts: ["Specify first corner:", "Specify opposite corner:"],
    action: "mtext",
  },
  HATCH: {
    shortcut: "H",
    description: "Tô vùng kín",
    prompts: ["Select objects or [Pick internal point]:"],
    action: "hatch",
  },

  // Modify commands
  MOVE: {
    shortcut: "M",
    description: "Di chuyển đối tượng",
    prompts: [
      "Select objects:",
      "Specify base point:",
      "Specify second point:",
    ],
    action: "move",
  },
  COPY: {
    shortcut: "CO",
    description: "Sao chép đối tượng",
    prompts: [
      "Select objects:",
      "Specify base point:",
      "Specify second point:",
    ],
    action: "copy",
  },
  ROTATE: {
    shortcut: "RO",
    description: "Xoay đối tượng",
    prompts: [
      "Select objects:",
      "Specify base point:",
      "Specify rotation angle:",
    ],
    action: "rotate",
  },
  SCALE: {
    shortcut: "SC",
    description: "Co giãn đối tượng",
    prompts: [
      "Select objects:",
      "Specify base point:",
      "Specify scale factor:",
    ],
    action: "scale",
  },
  MIRROR: {
    shortcut: "MI",
    description: "Lấy đối xứng",
    prompts: [
      "Select objects:",
      "Specify first point of mirror line:",
      "Specify second point:",
    ],
    action: "mirror",
  },
  OFFSET: {
    shortcut: "O",
    description: "Tạo đường song song",
    prompts: ["Specify offset distance:", "Select object:", "Specify side:"],
    action: "offset",
  },
  TRIM: {
    shortcut: "TR",
    description: "Cắt bớt đối tượng",
    prompts: ["Select cutting edges:", "Select object to trim:"],
    action: "trim",
  },
  EXTEND: {
    shortcut: "EX",
    description: "Kéo dài đối tượng",
    prompts: ["Select boundary edges:", "Select object to extend:"],
    action: "extend",
  },
  FILLET: {
    shortcut: "F",
    description: "Bo góc",
    prompts: [
      "Specify fillet radius:",
      "Select first object:",
      "Select second object:",
    ],
    action: "fillet",
  },
  CHAMFER: {
    shortcut: "CHA",
    description: "Vát góc",
    prompts: [
      "Specify first chamfer distance:",
      "Select first line:",
      "Select second line:",
    ],
    action: "chamfer",
  },
  EXPLODE: {
    shortcut: "X",
    description: "Phân rã đối tượng",
    prompts: ["Select objects:"],
    action: "explode",
  },
  ARRAY: {
    shortcut: "AR",
    description: "Tạo mảng đối tượng",
    prompts: ["Select objects:", "Enter array type [Rectangular/Polar]:"],
    action: "array",
  },

  // Dimension commands
  DIMLINEAR: {
    shortcut: "DLI",
    description: "Kích thước thẳng (tự động ngang/dọc)",
    prompts: [
      "Specify first extension line:",
      "Specify second extension line:",
      "Specify dimension line [H=Horizontal/O=Vertical/A=Aligned]:",
    ],
    action: "dim-linear",
  },
  DIMHORIZONTAL: {
    shortcut: "DHO",
    description: "Kích thước ngang (forced horizontal)",
    prompts: [
      "Specify first extension line:",
      "Specify second extension line:",
      "Specify dimension line:",
    ],
    action: "dho",
  },
  DIMVERTICAL: {
    shortcut: "DVE",
    description: "Kích thước dọc (forced vertical)",
    prompts: [
      "Specify first extension line:",
      "Specify second extension line:",
      "Specify dimension line:",
    ],
    action: "dve",
  },
  DIMALIGNED: {
    shortcut: "DAL",
    description: "Kích thước nghiêng (theo cạnh)",
    prompts: [
      "Specify first extension line:",
      "Specify second extension line:",
      "Specify dimension line:",
    ],
    action: "dim-aligned",
  },
  DIMRADIUS: {
    shortcut: "DRA",
    description: "Kích thước bán kính",
    prompts: ["Select arc or circle:", "Specify dimension line:"],
    action: "dim-radius",
  },
  DIMANGULAR: {
    shortcut: "DAN",
    description: "Kích thước góc",
    prompts: [
      "Select first line:",
      "Select second line:",
      "Specify dimension arc:",
    ],
    action: "dim-angular",
  },
  QDIM: {
    shortcut: "QD",
    description: "Quick Dimension - Kích thước nhanh nhiều điểm",
    prompts: ["Select objects:", "Specify dimension line position:"],
    action: "qdim",
  },
  DIMCONTINUE: {
    shortcut: "DCO",
    description: "Continue Dimension - Kích thước liên tục từ dim trước",
    prompts: ["Select continued dimension:", "Specify second extension line:"],
    action: "dimcontinue",
  },
  DIMBASELINE: {
    shortcut: "DBA",
    description: "Baseline Dimension - Kích thước từ điểm gốc",
    prompts: ["Select base dimension:", "Specify second extension line:"],
    action: "dba",
  },
  DIMARC: {
    shortcut: "DAR",
    description: "Arc Dimension - Kích thước chiều dài cung",
    prompts: ["Select arc:", "Specify dimension location:"],
    action: "dimarc",
  },

  // View commands
  ZOOM: {
    shortcut: "Z",
    description: "Thu phóng",
    prompts: ["[All/Center/Extents/Window]:"],
    action: "zoom",
  },
  ZOOMIN: {
    shortcut: "ZI",
    description: "Phóng to",
    prompts: ["Zoom in."],
    action: "zoom-in",
  },
  ZOOMOUT: {
    shortcut: "ZO",
    description: "Thu nhỏ",
    prompts: ["Zoom out."],
    action: "zoom-out",
  },
  ZOOMFIT: {
    shortcut: "ZF",
    description: "Zoom vừa màn hình",
    prompts: ["Zoom to fit."],
    action: "zoom-fit",
  },
  PAN: {
    shortcut: "P",
    description: "Di chuyển vùng nhìn",
    prompts: ["Press ESC or ENTER to exit."],
    action: "pan",
  },
  REGEN: {
    shortcut: "RE",
    description: "Vẽ lại màn hình",
    prompts: ["Regenerating model."],
    action: "regen",
  },

  // Utility commands
  UNDO: {
    shortcut: "U",
    description: "Hoàn tác",
    prompts: [""],
    action: "undo",
  },
  REDO: {
    shortcut: "REDO",
    description: "Làm lại",
    prompts: [""],
    action: "redo",
  },
  ERASE: {
    shortcut: "E",
    description: "Xóa đối tượng",
    prompts: ["Select objects:"],
    action: "delete",
  },
  SELECT: {
    shortcut: "S",
    description: "Chọn đối tượng",
    prompts: ["Select objects:"],
    action: "select",
  },
  ESCAPE: {
    shortcut: "ESC",
    description: "Hủy lệnh hiện tại",
    prompts: ["*Cancel*"],
    action: "escape",
  },
  EXPORT: {
    shortcut: "EXP",
    description: "Xuất file",
    prompts: ["Export format [DXF/PDF/PNG]:"],
    action: "export",
  },

  // OSNAP settings
  OSNAP: {
    shortcut: "OS",
    description: "Bật/tắt Object Snap",
    prompts: ["Enter osnap modes:"],
    action: "osnap",
  },
  ORTHO: {
    shortcut: "F8",
    description: "Bật/tắt chế độ vuông góc",
    prompts: ["<Ortho on/off>"],
    action: "ortho",
  },
  GRID: {
    shortcut: "F7",
    description: "Bật/tắt lưới",
    prompts: ["<Grid on/off>"],
    action: "grid",
  },
  SNAP: {
    shortcut: "F9",
    description: "Bật/tắt Snap",
    prompts: ["<Snap on/off>"],
    action: "snap",
  },
};

// ── Shortcut map for quick lookup ──────────────────────────────────

export const SHORTCUT_MAP: Record<string, string> = {};
Object.entries(COMMANDS).forEach(([cmd, info]) => {
  SHORTCUT_MAP[info.shortcut.toUpperCase()] = cmd;
});
