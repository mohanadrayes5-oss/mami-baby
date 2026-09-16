import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(user: TrpcContext["user"] = null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Mami Baby protected data procedures", () => {
  it("returns no user for an anonymous session", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.auth.me()).resolves.toBeNull();
  });

  it("rejects child data for an anonymous session", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.children.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
