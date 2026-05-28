import { ReactElement, useState, useEffect } from "react";

// Кастомный хук useDebounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timerId);
    };
  }, [value, delay]);

  return debouncedValue;
}

export interface CompProps {
  render: (st: string[]) => ReactElement;
}

export const Comp: React.FC<CompProps> = ({ render }) => {
  const [state, setState] = useState([
    "meow",
    "meow-meow",
    "meow-meow-meow",
    "meow-meow-meow-meow",
  ]);

  return render(state);
};

export const Page: React.FC = () => {
  const [inputValue, setInputValue] = useState("");

  // Используем кастомный хук
  const debouncedValue = useDebounce(inputValue, 500);

  // Имитация запроса к серверу при изменении debounced значения
  useEffect(() => {
    if (debouncedValue) {
      console.log("Отправка мокового запроса с:", debouncedValue);
      // Например: fetch(`/api/search?q=${debouncedValue}`)
    }
  }, [debouncedValue]);

  return (
    <div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Введите текст (с debounce)..."
        style={{
          padding: "8px",
          fontSize: "16px",
          marginBottom: "16px",
          width: "300px",
        }}
      />
      <p>
        Отправлено на сервер: <strong>{debouncedValue || "—"}</strong>
      </p>

      <Comp render={(meow) => <h1>{meow.join(" | ")}</h1>} />
    </div>
  );
};
