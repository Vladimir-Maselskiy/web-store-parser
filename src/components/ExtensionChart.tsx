'use client';
import { TExtensionRecord } from '@/types/types';
import { Avatar, Modal, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Brush,
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

type TickRendererProps = {
  x: number;
  y: number;
  payload: {
    value: string | number;
  };
};

type BrushRange = {
  startIndex?: number;
  endIndex?: number;
};

const { Paragraph } = Typography;
const DEFAULT_ICON_SRC = '/placeholder.png';

const formatDateLabel = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const buildLabel = (version: string, isoDate: string) =>
  `${version}|${formatDateLabel(isoDate)}`;

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
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
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

  const [iconSrc, setIconSrc] = useState<string>(DEFAULT_ICON_SRC);
  const [brushRange, setBrushRange] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;
    let objectUrl: string | null = null;

    const setLoadedIcon = (src: string) => {
      if (!isCancelled) {
        setIconSrc(src);
      }
    };

    const fetchBase64 = async () => {
      try {
        const res = await fetch(`/api/extensions/icon?id=${extension.extensionId}`);
        if (!res.ok) throw new Error(`Icon endpoint responded with ${res.status}`);
        const data = await res.json();
        if (data?.base64) {
          const type = data.contentType ?? 'image/png';
          setLoadedIcon(`data:${type};base64,${data.base64}`);
          return;
        }
      } catch (error) {
        console.error('Failed to retrieve icon base64 for chart modal:', error);
      }
      setLoadedIcon(DEFAULT_ICON_SRC);
    };

    const fetchIcon = async () => {
      setLoadedIcon(DEFAULT_ICON_SRC);
      try {
        const res = await fetch(extension.iconUrl);
        if (!res.ok) throw new Error(`Bad response: ${res.status}`);
        const blob = await res.blob();
        if (!blob.type.startsWith('image/')) {
          throw new Error(`Unexpected content type: ${blob.type}`);
        }
        objectUrl = URL.createObjectURL(blob);
        setLoadedIcon(objectUrl);
      } catch (error) {
        console.warn(
          `Icon request to ${extension.iconUrl} failed inside chart modal, falling back to cached base64.`,
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
  }, [extension.extensionId, extension.iconUrl]);

  useEffect(() => {
    if (!chartData.length) {
      setBrushRange(null);
      return;
    }

    setBrushRange(prev => {
      if (!prev) return prev;
      const maxIndex = chartData.length - 1;
      const nextStart = Math.max(0, Math.min(prev[0], maxIndex));
      const nextEnd = Math.max(nextStart, Math.min(prev[1], maxIndex));
      if (nextStart === prev[0] && nextEnd === prev[1]) {
        return prev;
      }
      return [nextStart, nextEnd];
    });
  }, [chartData]);

  const visibleData = useMemo(() => {
    if (!chartData.length) return [];
    if (!brushRange) return chartData;
    const [start, end] = brushRange;
    const maxIndex = chartData.length - 1;
    const clampedStart = Math.max(0, Math.min(start, maxIndex));
    const clampedEnd = Math.max(clampedStart, Math.min(end, maxIndex));
    return chartData.slice(clampedStart, clampedEnd + 1);
  }, [chartData, brushRange]);

  const lastVisiblePoint = visibleData[visibleData.length - 1] ?? null;

  const renderLastTick = useCallback(
    ({ x, y, payload }: TickRendererProps): React.JSX.Element => {
      if (
        payload?.value === undefined ||
        payload?.value === null ||
        !lastVisiblePoint
      ) {
        return <g />;
      }

      const value = String(payload.value);
      if (value !== lastVisiblePoint.versionLabel) {
        return <g />;
      }

      const [version, date] = value.split('|');

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
    },
    [lastVisiblePoint]
  );

  const handleBrushChange = useCallback((range: BrushRange | null) => {
    if (!range || range.startIndex === undefined || range.endIndex === undefined) {
      setBrushRange(null);
      return;
    }

    const nextRange: [number, number] = [
      Math.max(0, range.startIndex),
      Math.max(range.startIndex, range.endIndex),
    ];
    setBrushRange(nextRange);
  }, []);

  const tooltipLabelFormatter = (value: string) => {
    const [version, date] = value.split('|');
    return `${version} - ${date}`;
  };

  const tickValues = lastVisiblePoint ? [lastVisiblePoint.versionLabel] : undefined;

  const modalTitle = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Avatar src={iconSrc} size={32} style={{ borderRadius: 4 }} />
      <span>{extension.name}</span>
    </div>
  );

  return (
    <Modal
      open
      width={720}
      title={modalTitle}
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
                height={60}
                interval={0}
                tickMargin={12}
                padding={{ left: 16, right: 32 }}
                tick={renderLastTick}
                tickLine={false}
                ticks={tickValues}
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
                data={visibleData}
              />
              <Brush
                dataKey="versionLabel"
                height={28}
                travellerWidth={10}
                startIndex={brushRange?.[0] ?? 0}
                endIndex={brushRange?.[1] ?? Math.max(chartData.length - 1, 0)}
                tickFormatter={value => String(value).split('|')[0]}
                onChange={handleBrushChange}
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
