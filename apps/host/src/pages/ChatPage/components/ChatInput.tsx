import { ChangeEvent, FormEvent, useEffect, useId, useRef, useState, type JSX, type SVGProps } from "react";
import { Button, TextInput } from "../../../shared/ui";

/** Черновик вложения до отправки */
export interface PendingRepairChatAttachment {
  id: string;
  kind: "image" | "audio";
  name: string;
  dataUrl: string;
  mimeType: string;
}

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
const MAX_IMAGES = 8;

function newAttachmentId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function readFileAsDataURL(file: File): Promise<{ dataUrl: string; mime: string }> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r !== "string") reject(new Error("Не удалось прочитать файл."));
      else resolve({ dataUrl: r, mime: file.type.trim() || "application/octet-stream" });
    };
    reader.onerror = () => reject(new Error("Ошибка чтения файла."));
    reader.readAsDataURL(file);
  });
}

function detectAudioFormat(file: File): "mp3" | "wav" {
  const t = file.type.toLowerCase();
  if (t.includes("mpeg") || t.includes("mp3")) return "mp3";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "mp3") return "mp3";
  return "wav";
}

const PaperclipIcon = (props: SVGProps<SVGSVGElement>): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      d="M9.5 12.8 14.9 7.4a3.1 3.1 0 0 1 4.4 4.4l-7.2 7.2a5 5 0 0 1-7.1-7.1l7.8-7.8a6.8 6.8 0 0 1 9.6 9.6l-7.7 7.7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ImageIcon = (props: SVGProps<SVGSVGElement>): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <rect x="3.5" y="5" width="17" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="m6.5 16 4.2-4.2a1.4 1.4 0 0 1 2 0L16.8 16m-2.1-2.1 1.2-1.2a1.4 1.4 0 0 1 2 0L20.5 15.3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="16.5" cy="8.8" r="1.2" fill="currentColor" />
  </svg>
);

const AudioIcon = (props: SVGProps<SVGSVGElement>): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path d="M4 13v-2m4 5V8m4 11V5m4 11V8m4 5v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  canSend: boolean;
  disabled?: boolean;
  pendingAttachments: PendingRepairChatAttachment[];
  onAttachmentsChange: (next: PendingRepairChatAttachment[]) => void;
}

