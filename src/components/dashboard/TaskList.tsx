"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { TaskPriority } from "@prisma/client";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import {
  createTask,
  toggleTaskStatus,
  updateTaskTitle,
  updateTaskPriority,
  deleteTask,
  reorderTasks,
} from "@/app/dashboard/actions";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  status: "TODO" | "DONE";
  priority: TaskPriority;
  orderIndex: number;
};

const PRIORITY_ORDER: TaskPriority[] = ["ALTA", "MEDIA", "BAIXA"];

const PRIORITY_META: Record<
  TaskPriority,
  { label: string; dot: string; badge: string; ring: string }
> = {
  ALTA: {
    label: "Alta prioridade",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700",
    ring: "focus:ring-red-500/30",
  },
  MEDIA: {
    label: "Média prioridade",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700",
    ring: "focus:ring-amber-500/30",
  },
  BAIXA: {
    label: "Baixa prioridade",
    dot: "bg-onn-support",
    badge: "bg-onn-support/30 text-[#1c2b57]",
    ring: "focus:ring-onn-support/40",
  },
};

export function TaskList({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("MEDIA");

  async function handleAddTask(e: FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle("");
    const tempId = `temp-${Date.now()}`;
    setTasks((current) => [
      ...current,
      { id: tempId, title, status: "TODO", priority: newPriority, orderIndex: current.length },
    ]);

    try {
      const created = await createTask(title, newPriority);
      setTasks((current) => current.map((t) => (t.id === tempId ? created : t)));
    } catch {
      setTasks((current) => current.filter((t) => t.id !== tempId));
    }
  }

  async function handleToggle(id: string, currentStatus: "TODO" | "DONE") {
    const nextStatus = currentStatus === "TODO" ? "DONE" : "TODO";
    setTasks((current) =>
      current.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
    );
    await toggleTaskStatus(id, nextStatus);
  }

  async function handleDelete(id: string) {
    setTasks((current) => current.filter((t) => t.id !== id));
    await deleteTask(id);
  }

  async function handleRename(id: string, title: string) {
    setTasks((current) =>
      current.map((t) => (t.id === id ? { ...t, title } : t))
    );
    await updateTaskTitle(id, title);
  }

  async function handlePriorityChange(id: string, priority: TaskPriority) {
    setTasks((current) => current.map((t) => (t.id === id ? { ...t, priority } : t)));
    await updateTaskPriority(id, priority);
  }

  function handleReorderInGroup(orderedGroupIds: string[], priority: TaskPriority) {
    setTasks((current) => {
      const others = current.filter((t) => t.priority !== priority);
      const reorderedGroup = orderedGroupIds.map(
        (id) => current.find((t) => t.id === id)!
      );
      return [...others, ...reorderedGroup];
    });
    reorderTasks(orderedGroupIds);
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleAddTask} className="flex flex-wrap gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Nova tarefa..."
          className="input flex-1"
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
          className="input w-auto"
        >
          {PRIORITY_ORDER.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_META[p].label}
            </option>
          ))}
        </select>
        <button type="submit" className="onn-btn-primary">
          Adicionar
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        <span className="font-medium text-zinc-400">Legenda:</span>
        {PRIORITY_ORDER.map((p) => (
          <span key={p} className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", PRIORITY_META[p].dot)} />
            {PRIORITY_META[p].label}
          </span>
        ))}
      </div>

      {PRIORITY_ORDER.map((priority) => (
        <PriorityGroup
          key={priority}
          priority={priority}
          tasks={tasks.filter((t) => t.priority === priority).sort((a, b) => a.orderIndex - b.orderIndex)}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onRename={handleRename}
          onPriorityChange={handlePriorityChange}
          onReorder={(ids) => handleReorderInGroup(ids, priority)}
        />
      ))}
    </div>
  );
}

function PriorityGroup({
  priority,
  tasks,
  onToggle,
  onDelete,
  onRename,
  onPriorityChange,
  onReorder,
}: {
  priority: TaskPriority;
  tasks: Task[];
  onToggle: (id: string, status: "TODO" | "DONE") => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onPriorityChange: (id: string, priority: TaskPriority) => void;
  onReorder: (orderedIds: string[]) => void;
}) {
  const meta = PRIORITY_META[priority];
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    onReorder(arrayMove(tasks, oldIndex, newIndex).map((t) => t.id));
  }

  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span className={cn("h-2.5 w-2.5 rounded-full", meta.dot)} />
        <h3 className="text-sm font-semibold text-[#14162e]">{meta.label}</h3>
        <span className="text-xs text-zinc-400">({tasks.length})</span>
      </div>
      <div className="onn-card p-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-2">
              {tasks.map((task) => (
                <SortableTaskRow
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onRename={onRename}
                  onPriorityChange={onPriorityChange}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
        {tasks.length === 0 && (
          <p className="px-1 py-2 text-sm text-zinc-400">Nenhuma tarefa aqui.</p>
        )}
      </div>
    </section>
  );
}

function SortableTaskRow({
  task,
  onToggle,
  onDelete,
  onRename,
  onPriorityChange,
}: {
  task: Task;
  onToggle: (id: string, status: "TODO" | "DONE") => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onPriorityChange: (id: string, priority: TaskPriority) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50/60 px-3 py-2.5 transition-colors",
        task.status === "DONE" && "bg-transparent",
        isDragging && "opacity-60 shadow-md"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-zinc-300 hover:text-zinc-500"
        aria-label="Arrastar"
      >
        <GripVertical size={16} />
      </button>
      <input
        type="checkbox"
        checked={task.status === "DONE"}
        onChange={() => onToggle(task.id, task.status)}
        className="h-4 w-4 rounded border-zinc-300 text-onn-primary accent-onn-primary focus:ring-onn-primary/30"
      />
      {isEditing ? (
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            setIsEditing(false);
            if (title !== task.title) onRename(task.id, title);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="input flex-1 py-1"
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={cn(
            "flex-1 cursor-text text-sm text-[#14162e]",
            task.status === "DONE" && "text-zinc-400 line-through"
          )}
        >
          {task.title}
        </span>
      )}
      <select
        value={task.priority}
        onChange={(e) => onPriorityChange(task.id, e.target.value as TaskPriority)}
        className={cn(
          "rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none",
          PRIORITY_META[task.priority].badge
        )}
      >
        {PRIORITY_ORDER.map((p) => (
          <option key={p} value={p}>
            {PRIORITY_META[p].label}
          </option>
        ))}
      </select>
      <button
        onClick={() => onDelete(task.id)}
        className="text-zinc-300 hover:text-red-600"
        aria-label="Excluir"
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
}
