import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Explore from './Explore';
import FieldReviews from '../components/FieldReviews';
import LoginPromptModal from '../components/LoginPromptModal';
import { useAuth } from '../contexts/AuthContext';
import { Field } from '../types';

const ExplorePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reviewField, setReviewField] = useState<Field | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptMessage, setLoginPromptMessage] = useState('');

  const handleBook = (field: Field) => {
    navigate(`/field/${field.id}`);
  };

  const handleReview = (field: Field) => {
    if (!user) {
      setLoginPromptMessage('سجّل الدخول لإضافة تقييمك وإفادة المجتمع الرياضي.');
      setShowLoginPrompt(true);
      return;
    }
    setReviewField(field);
  };

  return (
    <>
      <Explore
        onBook={handleBook}
        onReview={handleReview}
      />

      {/* Reviews panel */}
      {reviewField && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm" dir="rtl">
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center rounded-t-3xl z-10">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <i className="fas fa-star text-amber-400"></i>
                تقييمات — {reviewField.name}
              </h2>
              <button
                onClick={() => setReviewField(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <i className="fas fa-times text-slate-500 text-sm"></i>
              </button>
            </div>
            <div className="p-6">
              <FieldReviews fieldId={reviewField.id} fieldName={reviewField.name} />
            </div>
          </div>
        </div>
      )}

      {/* Login prompt for unauthenticated actions */}
      {showLoginPrompt && (
        <LoginPromptModal
          message={loginPromptMessage}
          onClose={() => setShowLoginPrompt(false)}
        />
      )}
    </>
  );
};

export default ExplorePage;