const ChatInput = ({
  value,
  onChange,
  onSend,
  canSend,
  disabled,
  pendingAttachments,
  onAttachmentsChange,
}: ChatInputProps): JSX.Element => {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const attachMenuRef = useRef<HTMLDivElement | null>(null);
  const baseId = useId();
  const [isAttachMenuOpen, setAttachMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAttachMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && attachMenuRef.current?.contains(target)) return;
      setAttachMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isAttachMenuOpen]);

  const commitPending = (
    updater: (
      draft: PendingRepairChatAttachment[]
    ) => PendingRepairChatAttachment[]
  ) => {
    onAttachmentsChange(updater([...pendingAttachments]));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSend();
  };

  const handlePickImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files;
    event.target.value = "";
    if (!picked?.length) return;

    try {
      const incoming: PendingRepairChatAttachment[] = [];
      const audioOne = pendingAttachments.find((p) => p.kind === "audio");
      let imageCount = pendingAttachments.filter((p) => p.kind === "image").length;

      for (const file of Array.from(picked)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > MAX_IMAGE_BYTES) {
          alert(`Изображение «${file.name}» слишком большое (до ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} МБ).`);
          continue;
        }
        if (imageCount >= MAX_IMAGES) {
          alert(`Не более ${MAX_IMAGES} изображений в одном сообщении.`);
          break;
        }
        const { dataUrl, mime } = await readFileAsDataURL(file);
        incoming.push({
          id: newAttachmentId(),
          kind: "image",
          name: file.name,
          dataUrl,
          mimeType: mime,
        });
        imageCount++;
      }

      commitPending((base) => {
        const imgs = [...base.filter((p) => p.kind === "image"), ...incoming].slice(0, MAX_IMAGES);
        return audioOne ? [audioOne, ...imgs] : imgs;
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Не удалось добавить изображение.");
    }
  };

  const handlePickAudio = async (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;

    try {
      const mimeLower = picked.type.toLowerCase();
      const ext = picked.name.split(".").pop()?.toLowerCase() ?? "";
      const looksAudio =
        mimeLower.includes("wav") ||
        mimeLower.includes("mpeg") ||
        mimeLower.includes("mp3") ||
        ext === "wav" ||
        ext === "mp3";
      if (!looksAudio) {
        alert("Поддерживаются только WAV и MP3.");
        return;
      }

      if (picked.size > MAX_AUDIO_BYTES) {
        alert(`Аудио «${picked.name}» слишком большое (до ${Math.round(MAX_AUDIO_BYTES / (1024 * 1024))} МБ).`);
        return;
      }

      if (pendingAttachments.some((p) => p.kind === "audio")) {
        if (!window.confirm("Заменить текущее аудио новым файлом?")) return;
      }

      const fmt = detectAudioFormat(picked);
      const mime = fmt === "mp3" ? "audio/mpeg" : "audio/wav";
      const { dataUrl } = await readFileAsDataURL(
        picked.type ? picked : new File([picked], picked.name || `clip.${fmt}`, { type: mime })
      );

      const att: PendingRepairChatAttachment = {
        id: newAttachmentId(),
        kind: "audio",
        name: picked.name,
        dataUrl,
        mimeType: mime,
      };

      commitPending((base) => {
        const imgs = base.filter((p) => p.kind === "image").slice(0, MAX_IMAGES);
        return [att, ...imgs];
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Не удалось добавить аудио.");
    }
  };

  const removeAttachment = (id: string) => {
    commitPending((base) => base.filter((p) => p.id !== id));
  };

  const openImagePicker = () => {
    setAttachMenuOpen(false);
    imageInputRef.current?.click();
  };

  const openAudioPicker = () => {
    setAttachMenuOpen(false);
    audioInputRef.current?.click();
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <input
        id={`${baseId}-img`}
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
        multiple
        className="chat-input__file-hidden"
        onChange={handlePickImages}
        disabled={disabled}
      />
      <input
        id={`${baseId}-snd`}
        ref={audioInputRef}
        type="file"
        accept=".wav,.mp3,audio/wav,audio/mpeg,audio/mp3"
        className="chat-input__file-hidden"
        onChange={handlePickAudio}
        disabled={disabled}
      />

      <div className="chat-input__left">
        {pendingAttachments.length > 0 && (
          <div className="chat-input__attachments-bar" aria-label="Черновики вложений">
            {pendingAttachments.map((item) => (
              <span key={item.id} className="chat-input__chip">
                <span className="chat-input__chip-label">
                  {item.kind === "image" ? "Фото · " : "Аудио · "}
                  <span title={item.name}>
                    {item.name.length > 18 ? `${item.name.slice(0, 17)}…` : item.name}
                  </span>
                </span>
                <button
                  type="button"
                  className="chat-input__chip-remove"
                  aria-label={`Удалить «${item.name}»`}
                  disabled={disabled}
                  onClick={() => removeAttachment(item.id)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="chat-input__compose-row">
          <div className="chat-input__attach-menu" ref={attachMenuRef}>
            <button
              type="button"
              className="chat-input__attach-trigger"
              disabled={disabled}
              title="Добавить вложение"
              aria-label="Добавить вложение"
              aria-haspopup="menu"
              aria-expanded={isAttachMenuOpen}
              onClick={() => setAttachMenuOpen((isOpen) => !isOpen)}
            >
              <PaperclipIcon className="chat-input__attach-trigger-icon" />
            </button>

            {isAttachMenuOpen && (
              <div className="chat-input__attach-popup" role="menu" aria-label="Выберите тип вложения">
                <button
                  type="button"
                  className="chat-input__attach-option"
                  role="menuitem"
                  onClick={openImagePicker}
                >
                  <span className="chat-input__attach-option-icon">
                    <ImageIcon />
                  </span>
                  <span>
                    <span className="chat-input__attach-option-title">Изображение</span>
                    <span className="chat-input__attach-option-hint">JPG, PNG, WebP или GIF</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="chat-input__attach-option"
                  role="menuitem"
                  onClick={openAudioPicker}
                >
                  <span className="chat-input__attach-option-icon">
                    <AudioIcon />
                  </span>
                  <span>
                    <span className="chat-input__attach-option-title">Аудио</span>
                    <span className="chat-input__attach-option-hint">WAV или MP3</span>
                  </span>
                </button>
              </div>
            )}
          </div>

          <TextInput
            className="chat-input__field"
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Комментарий к фото, вопрос или описание симптома…"
            aria-label="Введите сообщение"
            disabled={disabled}
          />
        </div>
      </div>

      <Button className="chat-input__button" type="submit" disabled={!canSend || disabled}>
        Отправить
      </Button>
    </form>
  );
};

export default ChatInput;
