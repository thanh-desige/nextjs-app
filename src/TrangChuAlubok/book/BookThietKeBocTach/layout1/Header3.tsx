"use client";
import React, { useState, useEffect, useRef } from "react";

interface Header3Props {
  mouseX?: number;
  mouseY?: number;
  zoom?: number;
  onCommand?: (command: string) => void;
  activeTool?: string;
  activePrompt?: string;
  // Current step index for the active command (0-based)
  currentStep?: number;
  // Sync với commandBuffer từ parent
  commandBuffer?: string;
  onCommandBufferChange?: (value: string) => void;
  // Callback when a command is executed (for tracking lastCommand)
  onCommandExecuted?: (command: string) => void;
}

// Command definitions with shortcuts and descriptions
const COMMANDS: Record<
  string,
  {
    shortcut: string;
    description: string;
    prompts: string[];
    action?: string;
  }
> = {
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

// Build shortcut map for quick lookup
const SHORTCUT_MAP: Record<string, string> = {};
Object.entries(COMMANDS).forEach(([cmd, info]) => {
  SHORTCUT_MAP[info.shortcut.toUpperCase()] = cmd;
});

export default function Header3({
  mouseX = 0,
  mouseY = 0,
  zoom = 100,
  onCommand,
  activeTool = "",
  activePrompt = "",
  currentStep = 0,
  commandBuffer = "",
  onCommandBufferChange,
  onCommandExecuted,
}: Header3Props) {
  // Use commandBuffer from parent if provided, otherwise use local state
  const [localInputValue, setLocalInputValue] = useState("");
  const inputValue = onCommandBufferChange ? commandBuffer : localInputValue;
  const setInputValue = onCommandBufferChange
    ? onCommandBufferChange
    : setLocalInputValue;

  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState("Command:");
  const [lastCommand, setLastCommand] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  // Compute prompt based on active tool
  const computedPrompt =
    activePrompt ||
    (() => {
      if (activeTool) {
        const cmd = Object.entries(COMMANDS).find(
          ([, info]) => info.action === activeTool
        );
        if (cmd && cmd[1].prompts[0]) {
          return cmd[1].prompts[0];
        }
      }
      return currentPrompt;
    })();

  // Track activeTool changes to show command info
  const prevToolRef = useRef<string>("");
  useEffect(() => {
    if (
      activeTool &&
      activeTool !== prevToolRef.current &&
      activeTool !== "select"
    ) {
      // Find command info for this tool
      const cmd = Object.entries(COMMANDS).find(
        ([, info]) => info.action === activeTool
      );
      if (cmd) {
        const [cmdName, cmdInfo] = cmd;
        // Use setTimeout to avoid cascading renders warning
        setTimeout(() => {
          setCommandHistory((prev) => [
            ...prev.slice(-50),
            `Command: ${cmdName} (${cmdInfo.shortcut})`,
            `→ ${cmdInfo.description}`,
          ]);
          setCurrentPrompt(cmdInfo.prompts[0] || "Command:");
          setLastCommand(cmdName);
          // Notify parent with action (for repeat command)
          onCommandExecuted?.(cmdInfo.action || cmdName.toLowerCase());
        }, 0);
      }
      prevToolRef.current = activeTool;
    } else if (!activeTool || activeTool === "select") {
      if (prevToolRef.current !== "" && prevToolRef.current !== "select") {
        setTimeout(() => {
          setCurrentPrompt("Command:");
        }, 0);
        prevToolRef.current = activeTool;
      }
    }
  }, [activeTool, onCommandExecuted]);

  // Auto-scroll history
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [commandHistory]);

  // Handle input change with suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setInputValue(value);
    setHistoryIndex(-1);

    if (value.length > 0) {
      const matches = Object.entries(COMMANDS)
        .filter(
          ([cmd, info]) =>
            cmd.startsWith(value) || info.shortcut.startsWith(value)
        )
        .map(([cmd, info]) => `${info.shortcut} → ${cmd}: ${info.description}`)
        .slice(0, 5);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Execute command
  const executeCommand = (cmd: string) => {
    const upperCmd = cmd.toUpperCase().trim();
    if (!upperCmd) return;

    // Add to history
    setCommandHistory((prev) => [...prev.slice(-50), `Command: ${upperCmd}`]);

    // Find command by name or shortcut
    let commandName = upperCmd;
    if (SHORTCUT_MAP[upperCmd]) {
      commandName = SHORTCUT_MAP[upperCmd];
    }

    const commandInfo = COMMANDS[commandName];
    if (commandInfo) {
      setLastCommand(commandName);
      // Notify parent with action (for repeat command)
      onCommandExecuted?.(commandInfo.action || commandName.toLowerCase());
      setCurrentPrompt(commandInfo.prompts[0] || "Command:");
      setCommandHistory((prev) => [...prev, `→ ${commandInfo.description}`]);

      // Call onCommand with the action
      onCommand?.(commandInfo.action || commandName.toLowerCase());
    } else {
      // Try as direct input (coordinates, values)
      if (/^-?\d+(\.\d+)?(,-?\d+(\.\d+)?)?$/.test(upperCmd)) {
        // Coordinate input
        setCommandHistory((prev) => [...prev, `Point: ${upperCmd}`]);
        onCommand?.(upperCmd);
      } else {
        setCommandHistory((prev) => [...prev, `Unknown command: ${upperCmd}`]);
        setCurrentPrompt("Command:");
      }
    }

    setInputValue("");
    setShowSuggestions(false);
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter = execute command or confirm
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        executeCommand(inputValue);
      } else {
        // Enter with empty input = confirm/next step (send empty command)
        onCommand?.("");
      }
    } else if (e.key === " ") {
      // Space = AutoCAD style
      e.preventDefault();
      if (inputValue.trim()) {
        // Space with text = execute like Enter
        executeCommand(inputValue);
      } else if (lastCommand) {
        // Space with empty input = repeat last command
        executeCommand(lastCommand);
        setCommandHistory((prev) => [...prev, `Repeat: ${lastCommand}`]);
      } else {
        // No last command = same as Enter (confirm/next step)
        onCommand?.("");
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setInputValue("");
      setShowSuggestions(false);
      setCurrentPrompt("Command:");
      setCommandHistory((prev) => [...prev, "*Cancel*"]);
      onCommand?.("escape");
      inputRef.current?.blur(); // Blur input on Escape
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex =
          historyIndex < commandHistory.length - 1
            ? historyIndex + 1
            : historyIndex;
        setHistoryIndex(newIndex);
        const historyCmd = commandHistory[commandHistory.length - 1 - newIndex];
        if (historyCmd?.startsWith("Command: ")) {
          setInputValue(historyCmd.replace("Command: ", ""));
        }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        const historyCmd = commandHistory[commandHistory.length - 1 - newIndex];
        if (historyCmd?.startsWith("Command: ")) {
          setInputValue(historyCmd.replace("Command: ", ""));
        }
      } else {
        setHistoryIndex(-1);
        setInputValue("");
      }
    } else if (e.key === "Tab" && suggestions.length > 0) {
      e.preventDefault();
      const firstMatch = suggestions[0].split(" → ")[0];
      setInputValue(firstMatch);
      setShowSuggestions(false);
    }
  };

  // Function key handlers (F1-F12)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if focused on other inputs
      if (
        e.target !== inputRef.current &&
        (e.target as HTMLElement)?.tagName === "INPUT"
      )
        return;

      switch (e.key) {
        case "F1":
          e.preventDefault();
          setCommandHistory((prev) => [
            ...prev,
            "📖 Help: Nhấn L=Line, C=Circle, REC=Rectangle, M=Move, CO=Copy...",
          ]);
          break;
        case "F7":
          e.preventDefault();
          onCommand?.("grid");
          setCommandHistory((prev) => [...prev, "<Grid toggled>"]);
          break;
        case "F8":
          e.preventDefault();
          onCommand?.("ortho");
          setCommandHistory((prev) => [...prev, "<Ortho toggled>"]);
          break;
        case "F9":
          e.preventDefault();
          onCommand?.("snap");
          setCommandHistory((prev) => [...prev, "<Snap toggled>"]);
          break;
        case "F3":
          e.preventDefault();
          onCommand?.("osnap");
          setCommandHistory((prev) => [...prev, "<Osnap toggled>"]);
          break;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [onCommand]);

  return (
    <div
      style={{
        backgroundColor: "#252526",
        color: "#ddd",
        display: "flex",
        flexDirection: "row",
        borderTop: "1px solid #333",
        fontSize: "11px",
        width: "100%",
        boxSizing: "border-box",
        height: "70px",
        minHeight: "70px",
      }}
    >
      {/* Sidebar Left - Command History */}
      <div
        ref={historyRef}
        style={{
          width: "250px",
          minWidth: "250px",
          height: "70px",
          overflowY: "auto",
          overflowX: "hidden",
          padding: "4px 6px",
          fontFamily: "Consolas, monospace",
          fontSize: "12px",
          color: "#aaa",
          backgroundColor: "#1E1E1E",
          borderRight: "1px solid #333",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        {commandHistory.map((line, idx) => (
          <div
            key={idx}
            style={{
              color: line.startsWith("Command:")
                ? "#4CAF50"
                : line.startsWith("→")
                ? "#888"
                : line.startsWith("*")
                ? "#ff6b6b"
                : line.startsWith("Unknown")
                ? "#ff9800"
                : line.startsWith("<")
                ? "#64b5f6"
                : line.startsWith("📖")
                ? "#ba68c8"
                : line.startsWith("Point:")
                ? "#BA00AE"
                : line.startsWith("Repeat:")
                ? "#ff9800"
                : "#ddd",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: "1.4",
              fontSize: "12px",
              flexShrink: 0,
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {/* Center - Command Input Line */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "0 12px",
          backgroundColor: "#252526",
          position: "relative",
        }}
      >
        {/* Left side: Prompt + Input */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}
        >
          <span
            style={{
              color: "#4CAF50",
              fontWeight: 600,
              whiteSpace: "nowrap",
              fontSize: "12px",
            }}
          >
            {computedPrompt}
          </span>

          <div style={{ flex: 1, position: "relative", maxWidth: "350px" }}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Nhập lệnh hoặc phím tắt... (F1=Help)"
              style={{
                width: "100%",
                padding: "7px 14px",
                borderRadius: "3px",
                border: "1px solid #444",
                backgroundColor: "#1E1E1E",
                color: "#fff",
                fontSize: "13px",
                fontFamily: "Consolas, monospace",
              }}
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "#252535",
                  border: "1px solid #444",
                  borderRadius: "3px",
                  marginBottom: "2px",
                  maxHeight: "150px",
                  overflowY: "auto",
                  zIndex: 1000,
                }}
              >
                {suggestions.map((s, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      const shortcut = s.split(" → ")[0];
                      setInputValue(shortcut);
                      setShowSuggestions(false);
                      inputRef.current?.focus();
                    }}
                    style={{
                      padding: "6px 10px",
                      cursor: "pointer",
                      borderBottom:
                        idx < suggestions.length - 1
                          ? "1px solid #333"
                          : "none",
                      fontSize: "11px",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "rgba(186, 0, 174, 0.2)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <span style={{ color: "#BA00AE", fontWeight: 600 }}>
                      {s.split(" → ")[0]}
                    </span>
                    <span style={{ color: "#888" }}> → </span>
                    <span style={{ color: "#ddd" }}>{s.split(" → ")[1]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Command Steps Guide (only when command is active) */}
        {activeTool &&
          activeTool !== "select" &&
          (() => {
            // Tìm command theo action hoặc theo tên lệnh (case insensitive)
            const activeCmd = Object.entries(COMMANDS).find(
              ([cmdName, info]) =>
                info.action === activeTool ||
                info.action === activeTool.toLowerCase() ||
                cmdName.toLowerCase() === activeTool.toLowerCase() ||
                info.shortcut.toLowerCase() === activeTool.toLowerCase()
            );

            if (activeCmd) {
              const [cmdName, cmdInfo] = activeCmd;

              // Sử dụng currentStep từ props (được truyền từ parent)
              // Nếu currentStep vượt quá số bước, giữ ở bước cuối
              const currentStepIdx = Math.min(
                currentStep,
                cmdInfo.prompts.length - 1
              );

              // Xác định loại lệnh để đổi màu
              const cmdType = [
                "move",
                "copy",
                "rotate",
                "scale",
                "mirror",
                "offset",
                "trim",
                "extend",
                "fillet",
                "chamfer",
                "explode",
                "array",
              ].includes(cmdInfo.action || "")
                ? "modify"
                : [
                    "dli",
                    "dho",
                    "dve",
                    "dal",
                    "dra",
                    "dan",
                    "qd",
                    "dco",
                    "dba",
                    "dar",
                  ].includes(cmdInfo.action || "")
                ? "dim"
                : "draw";

              const typeColor =
                cmdType === "modify"
                  ? "#ff9800"
                  : cmdType === "dim"
                  ? "#64b5f6"
                  : "#4CAF50";

              return (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    padding: "4px 8px",
                    backgroundColor: "#1E1E1E",
                    borderRadius: "4px",
                    border: `1px solid ${typeColor}40`,
                    fontSize: "9px",
                    fontFamily: "Consolas, monospace",
                    maxWidth: "300px",
                  }}
                >
                  {/* Header: Command name + type */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "2px",
                    }}
                  >
                    <span
                      style={{
                        color: typeColor,
                        fontWeight: 600,
                        fontSize: "8px",
                        padding: "1px 4px",
                        backgroundColor: `${typeColor}20`,
                        borderRadius: "2px",
                        textTransform: "uppercase",
                      }}
                    >
                      {cmdType}
                    </span>
                    <span style={{ color: "#BA00AE", fontWeight: 600 }}>
                      {cmdInfo.shortcut}
                    </span>
                    <span style={{ color: typeColor, fontWeight: 600 }}>
                      {cmdName}
                    </span>
                    <span style={{ color: "#888", fontSize: "8px" }}>
                      - {cmdInfo.description}
                    </span>
                  </div>

                  {/* Steps with details */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1px",
                    }}
                  >
                    {cmdInfo.prompts.map((prompt, idx) => {
                      const isActive = idx === currentStepIdx;
                      const isCompleted = currentStepIdx > idx;

                      return (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "1px 4px",
                            borderRadius: "2px",
                            backgroundColor: isActive
                              ? `${typeColor}30`
                              : isCompleted
                              ? "rgba(76, 175, 80, 0.1)"
                              : "transparent",
                          }}
                        >
                          <span
                            style={{
                              color: isCompleted
                                ? "#4CAF50"
                                : isActive
                                ? typeColor
                                : "#555",
                              fontWeight: 600,
                              minWidth: "14px",
                              fontSize: "8px",
                            }}
                          >
                            {isCompleted ? "✓" : `${idx + 1}.`}
                          </span>
                          <span
                            style={{
                              color: isActive
                                ? "#fff"
                                : isCompleted
                                ? "#4CAF50"
                                : "#666",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontSize: "8px",
                            }}
                          >
                            {prompt}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            return null;
          })()}
      </div>

      {/* Sidebar Right - Quick Shortcuts + Coordinates */}
      <div
        style={{
          width: "280px",
          minWidth: "280px",
          height: "70px",
          display: "flex",
          flexDirection: "row",
          padding: "4px 6px",
          backgroundColor: "#1E1E1E",
          borderLeft: "1px solid #333",
          gap: "6px",
        }}
      >
        {/* Column Left: Coordinates */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-around",
            alignItems: "flex-start",
            minWidth: "50px",
            borderRight: "1px solid #333",
            paddingRight: "6px",
          }}
        >
          <span style={{ color: "#BA00AE", fontWeight: 600, fontSize: "10px" }}>
            X: {mouseX.toFixed(0)}
          </span>
          <span style={{ color: "#BA00AE", fontWeight: 600, fontSize: "10px" }}>
            Y: {mouseY.toFixed(0)}
          </span>
          <span style={{ color: "#BA00AE", fontWeight: 600, fontSize: "10px" }}>
            {zoom.toFixed(0)}%
          </span>
        </div>

        {/* Column Right: Shortcuts Grid 3x3 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gridTemplateRows: "repeat(3, 1fr)",
            gap: "2px",
            flex: 1,
          }}
        >
          {[
            { key: "F1", label: "help" },
            { key: "F3", label: "osnap" },
            { key: "F7", label: "grid" },
            { key: "F8", label: "ortho" },
            { key: "F9", label: "snap" },
            { key: "ESC", label: "cancel" },
            { key: "Space", label: "repeat" },
            { key: "↑↓", label: "history" },
            { key: "Tab", label: "complete" },
          ].map((item) => (
            <span
              key={item.key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1px 2px",
                backgroundColor: "rgba(255,255,255,0.03)",
                borderRadius: "2px",
                whiteSpace: "nowrap",
                fontSize: "8px",
                gap: "2px",
              }}
            >
              <span style={{ color: "#BA00AE", fontWeight: 600 }}>
                {item.key}
              </span>
              <span style={{ color: "#666" }}>{item.label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
