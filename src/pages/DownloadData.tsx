// src/pages/DownloadData.tsx
import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import { Button, Container, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

import tpApi from '../api/tpApi';
import { removeUserSession } from '../utils/Common';

interface Device {
  EUI: string;
  name?: string;
  nwAddress?: string;
}

const ExportCSV: React.FC = () => {
  const navigate = useNavigate();

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleLogout() {
    removeUserSession();
    navigate('/login');
  }

  const exportToCSV = (data: Device[], filename = 'devices.csv') => {
    if (!data || data.length === 0) return;

    const header = ['EUI', 'Name', 'IP Address'];
    const rows = data.map((d) => [d.EUI, d.name ?? '-', d.nwAddress ?? '-']);

    const csvContent = [header, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const fetchDeviceData = async () => {
      setLoading(true);
      setError('');
      try {
        // ✅ tpApi handles Authorization + refresh
        const res = await tpApi.get('/subscriptions/mine/devices', {
          params: { pageIndex: 0, pageSize: 1000, connectivity: 'CELLULAR' },
        });

        const list: Device[] = res.data?.briefs || [];
        setDevices(list);
      } catch (err: any) {
        if (err?.response?.status === 401) {
          removeUserSession();
          navigate('/login');
          return;
        }
        setError(err?.response?.data?.message || err.message || 'Failed to load devices');
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceData();
  }, [navigate]);

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-end mb-3">
        <Button variant="outline-danger" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <h4>Export devices</h4>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      <div className="mt-3 d-flex gap-2">
        <Button
          variant="primary"
          disabled={loading || devices.length === 0}
          onClick={() => exportToCSV(devices, 'devices.csv')}
        >
          Export CSV
        </Button>

        {loading && (
          <div className="d-flex align-items-center gap-2">
            <Spinner animation="border" size="sm" />
            <span>Loading…</span>
          </div>
        )}
      </div>

      <div className="mt-3 text-muted">
        Loaded: <strong>{devices.length}</strong> devices
      </div>
    </Container>
  );
};

export default ExportCSV;
