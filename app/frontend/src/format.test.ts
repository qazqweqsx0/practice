import { describe, expect, it } from "vitest";
import { cardSidesFromNote, parseTags, tagLabel, tagsForInput } from "./format";

describe("parseTags", () => {
  it("разбивает по запятой, обрезает пробелы и выкидывает пустые", () => {
    expect(parseTags("a, b ,, c ")).toEqual(["a", "b", "c"]);
  });

  it("на пустой строке возвращает пустой список", () => {
    expect(parseTags("   ")).toEqual([]);
  });
});

describe("tagLabel", () => {
  it("склеивает теги через запятую", () => {
    expect(tagLabel(["x", "y"])).toBe("x, y");
  });

  it("для пустого списка возвращает пустую строку", () => {
    expect(tagLabel([])).toBe("");
  });
});

describe("tagsForInput", () => {
  it("склеивает теги для поля ввода", () => {
    expect(tagsForInput(["memory", "learning"])).toBe("memory, learning");
  });
});

describe("cardSidesFromNote", () => {
  it("берёт заголовок как вопрос, текст как ответ", () => {
    expect(
      cardSidesFromNote({ title: "HTTP", body: "Hypertext Transfer Protocol" }),
    ).toEqual({
      front: "HTTP",
      back: "Hypertext Transfer Protocol",
    });
  });

  it("без текста дублирует заголовок на обороте", () => {
    expect(cardSidesFromNote({ title: "Термин", body: "  " })).toEqual({
      front: "Термин",
      back: "Термин",
    });
  });
});
