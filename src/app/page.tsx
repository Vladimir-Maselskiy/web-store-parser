'use client';
import { ExtensionCard } from '@/components/ExtensionCard';
import { TExtensionRecord } from '@/types/types';
import { Flex } from 'antd';
import { useEffect, useState } from 'react';

export default function Home() {
  const [extensions, setExtensions] = useState([]);

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
        return <ExtensionCard key={extension.id} extension={extension} />;
      })}
    </Flex>
  );
}
