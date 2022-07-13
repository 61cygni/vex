import { query } from "./_generated/server";

export default query(async ({ db }): Promise<string> => {
  const mapDoc = await db.table("the_map").first();
  console.log("Got map");
  if (mapDoc === null) {
    return 0;
  }
  return mapDoc.body;
});
