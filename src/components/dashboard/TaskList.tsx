"use client";

import { useState, useTransition, type FormEvent } from "react";
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
  deleteTask,
  reorderTasks,
} from "@/app/dashboard/actions";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  status: "TODO" | "DONE";
  orderIndex: number;
};

export function TaskList({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [newTitle, setNewTitle] = useState("");
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setTasks((current) => {
      const oldIndex = current.findIndex((t) => t.id === active.id);
      const newIndex = current.findIndex((t) => t.id === over.id);
      const reordered = arrayMove(current, oldIndex, newIndex);
      startTransition(() => {
        reorderTasks(reordered.map((t) => t.id));
      });
      return reordered;
    });
  }

  async function handleAddTask(e: FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle("");
    const tempId = `temp-${Date.now()}`;
    setTasks((current) => [
      ...current,
      { id: tempId, title, status: "TODO", orderIndex: current.length },
    ]);

    try {
      const created = await createTask(title);
      // troca o id temporário pelo id real do banco — sem isso, editar/excluir/marcar
      // essa tarefa antes de um reload falha porque o id temporário não existe no banco
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

  return (
    <div>
      <form onSubmit={handleAddTask} className="mb-4 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Nova tarefa..."
          className="input flex-1"
        />
        <button type="submit" className="onn-btn-primary">
          Adicionar
        </button>
      </form>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col gap-2">
            {tasks.map((task) => (
              <SortableTaskRow
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onRename={handleRename}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {tasks.length === 0 && (
        <p className="mt-4 text-sm text-zinc-400">Nenhuma tarefa ainda.</p>
      )}
    </div>
  );
}

function SortableTaskRow({
  task,
  onToggle,
  onDelete,
  onRename,
}: {
  task: Task;
  onToggle: (id: string, status: "TODO" | "DONE") => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
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
