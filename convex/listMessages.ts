import { query } from "./_generated/server";
import { Id } from "convex/values";
import { Message } from "../src/common";

// List all chat messages in the given channel.
export default query(async ({ db }, channel: Id): Promise<{}> => {
  console.log("listMessages: "+channel);

  return await db
    .query("messages")
    .order("desc").first(); // return the last message entered
});
