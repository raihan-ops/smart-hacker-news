'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { SummaryResponse } from '@/types';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface SummaryPanelProps {
  storyId: number;
}

export default function SummaryPanel({ storyId }: SummaryPanelProps) {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.generateSummary(storyId);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const sentimentColors = {
    positive: 'text-green-700 bg-green-50 border-green-200',
    negative: 'text-red-700 bg-red-50 border-red-200',
    neutral: 'text-gray-700 bg-gray-50 border-gray-200',
    mixed: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">AI Summary</h2>
        {summary?.cached && (
          <span className="text-xs text-gray-500">Cached</span>
        )}
      </div>

      {!summary && !loading && !error && (
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

      {error && <ErrorMessage message={error} onRetry={generateSummary} />}

      {summary && (
        <div className="space-y-4">
          {/* Sentiment badge */}
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
              sentimentColors[summary.sentiment as keyof typeof sentimentColors]
            }`}
          >
            {summary.sentiment.toUpperCase()}
          </div>

          {/* Summary text */}
          <p className="text-gray-800 leading-relaxed">{summary.summary}</p>

          {/* Key points */}
          {summary.key_points.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Key Points:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {summary.key_points.map((point, index) => (
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
