import "./style.css";
import { api, type Grade, type Note } from "./api";
import { cardSidesFromNote, parseTags, tagsForInput } from "./format";
import { renderCardItem, renderNoteItem } from "./render";
import { bindStatus, field, need } from "./ui";

const statusBar = need("#status");
const { showError, clearStatus, showMessage } = bindStatus(statusBar);

const noteFormEl = need("#note-form");
const searchInputEl = need("[data-testid='note-search-q']");
const noteSubmit = need("[data-testid='note-submit']");
const noteCancelEdit = need("#note-cancel");
const notesToggle = need("#notes-toggle");
const notesPanel = need("#notes-panel");

if (!(noteFormEl instanceof HTMLFormElement)) {
  throw new Error("нет формы #note-form");
}
if (!(searchInputEl instanceof HTMLInputElement)) {
  throw new Error("нет поля поиска заметок");
}
if (!(noteSubmit instanceof HTMLButtonElement)) {
  throw new Error("нет кнопки отправки заметки");
}
if (!(noteCancelEdit instanceof HTMLButtonElement)) {
  throw new Error("нет кнопки отмены редактирования");
}
if (!(notesToggle instanceof HTMLButtonElement)) {
  throw new Error("нет кнопки сворачивания заметок");
}

const noteForm = noteFormEl;
const searchInput = searchInputEl;

let editingNoteId: string | null = null;
let searchTimer: ReturnType<typeof setTimeout> | undefined;

const noteHandlers = {
  onEdit: startEditing,
  onDelete: deleteNote,
  onQueue: queueNote,
  onError: showError,
  onClear: clearStatus,
};

function noteInputFromForm(): { title: string; body: string; tags: string[] } {
  const data = new FormData(noteForm);
  return {
    title: field(data, "title"),
    body: field(data, "body"),
    tags: parseTags(field(data, "tags")),
  };
}

function currentSearch(): { q?: string } {
  const q = searchInput.value.trim();
  return q !== "" ? { q } : {};
}

function resetNoteForm(): void {
  editingNoteId = null;
  noteForm.reset();
  noteSubmit.textContent = "Добавить заметку";
  noteCancelEdit.hidden = true;
}

function startEditing(note: Note): void {
  editingNoteId = note.id;
  (noteForm.elements.namedItem("title") as HTMLInputElement).value = note.title;
  (noteForm.elements.namedItem("body") as HTMLTextAreaElement).value =
    note.body;
  (noteForm.elements.namedItem("tags") as HTMLInputElement).value =
    tagsForInput(note.tags);
  noteSubmit.textContent = "Сохранить";
  noteCancelEdit.hidden = false;
  noteForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function deleteNote(note: Note): Promise<void> {
  await api.deleteNote(note.id);
  if (editingNoteId === note.id) {
    resetNoteForm();
  }
  await refreshNotes();
}

async function queueNote(note: Note): Promise<void> {
  const { front, back } = cardSidesFromNote(note);
  await api.createCard({ note_id: note.id, front, back });
  await Promise.all([refreshStats(), refreshQueue()]);
  showMessage("Карточка добавлена в очередь");
}

async function gradeCard(cardId: string, grade: Grade): Promise<void> {
  await api.grade(cardId, grade);
  await refreshAll();
}

async function refreshStats(): Promise<void> {
  const stats = await api.stats();
  need("[data-stat='due_today']").textContent = String(stats.due_today);
  need("[data-stat='due_week']").textContent = String(stats.due_week);
  need("[data-stat='streak']").textContent = String(stats.streak);
}

async function refreshNotes(): Promise<void> {
  const notes = await api.listNotes(currentSearch());
  need("#note-list").replaceChildren(
    ...notes.map((note) => renderNoteItem(note, noteHandlers)),
  );
}

async function refreshAllNotes(): Promise<void> {
  const notes = await api.listNotes();
  need("#note-list").replaceChildren(
    ...notes.map((note) => renderNoteItem(note, noteHandlers)),
  );
}

async function refreshQueue(): Promise<void> {
  const cards = await api.queue();
  const box = need("#queue");
  if (cards.length === 0) {
    const done = document.createElement("p");
    done.dataset.testid = "queue-empty";
    done.textContent = "На сегодня всё повторено.";
    box.replaceChildren(done);
    return;
  }
  box.replaceChildren(
    ...cards.map((card) =>
      renderCardItem(card, gradeCard, showError, clearStatus),
    ),
  );
}

async function refreshAll(): Promise<void> {
  await Promise.all([refreshStats(), refreshNotes(), refreshQueue()]);
}

searchInput.addEventListener("input", () => {
  clearStatus();
  if (searchTimer !== undefined) {
    clearTimeout(searchTimer);
  }
  searchTimer = setTimeout(() => {
    void refreshNotes().catch(showError);
  }, 300);
});

need("#note-search-reset").addEventListener("click", () => {
  searchInput.value = "";
  clearStatus();
  void refreshAllNotes().catch(showError);
});

noteCancelEdit.addEventListener("click", () => {
  resetNoteForm();
  clearStatus();
});

notesToggle.addEventListener("click", () => {
  const hidden = notesPanel.hidden;
  notesPanel.hidden = !hidden;
  notesToggle.textContent = hidden ? "Скрыть" : "Показать";
});

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = noteInputFromForm();

  noteSubmit.disabled = true;
  clearStatus();
  const action =
    editingNoteId === null
      ? api.createNote(input).then(() => {
          resetNoteForm();
        })
      : api.updateNote(editingNoteId, input).then(() => {
          resetNoteForm();
        });

  void action
    .then(() => refreshNotes())
    .catch(showError)
    .finally(() => (noteSubmit.disabled = false));
});

statusBar.textContent = "Загрузка…";
void refreshAll().then(clearStatus, showError);
