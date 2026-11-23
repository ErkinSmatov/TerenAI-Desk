// Сообщение под полем; id связывается с полем через aria-describedby.
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm leading-normal font-normal text-[#B42318]">
      {message}
    </p>
  );
}
