import { describe, expect, it } from "vitest"
import { DEFAULT_ROUND, PRESETS } from "./schema"

describe("create-round defaults", () => {
  it("exposes the approved Work presets", () => {
    expect(PRESETS.workTime).toEqual([30, 45, 60])
  })

  it("exposes the approved Rest presets", () => {
    expect(PRESETS.restTime).toEqual([10, 20, 30])
  })

  it("starts new rounds at the middle Work and Rest presets", () => {
    expect(DEFAULT_ROUND.value).toBe(45)
    expect(DEFAULT_ROUND.restTime).toBe(20)
  })
})
