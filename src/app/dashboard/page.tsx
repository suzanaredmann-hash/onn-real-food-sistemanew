import { db } from "@/lib/db";
import { TaskList } from "@/components/dashboard/TaskList";

export default async function DashboardPage() {
  const tasks = await db.task.findMany({ orderBy: { orderIndex: "asc" } });

  const plainTasks = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    orderIndex: t.orderIndex,
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <h1 className="mb-1 text-2xl font-semibold text-[#14162e]">Dashboard</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Tarefas por prioridade. Arraste pra reordenar.
      </p>
      <div className="onn-card p-4 sm:p-6">
        <TaskList initialTasks={plainTasks} />
      </div>
    </div>
  );
}
