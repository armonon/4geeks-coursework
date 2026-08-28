import { get4GeeksJson } from "./4geeks-client.mjs";

try {
  const profile = await get4GeeksJson("/v1/admissions/user/me");
  console.log(JSON.stringify({
    sessionActive: true,
    academyCount: profile?.roles?.length ?? 0,
    activeCohortCount: profile?.cohort_set?.length ?? profile?.cohorts?.length ?? 0,
  }, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
