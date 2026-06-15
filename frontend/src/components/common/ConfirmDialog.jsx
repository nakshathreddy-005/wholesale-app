import Modal from './Modal';
import { MdWarning } from 'react-icons/md';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title = 'Confirm Delete', message = 'Are you sure? This action cannot be undone.', loading }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className="flex flex-col items-center text-center gap-4">
      <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
        <MdWarning className="text-red-500 text-3xl" />
      </div>
      <p className="text-gray-600 text-sm">{message}</p>
      <div className="flex gap-3 w-full">
        <button onClick={onClose} className="btn-secondary flex-1" disabled={loading}>Cancel</button>
        <button onClick={onConfirm} className="btn-danger flex-1" disabled={loading}>
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </Modal>
);

export default ConfirmDialog;
