import {
  KeyboardEvent,
  PointerEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import "../ui-kit.css";

export interface SelectOption<T extends string | number = string | number> {
  value: T;
  label: string;
}

export interface SelectProps<T extends string | number> {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

export function Select<T extends string | number>({
  options,
  value,
  onChange,
  placeholder = "Выберите…",
  disabled = false,
  className = "",
  id,
  "aria-label": ariaLabel,
}: SelectProps<T>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const selectedIndex = options.findIndex((opt) => opt.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;
  const displayLabel = selected?.label ?? placeholder;
  const isEmpty = options.length === 0;

  useEffect(() => {
    setHighlightedIndex((index) => {
      if (options.length === 0) {
        return 0;
      }
      return Math.min(Math.max(0, index), options.length - 1);
    });
  }, [options.length]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const initial =
      selectedIndex >= 0 ? selectedIndex : Math.min(0, options.length - 1);
    setHighlightedIndex(initial);
  }, [open, options.length, selectedIndex]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointerDown = (event: Event) => {
      if (rootRef.current?.contains(event.target as Node)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) {
      return;
    }
    listRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) {
      return;
    }
    const optionEl = listRef.current.querySelector<HTMLElement>(
      `[data-index="${highlightedIndex}"]`
    );
    optionEl?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open]);

  const close = () => setOpen(false);

  const selectAt = (index: number) => {
    const opt = options[index];
    if (!opt) {
      return;
    }
    onChange(opt.value);
    close();
  };

  const handleTriggerClick = () => {
    if (disabled || isEmpty) {
      return;
    }
    setOpen((prev) => !prev);
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || isEmpty) {
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (event.key === "ArrowDown") {
        setHighlightedIndex((i) => Math.min(options.length - 1, i + 1));
      } else {
        setHighlightedIndex((i) => Math.max(0, i - 1));
      }
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      selectAt(highlightedIndex);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  };

  const handleListKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((i) => Math.min(options.length - 1, i + 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      setHighlightedIndex(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      setHighlightedIndex(Math.max(0, options.length - 1));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      selectAt(highlightedIndex);
    }
  };

  /** Выбор по pointerdown: после preventDefault на mousedown click может не прийти — не полагаемся на click */
  const handleOptionPointerDown = (
    event: PointerEvent<HTMLLIElement>,
    index: number
  ) => {
    event.preventDefault();
    selectAt(index);
  };

  return (
    <div
      ref={rootRef}
      className={`ui-select-root ${className}`.trim()}
    >
      <button
        type="button"
        id={id}
        className={`ui-select-trigger ${open ? "is-open" : ""}`.trim()}
        disabled={disabled || isEmpty}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="ui-select-trigger__label">{displayLabel}</span>
        <span className="ui-select-trigger__chevron" aria-hidden />
      </button>

      {open && !isEmpty && (
        <ul
          ref={listRef}
          id={listId}
          className="ui-select-panel"
          role="listbox"
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
        >
          {options.map((opt, index) => (
            <li
              key={String(opt.value)}
              role="option"
              aria-selected={opt.value === value}
              data-index={index}
              className={`ui-select-option ${
                opt.value === value ? "is-selected" : ""
              } ${index === highlightedIndex ? "is-highlighted" : ""}`.trim()}
              onMouseEnter={() => setHighlightedIndex(index)}
              onPointerDown={(event) => handleOptionPointerDown(event, index)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
