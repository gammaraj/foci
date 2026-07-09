/** Blur any open native date input so pickers don't linger or steal the next click. */
export function dismissDatePicker() {
  const active = document.activeElement;
  if (active instanceof HTMLInputElement && active.type === "date") {
    active.blur();
  }
}

/** Close handler for modals/drawers — prevents the click from falling through to the page below. */
export function dismissOverlay(onClose: () => void) {
  dismissDatePicker();
  onClose();
}

export function handleOverlayDismiss(
  e: React.MouseEvent<HTMLButtonElement>,
  onClose: () => void,
) {
  e.preventDefault();
  e.stopPropagation();
  dismissOverlay(onClose);
}
