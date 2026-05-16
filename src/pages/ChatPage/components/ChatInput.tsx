import { FormEvent } from "react";
import { Button, TextInput } from "../../../shared/ui";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  canSend: boolean;
}

const ChatInput = ({ value, onChange, onSend, canSend }: ChatInputProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSend();
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <TextInput
        className="chat-input__field"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Напишите сообщение..."
        aria-label="Введите сообщение"
      />
      <Button className="chat-input__button" type="submit" disabled={!canSend}>
        Отправить
      </Button>
    </form>
  );
};

export default ChatInput;
