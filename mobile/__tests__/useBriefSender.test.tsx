/// <reference types="jest" />
import { renderHook, act } from "@testing-library/react-native";
import { useBriefSender } from "../src/hooks/useBriefSender";

jest.mock("../src/services/api", () => ({
  generateBriefApi: async () => "## Summary\nok",
  sendBriefApi: async () => ({ recipient: "UCL", previewUrl: "http://x" }),
}));

test("generate -> review with brief", async () => {
  const { result } = renderHook(() => useBriefSender());
  await act(async () => {
    await result.current.generate([{ date: "x", text: "y" } as any]);
  });
  expect(result.current.status).toBe("review");
  expect(result.current.brief).toContain("Summary");
});

test("send -> success with recipient + preview", async () => {
  const { result } = renderHook(() => useBriefSender());
  await act(async () => {
    await result.current.generate([{ date: "x", text: "y" } as any]);
  });
  await act(async () => {
    await result.current.send("ucl-counselling", "Alex Morgan");
  });
  expect(result.current.status).toBe("success");
  expect(result.current.result?.recipient).toBe("UCL");
  expect(result.current.result?.previewUrl).toBe("http://x");
});
