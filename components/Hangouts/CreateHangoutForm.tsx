import React, { useState } from 'react';
import { User } from '../../backend/src/types';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Avatar from '../UI/Avatar';
import Alert from '../UI/Alert';

interface CreateHangoutFormProps {
  participants: User[];
  onSubmit: (activityDescription: string, details: string) => void;
  onClose: () => void;
}

const CreateHangoutForm: React.FC<CreateHangoutFormProps> = ({ participants, onSubmit, onClose }) => {
  const [activityDescription, setActivityDescription] = useState('');
  const [details, setDetails] = useState('');
  const [alert, setAlert] = useState<{ message: string; type?: 'error' | 'info' } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityDescription.trim()) {
      setAlert({ message: "Please provide an activity description.", type: 'error' });
      return;
    }
    if (participants.length === 0) {
      setAlert({ message: "Please select at least one participant.", type: 'error' });
      return;
    }
    onSubmit(activityDescription, details);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} inline />}
      <div>
        <h3 className="text-lg font-medium text-slate-200 mb-2">Inviting:</h3>
        {participants.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4 max-h-32 overflow-y-auto p-2 bg-slate-700 rounded-md">
            {participants.map(p => (
              <div key={p.id} className="flex items-center bg-slate-600 px-2 py-1 rounded-full text-sm">
                <Avatar src={p.profileImageUrl} name={p.name} size="sm" className="w-5 h-5 mr-1.5" />
                {p.name}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400">No participants selected yet.</p>
        )}
      </div>
      <Input
        label="Activity / Message (e.g., 'Grab food?', 'Movie night')"
        type="text"
        value={activityDescription}
        onChange={(e) => setActivityDescription(e.target.value)}
        placeholder="What's the plan?"
        required
      />
      <Input
        label="Details (optional)"
        type="text"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="Add more details (e.g., time, place, notes)"
      />
      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={participants.length === 0 || !activityDescription.trim()}>Send Hangout Request</Button>
      </div>
    </form>
  );
};

export default CreateHangoutForm;
