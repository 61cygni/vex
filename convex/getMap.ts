import { query } from "./_generated/server";

export default query(async ({ db }, level : number): Promise<string> => {
  const mapDoc = await db.table("the_map")
                          .filter(q => q.eq(q.field("level"), level))
                          .first();
  if (mapDoc === null) {
    console.log("Unable to find map at level: "+level);
    return null;
  }
  console.log("Got map of level"+level);
  return mapDoc.body;
});
