// ShowTask is rendered inside the Board's task detail panel (click on task card).
// This is a simple wrapper – full detail is in TaskDetailModal.
import type { Task } from '../../types';
import TaskDetailModal from '../tasks/TaskDetailModal';

interface ShowTaskProps {
  task: Task | null;
  onClose: () => void;
}

const ShowTask = ({ task, onClose }: ShowTaskProps) => {
  if (!task) return null;
  return <TaskDetailModal isOpen task={task} onClose={onClose} />;
};

export default ShowTask;
