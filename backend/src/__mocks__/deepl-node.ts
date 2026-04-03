export class Translator {
  translateText = jest.fn().mockResolvedValue({ text: "" });
}

export type TextResult = { text: string };
