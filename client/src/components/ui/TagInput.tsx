import React, { useState } from 'react';
import { HiX, HiPlus } from 'react-icons/hi';

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({ label, value, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    if (inputValue.trim() && !value.includes(inputValue.trim())) {
      onChange([...value, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="tag-input-container">
        <div className="tags-display">
          {value.map((tag, index) => (
            <span key={index} className="tag">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="tag-remove">
                <HiX />
              </button>
            </span>
          ))}
        </div>
        <div className="tag-input-wrapper">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="tag-input"
          />
          <button type="button" onClick={addTag} className="tag-add-btn">
            <HiPlus />
          </button>
        </div>
      </div>
    </div>
  );
};