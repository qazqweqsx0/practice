import { type Card, type Grade, type Note } from "./api";
import { tagLabel } from "./format";
import { bindAsyncButton } from "./ui";

export const GRADES: Grade[] = ["again", "hard", "good", "easy"];

export const GRADE_LABELS: Record<Grade, string> = {
  again: "Забыл",
  hard: "Трудно",
  good: "Хорошо",
  easy: "Легко",
};

interface NoteHandlers {
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => Promise<void>;
  onQueue: (note: Note) => Promise<void>;
  onError: (error: unknown) => void;
  onClear: () => void;
}

export function renderNoteItem(
  note: Note,
  handlers: NoteHandlers,
): HTMLLIElement {
  const item = document.createElement("li");
  item.dataset.testid = "note";
  item.dataset.id = note.id;

  const title = document.createElement("span");
  title.className = "note-title";
  title.textContent = note.title;

  const tags = document.createElement("span");
  tags.className = "note-tags";
  tags.textContent = tagLabel(note.tags);

  const toQueue = document.createElement("button");
  toQueue.type = "button";
  toQueue.textContent = "в повторение";
  toQueue.dataset.testid = "note-to-queue";
  toQueue.setAttribute("aria-label", `Добавить в повторение: ${note.title}`);
  bindAsyncButton(toQueue, handlers.onError, handlers.onClear, () =>
    handlers.onQueue(note),
  );

  const edit = document.createElement("button");
  edit.type = "button";
  edit.textContent = "изменить";
  edit.dataset.testid = "edit-note";
  edit.setAttribute("aria-label", `Изменить заметку: ${note.title}`);
  edit.addEventListener("click", () => {
    handlers.onClear();
    handlers.onEdit(note);
  });

  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "удалить";
  remove.dataset.testid = "delete-note";
  remove.setAttribute("aria-label", `Удалить заметку: ${note.title}`);
  bindAsyncButton(remove, handlers.onError, handlers.onClear, () =>
    handlers.onDelete(note),
  );

  item.append(title, tags, toQueue, edit, remove);
  return item;
}

export function renderCardItem(
  card: Card,
  onGrade: (cardId: string, grade: Grade) => Promise<void>,
  onError: (error: unknown) => void,
  onClear: () => void,
): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.className = "card";
  wrap.dataset.testid = "queue-card";
  wrap.dataset.id = card.id;

  const front = document.createElement("p");
  front.className = "front";
  front.textContent = card.front;

  const back = document.createElement("p");
  back.className = "back";
  back.textContent = card.back;

  const buttons = document.createElement("div");
  buttons.className = "grade-buttons";
  for (const grade of GRADES) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = GRADE_LABELS[grade];
    button.dataset.testid = `grade-${grade}`;
    button.setAttribute("aria-label", `Оценить: ${GRADE_LABELS[grade]}`);
    bindAsyncButton(button, onError, onClear, () => onGrade(card.id, grade));
    buttons.append(button);
  }

  wrap.append(front, back, buttons);
  return wrap;
}
