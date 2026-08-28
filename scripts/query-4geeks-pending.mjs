import { get4GeeksJson, summarizeTask, taskList } from "./4geeks-client.mjs";

try {
  const payload = await get4GeeksJson("/v1/assignment/user/me/task?task_status=PENDING");
  const pendingItems = taskList(payload).map(summarizeTask);
  console.log(JSON.stringify({ totalPendingItems: pendingItems.length, pendingItems }, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
