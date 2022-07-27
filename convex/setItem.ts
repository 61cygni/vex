import { mutation } from "./_generated/server";

// Set the map 
export default mutation(async ({ db }, id : Id, level : number, icon: string, x : number, y : number ) => {

  console.log("setItem: " + id);
  const item = { level, icon, x, y, };

  if (id == null) {
    console.log("Inserting new item: "+icon);
    db.insert("items", item);
    return;
  }

  let old_item = await db.table("items").get(id);
  if(!old_item){
    console.log("Could not find item "+id+" bailing!");
    return;
  }

  db.replace(item._id, item);
});

