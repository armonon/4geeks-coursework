import { get4GeeksJson, taskList } from "./4geeks-client.mjs";

try {
  const payload = await get4GeeksJson("/v1/assignment/user/me/task");
  const tasks = taskList(payload);
  const byStatus = {};
  const byType = {};

  for (const task of tasks) {
    const status = task.task_status ?? task.status ?? "UNKNOWN";
    const type = task.task_type ?? task.type ?? "UNKNOWN";
    byStatus[status] = (byStatus[status] ?? 0) + 1;
    byType[type] = (byType[type] ?? 0) + 1;
  }

  const completed = Object.entries(byStatus)
    .filter(([status]) => ["DONE", "APPROVED", "COMPLETED"].includes(status.toUpperCase()))
    .reduce((total, [, count]) => total + count, 0);

  console.log(JSON.stringify({
    totalTasks: tasks.length,
    completedTasks: completed,
    completionPercent: tasks.length ? Number(((completed / tasks.length) * 100).toFixed(1)) : 0,
    byStatus,
    byType,
  }, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
