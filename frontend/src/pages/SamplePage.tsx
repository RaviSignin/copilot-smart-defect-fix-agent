import React, { useEffect, useState } from 'react';

const SamplePage: React.FC = () => {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadSampleResponse = async () => {
      try {
        const result = await fetch('/api/sample');
        if (!result.ok) {
          throw new Error(`Request failed with status ${result.status}`);
        }

        const text = await result.text();
        setResponse(text);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load sample response';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadSampleResponse();
  }, []);

  return (
    <div>
      <h1>Sample Page</h1>
      {loading && <p>Loading backend response...</p>}
      {!loading && error && <p>Error: {error}</p>}
      {!loading && !error && <p>Backend says: {response}</p>}
    </div>
  );
};

export default SamplePage;
