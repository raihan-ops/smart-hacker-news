interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-sm font-medium text-red-600 hover:text-red-500"
        >
          Try again
        </button>
      )}
    </div>
  );
}
