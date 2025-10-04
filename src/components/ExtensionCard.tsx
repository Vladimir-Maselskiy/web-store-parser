import { TExtensionRecord } from '@/types/types';
import {
  CommentOutlined,
  EditOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import { Avatar, Card, Skeleton } from 'antd';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

type TProps = {
  extension: TExtensionRecord;
  setIsExtensionChartShowed: Dispatch<SetStateAction<boolean>>;
  setCurrentExtensionId: Dispatch<SetStateAction<string>>;
};

const DEFAULT_ICON_SRC = '/favicon.png';

export const ExtensionCard = ({
  extension,
  setIsExtensionChartShowed,
  setCurrentExtensionId,
}: TProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_ICON_SRC);
  const { name, version, usersQty, lastUpdate, iconUrl, extensionId } =
    extension;

  useEffect(() => {
    let objectUrl: string | null = null;
    let isCancelled = false;

    const setLoadedImage = (src: string) => {
      if (isCancelled) return;
      setImageSrc(src);
      setIsLoading(false);
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
          setLoadedImage(`data:${type};base64,${data.base64}`);
          return;
        }
      } catch (error) {
        console.error('Failed to retrieve icon base64:', error);
      }
      setLoadedImage(DEFAULT_ICON_SRC);
    };

    const fetchIcon = async () => {
      setIsLoading(true);
      setImageSrc(DEFAULT_ICON_SRC);
      try {
        const res = await fetch(iconUrl);
        if (!res.ok) throw new Error(`Bad response: ${res.status}`);
        const blob = await res.blob();
        if (!blob.type.startsWith('image/')) {
          throw new Error(`Unexpected content type: ${blob.type}`);
        }
        objectUrl = URL.createObjectURL(blob);
        setLoadedImage(objectUrl);
      } catch (error) {
        console.warn(
          `Icon request to ${iconUrl} failed, falling back to cached base64.`,
          error
        );
        await fetchBase64();
      }
    };

    fetchIcon();

    return () => {
      isCancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
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
    <Skeleton
      loading={isLoading}
      active
      avatar
      paragraph={{ rows: 3 }}
      style={{ width: 300 }}
    >
      <Card actions={actions} style={{ minWidth: 300 }}>
        <Card.Meta
          avatar={
            imageSrc ? (
              <Avatar src={imageSrc} style={{ borderRadius: 4 }} />
            ) : (
              <Avatar src={DEFAULT_ICON_SRC} style={{ borderRadius: 4 }} />
            )
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
    </Skeleton>
  );
};
