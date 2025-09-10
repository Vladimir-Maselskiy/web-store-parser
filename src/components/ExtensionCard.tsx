import { TExtensionRecord } from '@/types/types';
import {
  EditOutlined,
  EllipsisOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Avatar, Card, Flex, Switch } from 'antd';
import { useState } from 'react';

type TProps = {
  extension: TExtensionRecord;
};

const actions: React.ReactNode[] = [
  <EditOutlined key="edit" />,
  <SettingOutlined key="setting" />,
  <EllipsisOutlined key="ellipsis" />,
];

export const ExtensionCard = ({ extension }: TProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const { name, version, usersQty, lastUpdate, iconUrl } = extension;
  return (
    <Card loading={loading} actions={actions} style={{ minWidth: 300 }}>
      <Card.Meta
        avatar={<Avatar src={iconUrl} style={{ borderRadius: 4 }} />}
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
