import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { TaskList } from "@/components/dashboard/TaskList";
import { ClipboardList, CalendarDays } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const firstName = (session?.user?.name ?? "").split(" ")[0] || "";

  const [tasks, pendingTasks, nextEvent] = await Promise.all([
    db.task.findMany({ orderBy: { orderIndex: "asc" } }),
    db.task.count({ where: { status: "TODO" } }),
    db.event.findFirst({
      where: { status: { in: ["PLANNED", "OPEN"] } },
      orderBy: { eventDate: "asc" },
    }),
  ]);

  const plainTasks = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    orderIndex: t.orderIndex,
  }));

  const nextEventLabel = nextEvent
    ? nextEvent.eventDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        timeZone: "UTC",
      })
    : "Nenhum agendado";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <div className="mb-8 p-6 sm:p-8">
        <h1 className="font-display text-4xl sm:text-5xl">
          {firstName ? `Bem-vinda, ${firstName}` : "Bem-vinda"}
        </h1>
        <p className="mt-1 text-sm text-[#14162e]/70">
          Um resumo rápido de como a operação está agora.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatChip icon={ClipboardList} label="Tarefas pendentes" value={pendingTasks} />
          <StatChip
            icon={CalendarDays}
            label={nextEvent ? `Próximo evento — ${nextEvent.name}` : "Próximo evento"}
            value={nextEventLabel}
          />
        </div>
      </div>

      <h2 className="mb-1 text-lg font-semibold text-[#14162e]">Tarefas</h2>
      <p className="mb-4 text-sm text-zinc-500">
        Por prioridade. Arraste pra reordenar dentro de cada tabela.
      </p>
      <TaskList initialTasks={plainTasks} />
    </div>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: number | string;
}) {
  return (
    <div className="onn-stat-chip flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-onn-primary/10 text-onn-primary">
        <Icon size={18} />
      </span>
      <div>
        <p className="font-display text-2xl leading-none text-[#14162e]">{value}</p>
        <p className="text-xs text-[#14162e]/60">{label}</p>
      </div>
    </div>
  );
}
