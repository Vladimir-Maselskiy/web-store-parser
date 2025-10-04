import { TExtensionRecord } from '@/types/types';
import {
  CommentOutlined,
  EditOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import { Avatar, Card } from 'antd';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

type TProps = {
  extension: TExtensionRecord;
  setIsExtensionChartShowed: Dispatch<SetStateAction<boolean>>;
  setCurrentExtensionId: Dispatch<SetStateAction<string>>;
};

export const ExtensionCard = ({
  extension,
  setIsExtensionChartShowed,
  setCurrentExtensionId,
}: TProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const { name, version, usersQty, lastUpdate, iconUrl, extensionId } =
    extension;

  useEffect(() => {
    const fetchIcon = async () => {
      try {
        const res = await fetch(iconUrl);
        if (res.ok) throw new Error('Bad response');
        const blob = await res.blob();
        if (!blob.type.startsWith('image/')) throw new Error('Not an image');
        const url = URL.createObjectURL(blob);
        setImageSrc(url);
      } catch (err) {
        console.warn(
          `Icon request to ${iconUrl} failed, falling back to cached base64.`
        );
        await fetchBase64();
      }
    };

    const fetchBase64 = async () => {
      try {
        const res = await fetch(`/api/extensions/icon?id=${extensionId}`);
        if (!res.ok) {
          throw new Error(`Icon endpoint responded with ${res.status}`);
        }
        const data = await res.json();
        if (data?.base64) {
          const type = data.contentType ?? 'image/png';
          setImageSrc(`data:${type};base64,${data.base64}`);
        } else {
          setImageSrc('/placeholder.png');
        }
      } catch (err) {
        console.error('Failed to retrieve icon base64:', err);
        setImageSrc('/placeholder.png');
      }
    };

    fetchIcon();
  }, [iconUrl, extensionId]);

  const showExtenionChart = (extensionId: string) => {
    setIsExtensionChartShowed(true);
    setCurrentExtensionId(extensionId);
    console.log('extensionId', extensionId);
  };
  const actions: React.ReactNode[] = [
    <EditOutlined key={`${extensionId}-edit`} />,
    <CommentOutlined key={`${extensionId}-comment`} />,
    <LineChartOutlined
      key="chart"
      onClick={() => showExtenionChart(extensionId)}
    />,
  ];
  return (
    <Card loading={loading} actions={actions} style={{ minWidth: 300 }}>
      <Card.Meta
        avatar={
          imageSrc ? (
            <Avatar src={imageSrc} style={{ borderRadius: 4 }} />
          ) : null
        }
        title={name}
        description={
          <>
            <p>Users: {usersQty}</p>
            <p>Updated: {new Date(lastUpdate * 1000).toLocaleString()}</p>
            <p>Version: {version}</p>
          </>
        }
      />
    </Card>
  );
};
