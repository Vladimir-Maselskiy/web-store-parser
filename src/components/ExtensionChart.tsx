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

const formatDateLabel = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const buildLabel = (version: string, isoDate: string) =>
  `${version}|${formatDateLabel(isoDate)}`;

const renderTick = (props: any) => {
  const { x, y, payload } = props;
  if (!payload?.value) {
    return <></>;
  }

  const [version, date] = String(payload.value).split('|');

  return (
    <text
      x={x}
      y={y}
      fill="#595959"
      textAnchor="middle"
      fontSize={12}
      transform="translate(0, 8)"
    >
      <tspan x={x} dy="0">
        {version}
      </tspan>
      <tspan x={x} dy="14">
        {date}
      </tspan>
    </text>
  );
};

export const ExtensionChart = ({ extension, onClose }: TProps) => {
  const chartData: TChartPoint[] = useMemo(() => {
    if (!extension) return [];

    const historyPoints = (extension.history ?? []).map(item => ({
      version: item.version,
      usersQty: item.usersQty,
      date: item.date,
      versionLabel: buildLabel(item.version, item.date),
    }));

    const currentDateIso = new Date(extension.lastUpdate * 1000).toISOString();
    const currentPoint = {
      version: extension.version,
      usersQty: extension.usersQty,
      date: currentDateIso,
      versionLabel: buildLabel(extension.version, currentDateIso),
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

  const tooltipLabelFormatter = (value: string) => {
    const [version, date] = value.split('|');
    return `${version} - ${date}`;
  };

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
              margin={{ top: 16, right: 56, left: 16, bottom: 48 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="versionLabel"
                height={80}
                interval={0}
                tickMargin={16}
                padding={{ left: 16, right: 32 }}
                tick={renderTick}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={tooltipLabelFormatter}
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
