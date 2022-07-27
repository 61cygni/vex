import { mutation } from "./_generated/server";
import { Id } from "convex/values";

// Send a message to the given chat channel.
export default mutation(async ({ db }, channel: Id, body: string, author: string) => {
 console.log("sendMessage: " + channel + ":"+body);

 let cur_time = Date.now();

  // delete all messages older than 30s
  let msgs = await db.table("messages").collect();

  for (let i = 0; i < msgs.length; i++){
    console.log("XXXX message!"+(cur_time - msgs[i].time) );
    if((cur_time - msgs[i].time) > 20000){
        console.log("Deleting message!");
        db.delete(msgs[i]._id);
    }
  }

  const message = {
    channel,
    body,
    author,
    time: cur_time,
  };
  db.insert("messages", message);
});
