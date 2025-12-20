/**
 * CommandPalette - Command input and autocomplete component
 */

"use client";

import React, {
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useReducer,
} from "react";

// ==================== Types ====================

export interface CommandDefinition {
  name: string;
  aliases?: string[];
  description: string;
  category: "draw" | "modify" | "view" | "file" | "edit" | "tools";
}

export interface CommandPaletteProps {
  /** Available commands */
  commands: CommandDefinition[];
  /** Execute command handler */
  onExecute: (commandName: string, args?: string[]) => void;
  /** Whether palette is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** History of recent commands */
  history?: string[];
  /** Additional class name */
  className?: string;
}

// ==================== State Management ====================

interface PaletteState {
  input: string;
  selectedIndex: number;
  hideSuggestions: boolean;
}

type PaletteAction =
  | { type: "SET_INPUT"; payload: string }
  | { type: "MOVE_SELECTION"; payload: "up" | "down"; maxIndex: number }
  | { type: "HIDE_SUGGESTIONS" }
  | { type: "EXECUTE" };

function paletteReducer(
  state: PaletteState,
  action: PaletteAction
): PaletteState {
  switch (action.type) {
    case "SET_INPUT":
      return {
        ...state,
        input: action.payload,
        selectedIndex: 0,
        hideSuggestions: false,
      };
    case "MOVE_SELECTION":
      if (action.payload === "down") {
        return {
          ...state,
          selectedIndex:
            state.selectedIndex < action.maxIndex
              ? state.selectedIndex + 1
              : state.selectedIndex,
        };
      } else {
        return {
          ...state,
          selectedIndex: state.selectedIndex > 0 ? state.selectedIndex - 1 : 0,
        };
      }
    case "HIDE_SUGGESTIONS":
      return { ...state, hideSuggestions: true };
    case "EXECUTE":
      return { ...state, input: "" };
    default:
      return state;
  }
}

// ==================== Internal Palette Component ====================
// This component resets when unmounted/remounted via key prop

interface PaletteContentProps {
  commands: CommandDefinition[];
  onExecute: (commandName: string, args?: string[]) => void;
  onClose: () => void;
  history: string[];
  className: string;
}

