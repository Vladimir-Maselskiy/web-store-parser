'use client';
import { ExtensionCard } from '@/components/ExtensionCard';
import { ExtensionChart } from '@/components/ExtensionChart';
import { TExtensionRecord } from '@/types/types';
import { Flex } from 'antd';
import { useEffect, useState } from 'react';

export default function Home() {
  const [extensions, setExtensions] = useState<TExtensionRecord[]>([]);
  const [isExtensionChartShowed, setIsExtensionChartShowed] = useState(false);
  const [currentExtension, setCurrentExtension] =
    useState<TExtensionRecord | null>(null);

  useEffect(() => {
    fetch('/api/extensions')
      .then(res => res.json())
      .then(({ extensions }) => {
        setExtensions(extensions);
      });
  }, []);

  const handleShowChart = (extension: TExtensionRecord) => {
    setCurrentExtension(extension);
    setIsExtensionChartShowed(true);
  };

  const handleCloseChart = () => {
    setIsExtensionChartShowed(false);
    setCurrentExtension(null);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 16,
        padding: 32,
        width: '100%',
      }}
    >
      {/* <Flex justify="center" gap={32} wrap style={{ padding: 32, width: '100%' }}> */}
      {extensions.map(extension => {
        return (
          <ExtensionCard
            key={extension.extensionId}
            extension={extension}
            onShowChart={handleShowChart}
          />
        );
      })}
      {isExtensionChartShowed && currentExtension && (
        <ExtensionChart
          extension={currentExtension}
          onClose={handleCloseChart}
        />
      )}
    </div>
  );
}
