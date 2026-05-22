import { Row, Col, DatePicker, Switch, Button, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

export default function DateRangeFilter({ params, onChange, onRefresh, loading }) {
  const handleRangeChange = (dates) => {
    if (dates) {
      onChange({
        ...params,
        since: dates[0].format('YYYY-MM-DD'),
        until: dates[1].format('YYYY-MM-DD'),
      });
    } else {
      const next = { ...params };
      delete next.since;
      delete next.until;
      onChange(next);
    }
  };

  const handleOfflineChange = (checked) => {
    onChange({ ...params, offline: checked });
  };

  const rangeValue = params.since && params.until
    ? [dayjs(params.since), dayjs(params.until)]
    : null;

  return (
    <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
      <Col>
        <Space>
          <DatePicker.RangePicker
            value={rangeValue}
            onChange={handleRangeChange}
            format="YYYY-MM-DD"
            allowClear
            placeholder={['起始日期', '截止日期']}
          />
          <span>离线模式:</span>
          <Switch
            size="small"
            checked={params.offline || false}
            onChange={handleOfflineChange}
          />
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={loading}
          >
            刷新
          </Button>
        </Space>
      </Col>
    </Row>
  );
}
