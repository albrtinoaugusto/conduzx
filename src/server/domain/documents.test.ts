import { describe, expect, it } from "vitest";
import { detectFormat, sanitizeFileName } from "./documents";

const bytes = (...v: number[]) => new Uint8Array(v);

describe("detetarFormato", () => {
  it("reconhece PDF, JPG e PNG pelos primeiros bytes", () => {
    expect(detectFormat(new TextEncoder().encode("%PDF-1.7\n"))).toBe("application/pdf");
    expect(detectFormat(bytes(0xff, 0xd8, 0xff, 0xe0, 0x00))).toBe("image/jpeg");
    expect(detectFormat(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00))).toBe("image/png");
  });

  it("rejeita outros formatos e ficheiros vazios", () => {
    expect(detectFormat(new TextEncoder().encode("<html><script>"))).toBeNull();
    expect(detectFormat(new TextEncoder().encode("GIF89a"))).toBeNull();
    expect(detectFormat(bytes())).toBeNull();
  });
});

describe("limparNomeFicheiro", () => {
  it("remove caminhos e caracteres perigosos", () => {
    expect(sanitizeFileName("..\\..\\C:\\bi.pdf", "application/pdf")).toBe("bi.pdf");
    expect(sanitizeFileName('a"b<c>.png', "image/png")).toBe("abc.png");
  });

  it("acrescenta extensão quando falta e usa nome por omissão", () => {
    expect(sanitizeFileName("fotografia", "image/jpeg")).toBe("fotografia.jpg");
    expect(sanitizeFileName("   ", "application/pdf")).toBe("documento.pdf");
  });
});