const PaletteContent: React.FC<PaletteContentProps> = ({
  commands,
  onExecute,
  onClose,
  history,
  className,
}) => {
  const [state, dispatch] = useReducer(paletteReducer, {
    input: "",
    selectedIndex: 0,
    hideSuggestions: false,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Filter commands based on input
  const filteredCommands = useMemo(() => {
    if (!state.input.trim()) {
      const recent = history
        .slice(0, 5)
        .map((name) =>
          commands.find((c) => c.name.toLowerCase() === name.toLowerCase())
        )
        .filter(Boolean) as CommandDefinition[];
      return recent.length > 0 ? recent : commands.slice(0, 10);
    }

    const query = state.input.toLowerCase().trim();
    const matches = commands
      .filter((cmd) => {
        if (cmd.name.toLowerCase().includes(query)) return true;
        if (cmd.aliases?.some((a) => a.toLowerCase().includes(query)))
          return true;
        if (cmd.description.toLowerCase().includes(query)) return true;
        return false;
      })
      .sort((a, b) => {
        const aExact =
          a.name.toLowerCase() === query ||
          a.aliases?.some((al) => al.toLowerCase() === query);
        const bExact =
          b.name.toLowerCase() === query ||
          b.aliases?.some((al) => al.toLowerCase() === query);
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        const aPrefix = a.name.toLowerCase().startsWith(query);
        const bPrefix = b.name.toLowerCase().startsWith(query);
        if (aPrefix && !bPrefix) return -1;
        if (!aPrefix && bPrefix) return 1;

        return a.name.localeCompare(b.name);
      });

    return matches.slice(0, 10);
  }, [state.input, commands, history]);

  const showSuggestions = !state.hideSuggestions && filteredCommands.length > 0;

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && showSuggestions) {
      const selectedItem = listRef.current.children[
        state.selectedIndex
      ] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [state.selectedIndex, showSuggestions]);

  const executeCommand = useCallback(
    (commandName: string) => {
      const parts = state.input.trim().split(/\s+/);
      const args = parts.slice(1);
      onExecute(commandName, args.length > 0 ? args : undefined);
      dispatch({ type: "EXECUTE" });
      onClose();
    },
    [state.input, onExecute, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          dispatch({
            type: "MOVE_SELECTION",
            payload: "down",
            maxIndex: filteredCommands.length - 1,
          });
          break;

        case "ArrowUp":
          e.preventDefault();
          dispatch({
            type: "MOVE_SELECTION",
            payload: "up",
            maxIndex: filteredCommands.length - 1,
          });
          break;

        case "Enter":
          e.preventDefault();
          if (filteredCommands.length > 0 && showSuggestions) {
            executeCommand(filteredCommands[state.selectedIndex].name);
          } else if (state.input.trim()) {
            const parts = state.input.trim().split(/\s+/);
            onExecute(parts[0], parts.slice(1));
            dispatch({ type: "EXECUTE" });
            onClose();
          }
          break;

        case "Escape":
          e.preventDefault();
          if (showSuggestions && !state.hideSuggestions) {
            dispatch({ type: "HIDE_SUGGESTIONS" });
          } else {
            onClose();
          }
          break;

        case "Tab":
          e.preventDefault();
          if (filteredCommands.length > 0) {
            dispatch({
              type: "SET_INPUT",
              payload: filteredCommands[state.selectedIndex].name,
            });
          }
          break;
      }
    },
    [
      filteredCommands,
      state.selectedIndex,
      state.input,
      state.hideSuggestions,
      showSuggestions,
      executeCommand,
      onExecute,
      onClose,
    ]
  );

  const getCategoryColor = (
    category: CommandDefinition["category"]
  ): string => {
    switch (category) {
      case "draw":
        return "text-blue-400";
      case "modify":
        return "text-yellow-400";
      case "view":
        return "text-green-400";
      case "file":
        return "text-purple-400";
      case "edit":
        return "text-orange-400";
      case "tools":
        return "text-pink-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center pt-20 ${className}`}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg bg-gray-800 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-700">
          <span className="text-gray-500">{">"}</span>
          <input
            ref={inputRef}
            type="text"
            value={state.input}
            onChange={(e) =>
              dispatch({ type: "SET_INPUT", payload: e.target.value })
            }
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-white text-lg outline-none placeholder:text-gray-500"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="px-2 py-1 text-xs bg-gray-700 text-gray-400 rounded">
            ESC
          </kbd>
        </div>

        {/* Suggestions */}
        {showSuggestions && filteredCommands.length > 0 && (
          <ul ref={listRef} className="max-h-80 overflow-y-auto" role="listbox">
            {filteredCommands.map((cmd, index) => (
              <li
                key={cmd.name}
                role="option"
                aria-selected={index === state.selectedIndex}
                onClick={() => executeCommand(cmd.name)}
                className={`
                  flex items-center justify-between px-4 py-3 cursor-pointer
                  ${
                    index === state.selectedIndex
                      ? "bg-blue-600"
                      : "hover:bg-gray-700"
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs uppercase ${getCategoryColor(
                      cmd.category
                    )}`}
                  >
                    {cmd.category}
                  </span>
                  <span className="text-white font-medium">{cmd.name}</span>
                  {cmd.aliases && cmd.aliases.length > 0 && (
                    <span className="text-gray-500 text-sm">
                      ({cmd.aliases.join(", ")})
                    </span>
                  )}
                </div>
                <span className="text-gray-400 text-sm">{cmd.description}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Empty state */}
        {!showSuggestions && state.input.trim() && (
          <div className="p-4 text-center text-gray-500">
            No commands found for &ldquo;{state.input}&rdquo;
          </div>
        )}

        {/* Footer hint */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-700 bg-gray-850">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>↑↓ Navigate</span>
            <span>Tab Autocomplete</span>
            <span>Enter Execute</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== CommandPalette Wrapper ====================
// Uses key to remount PaletteContent when isOpen changes, ensuring fresh state

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  commands,
  onExecute,
  isOpen,
  onClose,
  history = [],
  className = "",
}) => {
  if (!isOpen) return null;

  return (
    <PaletteContent
      key="palette-content"
      commands={commands}
      onExecute={onExecute}
      onClose={onClose}
      history={history}
      className={className}
    />
  );
};

// ==================== Default Commands ====================

export const defaultCommands: CommandDefinition[] = [
  // Draw commands
  {
    name: "LINE",
    aliases: ["L"],
    description: "Draw a line",
    category: "draw",
  },
  {
    name: "RECTANGLE",
    aliases: ["REC", "RECT"],
    description: "Draw a rectangle",
    category: "draw",
  },
  {
    name: "CIRCLE",
    aliases: ["C"],
    description: "Draw a circle",
    category: "draw",
  },
  { name: "ARC", aliases: ["A"], description: "Draw an arc", category: "draw" },
  {
    name: "POLYLINE",
    aliases: ["PL"],
    description: "Draw a polyline",
    category: "draw",
  },
  {
    name: "TEXT",
    aliases: ["T", "MTEXT"],
    description: "Add text",
    category: "draw",
  },
  {
    name: "DIMENSION",
    aliases: ["DIM"],
    description: "Add dimension",
    category: "draw",
  },

  // Modify commands
  {
    name: "MOVE",
    aliases: ["M"],
    description: "Move objects",
    category: "modify",
  },
  {
    name: "COPY",
    aliases: ["CO", "CP"],
    description: "Copy objects",
    category: "modify",
  },
  {
    name: "ROTATE",
    aliases: ["RO"],
    description: "Rotate objects",
    category: "modify",
  },
  {
    name: "SCALE",
    aliases: ["SC"],
    description: "Scale objects",
    category: "modify",
  },
  {
    name: "MIRROR",
    aliases: ["MI"],
    description: "Mirror objects",
    category: "modify",
  },
  {
    name: "OFFSET",
    aliases: ["O"],
    description: "Offset objects",
    category: "modify",
  },
  {
    name: "TRIM",
    aliases: ["TR"],
    description: "Trim objects",
    category: "modify",
  },
  {
    name: "EXTEND",
    aliases: ["EX"],
    description: "Extend objects",
    category: "modify",
  },
  {
    name: "DELETE",
    aliases: ["DEL", "ERASE", "E"],
    description: "Delete objects",
    category: "modify",
  },

  // View commands
  { name: "ZOOM", aliases: ["Z"], description: "Zoom view", category: "view" },
  { name: "PAN", aliases: ["P"], description: "Pan view", category: "view" },
  {
    name: "ZOOMFIT",
    aliases: ["ZF", "FIT"],
    description: "Zoom to fit all",
    category: "view",
  },
  {
    name: "GRID",
    aliases: ["G"],
    description: "Toggle grid",
    category: "view",
  },
  {
    name: "SNAP",
    aliases: ["S"],
    description: "Toggle snap",
    category: "view",
  },
  {
    name: "ORTHO",
    aliases: ["OR"],
    description: "Toggle ortho mode",
    category: "view",
  },

  // File commands
  {
    name: "NEW",
    aliases: ["N"],
    description: "New document",
    category: "file",
  },
  { name: "OPEN", aliases: [], description: "Open document", category: "file" },
  {
    name: "SAVE",
    aliases: ["CTRL+S"],
    description: "Save document",
    category: "file",
  },
  {
    name: "SAVEAS",
    aliases: [],
    description: "Save as new file",
    category: "file",
  },
  {
    name: "EXPORT",
    aliases: [],
    description: "Export document",
    category: "file",
  },

  // Edit commands
  {
    name: "UNDO",
    aliases: ["U", "CTRL+Z"],
    description: "Undo last action",
    category: "edit",
  },
  {
    name: "REDO",
    aliases: ["CTRL+Y"],
    description: "Redo last undo",
    category: "edit",
  },
  {
    name: "SELECTALL",
    aliases: ["CTRL+A"],
    description: "Select all objects",
    category: "edit",
  },

  // Tools
  {
    name: "PROPERTIES",
    aliases: ["PROP", "PR"],
    description: "Show properties panel",
    category: "tools",
  },
  {
    name: "LAYERS",
    aliases: ["LA"],
    description: "Manage layers",
    category: "tools",
  },
  {
    name: "MEASURE",
    aliases: ["ME"],
    description: "Measure distance",
    category: "tools",
  },
];

export default CommandPalette;
