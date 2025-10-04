'use client';
import { ExtensionCard } from '@/components/ExtensionCard';
import { ExtensionChart } from '@/components/ExtensionChart';
import { TExtensionRecord } from '@/types/types';
import { Flex } from 'antd';
import { useEffect, useState } from 'react';

export default function Home() {
  const [extensions, setExtensions] = useState([]);
  const [isExtensionChartShowed, setIsExtensionChartShowed] = useState(false);
  const [currentExtensionId, setCurrentExtensionId] = useState('');

  useEffect(() => {
    fetch('/api/extensions')
      .then(res => res.json())
      .then(({ extensions }) => {
        setExtensions(extensions);
      });
  }, []);

  useEffect(() => {
    console.log('extensions', extensions);
  }, [extensions]);

  return (
    <Flex gap={32} wrap style={{ padding: 32, width: '100%' }}>
      {extensions.map((extension: TExtensionRecord) => {
        return (
          <ExtensionCard
            key={extension.extensionId}
            extension={extension}
            setIsExtensionChartShowed={setIsExtensionChartShowed}
            setCurrentExtensionId={setCurrentExtensionId}
          />
        );
      })}
      {isExtensionChartShowed && (
        <ExtensionChart
          setIsExtensionChartShowed={setIsExtensionChartShowed}
          currentExtensionId={currentExtensionId}
        />
      )}
    </Flex>
  );
}
