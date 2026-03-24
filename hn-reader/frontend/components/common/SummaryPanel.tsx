'use client';

import { useSummary } from '@/hooks/summary/useSummary';
import { useGenerateSummary } from '@/hooks/summary/useGenerateSummary';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface SummaryPanelProps {
  storyId: number;
}

export default function SummaryPanel({ storyId }: SummaryPanelProps) {
  const { data: summary, isLoading: isFetching, error: fetchError } = useSummary(storyId, false);
  const generateMutation = useGenerateSummary(storyId);

  const loading = isFetching || generateMutation.isPending;
  const error = fetchError || generateMutation.error;

  const generateSummary = () => {
    generateMutation.mutate();
  };

  const sentimentColors = {
    positive: 'text-green-700 bg-green-50 border-green-200',
    negative: 'text-red-700 bg-red-50 border-red-200',
    neutral: 'text-gray-700 bg-gray-50 border-gray-200',
    mixed: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  };

  const displaySummary = summary || generateMutation.data;
  const errorMessage = error instanceof Error ? error.message : error ? String(error) : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">AI Summary</h2>
        {displaySummary?.cached && (
          <span className="text-xs text-gray-500">Cached</span>
        )}
      </div>

      {!displaySummary && !loading && !errorMessage && (
        <button
          onClick={generateSummary}
          className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
        >
          Generate AI Summary
        </button>
      )}

      {loading && (
        <div className="py-8">
          <LoadingSpinner size="md" />
          <p className="text-center text-sm text-gray-600 mt-3">
            Analyzing discussion...
          </p>
        </div>
      )}

      {errorMessage && <ErrorMessage message={errorMessage} onRetry={generateSummary} />}

      {displaySummary && (
        <div className="space-y-4">
          {/* Sentiment badge */}
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
              sentimentColors[displaySummary.sentiment as keyof typeof sentimentColors]
            }`}
          >
            {displaySummary.sentiment.toUpperCase()}
          </div>

          {/* Summary text */}
          <p className="text-gray-800 leading-relaxed">{displaySummary.summary}</p>

          {/* Key points */}
          {displaySummary.key_points.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Key Points:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {displaySummary.key_points.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
