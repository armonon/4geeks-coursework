import { get4GeeksJson, summarizeTask, taskList } from "./4geeks-client.mjs";

try {
  const payload = await get4GeeksJson("/v1/assignment/user/me/task?task_type=PROJECT");
  const projects = taskList(payload).map(summarizeTask);
  console.log(JSON.stringify({ totalProjects: projects.length, projects }, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
