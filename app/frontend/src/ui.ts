import { ApiError } from "./api";

export function need(selector: string): HTMLElement {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`нет элемента: ${selector}`);
  }
  return el;
}

export function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

export function bindStatus(statusBar: HTMLElement) {
  function showError(error: unknown): void {
    statusBar.textContent =
      error instanceof ApiError
        ? `Ошибка: ${error.message}`
        : "Что-то пошло не так";
    statusBar.dataset.state = "error";
  }

  function clearStatus(): void {
    statusBar.textContent = "";
    delete statusBar.dataset.state;
  }

  function showMessage(message: string): void {
    statusBar.textContent = message;
    delete statusBar.dataset.state;
  }

  return { showError, clearStatus, showMessage };
}

export function bindAsyncButton(
  button: HTMLButtonElement,
  onError: (error: unknown) => void,
  onClear: () => void,
  action: () => Promise<void>,
): void {
  button.addEventListener("click", () => {
    button.disabled = true;
    onClear();
    void action()
      .catch(onError)
      .finally(() => (button.disabled = false));
  });
}
