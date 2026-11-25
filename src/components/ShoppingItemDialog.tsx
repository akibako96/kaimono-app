import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  titleId: string;
  onClose: () => void;
  children: ReactNode;
}

export function ShoppingItemDialog({ titleId, onClose, children }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={onClose}
      className="modal-overlay shopping-item-dialog flex items-center justify-center bg-black/60 backdrop-blur-xs"
    >
      {children}
    </dialog>
  );
}
