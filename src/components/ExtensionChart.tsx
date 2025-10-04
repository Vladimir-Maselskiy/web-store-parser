'use client';
import { TExtensionRecord } from '@/types/types';
import { Modal, Typography } from 'antd';
import React, { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type TProps = {
  extension: TExtensionRecord;
  onClose: () => void;
};

type TChartPoint = {
  version: string;
  usersQty: number;
  date: string;
  versionLabel: string;
};

const { Paragraph } = Typography;

const formatLabel = (version: string, date: string) => {
  const formattedDate = new Date(date).toLocaleDateString();
  return `${version} (${formattedDate})`;
};

export const ExtensionChart = ({ extension, onClose }: TProps) => {
  const chartData: TChartPoint[] = useMemo(() => {
    if (!extension) return [];

    const historyPoints = (extension.history ?? []).map(item => ({
      version: item.version,
      usersQty: item.usersQty,
      date: item.date,
      versionLabel: formatLabel(item.version, item.date),
    }));

    const currentDate = new Date(extension.lastUpdate * 1000).toISOString();
    const currentPoint = {
      version: extension.version,
      usersQty: extension.usersQty,
      date: currentDate,
      versionLabel: formatLabel(extension.version, currentDate),
    };

    const merged = [...historyPoints, currentPoint];

    return merged
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      .reduce<TChartPoint[]>((acc, item) => {
        if (!acc.length) return [item];
        const last = acc[acc.length - 1];
        if (last.version === item.version && last.date === item.date) {
          return acc;
        }
        acc.push(item);
        return acc;
      }, []);
  }, [extension]);

  return (
    <Modal
      open
      width={720}
      title={extension.name}
      footer={null}
      onCancel={onClose}
    >
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Version changes over time with user counts.
      </Paragraph>
      {chartData.length > 0 ? (
        <div style={{ width: '100%', height: 360 }}>
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{ top: 16, right: 24, left: 0, bottom: 24 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="versionLabel"
                tick={{ fontSize: 12 }}
                height={60}
                interval={0}
                tickMargin={12}
                angle={chartData.length > 4 ? -20 : 0}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={value => value as string}
                formatter={(value: number) => [value, 'Users']}
              />
              <Line
                type="monotone"
                dataKey="usersQty"
                stroke="#1677ff"
                strokeWidth={2}
                activeDot={{ r: 6 }}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <Paragraph>No history available for this extension yet.</Paragraph>
      )}
    </Modal>
  );
};
