import { describe, expect, it } from "vitest";
import { clampOffset, cropRect, outputSize } from "./crop";

const frame = { width: 240, height: 320 };

describe("recorte da foto", () => {
  it("sem zoom nem deslocamento, recorta o centro de uma imagem horizontal", () => {
    expect(cropRect({ width: 4000, height: 3000 }, frame, 1, { x: 0, y: 0 })).toEqual({
      x: 875,
      y: 0,
      width: 2250,
      height: 3000,
    });
  });

  it("o zoom reduz a área recortada", () => {
    const r = cropRect({ width: 3000, height: 4000 }, frame, 2, { x: 0, y: 0 });
    expect(r).toEqual({ x: 750, y: 1000, width: 1500, height: 2000 });
  });

  it("arrastar a imagem para a direita mostra a parte mais à esquerda", () => {
    const image = { width: 4000, height: 3000 };
    const offset = clampOffset({ x: 9999, y: 0 }, image, frame, 1);
    expect(offset.x).toBeCloseTo(93.33);
    expect(cropRect(image, frame, 1, offset).x).toBeCloseTo(0);
  });

  it("não deixa deslocar para fora da moldura", () => {
    const offset = clampOffset({ x: 50, y: -50 }, { width: 300, height: 400 }, frame, 1);
    expect(offset.x).toBeCloseTo(0);
    expect(offset.y).toBeCloseTo(0);
  });

  it("reduz imagens grandes e nunca aumenta as pequenas", () => {
    expect(outputSize({ width: 2250, height: 3000 }, 600)).toEqual({ width: 600, height: 800 });
    expect(outputSize({ width: 300, height: 400 }, 600)).toEqual({ width: 300, height: 400 });
  });
});
