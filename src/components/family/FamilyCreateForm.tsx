import React, { useState } from 'react';
import { UserPlus, Shield, X, Loader2 } from 'lucide-react';
import { TouchOptimized } from '../ui/TouchOptimized';

interface FamilyCreateFormProps {
  onSubmit: (data: {
    name: string;
    description: string;
    privacyLevel: 'private' | 'family-only' | 'extended';
  }) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

export function FamilyCreateForm({
  onSubmit,
  onCancel,
  className = ''
}: FamilyCreateFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<'private' | 'family-only' | 'extended'>('family-only');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Family name is required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        privacyLevel
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create family');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Create New Family</h2>
          <TouchOptimized>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </TouchOptimized>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="familyName" className="block text-sm font-medium text-gray-700 mb-1">
              Family Name *
            </label>
            <input
              id="familyName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500"
              placeholder="e.g., The Johnson Family"
              required
            />
          </div>
          
          <div>
            <label htmlFor="familyDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="familyDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-500 resize-none"
              placeholder="A brief description of your family"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Privacy Level
            </label>
            <div className="space-y-2">
              <TouchOptimized>
                <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="privacy"
                    checked={privacyLevel === 'private'}
                    onChange={() => setPrivacyLevel('private')}
                    className="text-sage-600 focus:ring-sage-500 h-4 w-4"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Private</p>
                    <p className="text-xs text-gray-500">Only you can see and add memories</p>
                  </div>
                </label>
              </TouchOptimized>
              
              <TouchOptimized>
                <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="privacy"
                    checked={privacyLevel === 'family-only'}
                    onChange={() => setPrivacyLevel('family-only')}
                    className="text-sage-600 focus:ring-sage-500 h-4 w-4"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Family Only</p>
                    <p className="text-xs text-gray-500">Only invited family members can participate</p>
                  </div>
                </label>
              </TouchOptimized>
              
              <TouchOptimized>
                <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="privacy"
                    checked={privacyLevel === 'extended'}
                    onChange={() => setPrivacyLevel('extended')}
                    className="text-sage-600 focus:ring-sage-500 h-4 w-4"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Extended Family</p>
                    <p className="text-xs text-gray-500">Family members can invite other relatives</p>
                  </div>
                </label>
              </TouchOptimized>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-2">
            <TouchOptimized>
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </TouchOptimized>
            
            <TouchOptimized>
              <button
                type="submit"
                disabled={!name.trim() || isSubmitting}
                className="flex items-center space-x-2 bg-sage-700 text-white px-4 py-2 rounded-lg hover:bg-sage-800 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    <span>Create Family</span>
                  </>
                )}
              </button>
            </TouchOptimized>
          </div>
        </form>
      </div>
    </div>
  );
}