// src/pages/DeviceDetail.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { Container, Button, Table, Spinner } from 'react-bootstrap';

import tpApi from '../api/tpApi';
import { removeUserSession } from '../utils/Common';

type FrameEntry = {
  timestamp?: number;
  sizeUp?: number;
  sizeDown?: number;
  duration?: number;
  cellID?: string;
};

type Device = {
  name?: string;
  EUI?: string;
  imsi?: string;
  nwAddress?: string;
  firstUpTimestamp?: number;
  lastUpTimestamp?: number;
  lastMicroflowTimestamp?: number;
};

const ITEMS_PER_PAGE = 100;

const DeviceDetail: React.FC = () => {
  const { deviceEUI } = useParams<{ deviceEUI: string }>();
  const navigate = useNavigate();

  const [device, setDevice] = useState<Device | null>(null);
  const [history, setHistory] = useState<FrameEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const ref = useMemo(() => (deviceEUI ? `e${deviceEUI}` : ''), [deviceEUI]);

  const handleLogout = () => {
    removeUserSession();
    navigate('/login');
  };

  const formatUTC = (timestamp: number | null | undefined) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toUTCString();
  };

  const exportToCSV = (data: FrameEntry[], filename = 'device_history.csv') => {
    if (!data || data.length === 0) return;

    const header = ['Timestamp', 'Size Up (bytes)', 'Size Down (bytes)', 'Duration (s)', 'Cell ID'];
    const rows = data.map((entry) => [
      entry.timestamp ? new Date(entry.timestamp).toUTCString() : '-',
      entry.sizeUp ?? '-',
      entry.sizeDown ?? '-',
      entry.duration ?? '-',
      entry.cellID ?? '-',
    ]);

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

  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return history.slice(start, start + ITEMS_PER_PAGE);
  }, [history, currentPage]);

  useEffect(() => {
    if (!ref) return;

    const fetchDeviceDetail = async () => {
      setLoading(true);
      setError('');
      try {
        // ✅ tpApi will attach Bearer token AND refresh if needed
        const resp = await tpApi.get(`/subscriptions/mine/devices/${ref}`);
        setDevice(resp.data);
      } catch (err: any) {
        if (err?.response?.status === 401) {
          removeUserSession();
          navigate('/login');
          return;
        }
        setError(err?.response?.data?.message || err.message || 'Failed to fetch device details');
      } finally {
        setLoading(false);
      }
    };

    const fetchHistory = async () => {
      setHistoryLoading(true);
      setHistoryError('');
      try {
        // ✅ duration=P10D as you had
        const resp = await tpApi.get(`/subscriptions/mine/devices/${ref}/frames`, {
          params: { duration: 'P10D' },
        });

        const entries: FrameEntry[] = resp.data?.frames || resp.data?.briefs || [];
        setHistory(entries);
        setCurrentPage(1);
      } catch (err: any) {
        if (err?.response?.status === 401) {
          removeUserSession();
          navigate('/login');
          return;
        }
        setHistoryError(err?.response?.data?.message || err.message || 'Failed to fetch history');
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchDeviceDetail();
    fetchHistory();
  }, [ref, navigate]);

  if (loading) {
    return (
      <Container className="mt-4">
        <Spinner animation="border" role="status" />
        <span className="ms-2">Loading device details...</span>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <div className="d-flex justify-content-end mb-3">
          <Button variant="outline-danger" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        <div className="alert alert-danger">{error}</div>
      </Container>
    );
  }

  if (!device) {
    return (
      <Container className="mt-4">
        <div className="d-flex justify-content-end mb-3">
          <Button variant="outline-danger" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        <div>No device found.</div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-end mb-3">
        <Button variant="outline-danger" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <h3>Device Detail for IMEI {device.EUI || deviceEUI}</h3>

      <Table bordered striped className="mt-3">
        <thead>
          <tr>
            <th>Name</th>
            <th>IMEI</th>
            <th>IMSI</th>
            <th>IP Address</th>
            <th>First Session creation (UTC)</th>
            <th>Last Session creation (UTC)</th>
            <th>Last Microflow Timestamp</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{device.name || '-'}</td>
            <td>{device.EUI || '-'}</td>
            <td>{device.imsi || '-'}</td>
            <td>{device.nwAddress || '-'}</td>
            <td>{formatUTC(device.firstUpTimestamp)}</td>
            <td>{formatUTC(device.lastUpTimestamp)}</td>
            <td>{formatUTC(device.lastMicroflowTimestamp)}</td>
          </tr>
        </tbody>
      </Table>

      {historyError && <div className="alert alert-warning">{historyError}</div>}

      <div className="mt-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
        <h5 className="m-0">Device History (Last 10 Days)</h5>

        <div className="d-flex gap-2">
          <Button
            variant="outline-success"
            onClick={() => exportToCSV(paginatedHistory, 'device_history_page.csv')}
            disabled={history.length === 0}
          >
            Export Page
          </Button>
          <Button
            variant="outline-primary"
            onClick={() => exportToCSV(history, 'device_history_full.csv')}
            disabled={history.length === 0}
          >
            Export All
          </Button>
        </div>
      </div>

      {historyLoading ? (
        <div className="mt-3">
          <Spinner animation="border" role="status" />
          <span className="ms-2">Loading history...</span>
        </div>
      ) : (
        <>
          <Table bordered hover className="mt-3">
            <thead className="table-light">
              <tr>
                <th>Timestamp</th>
                <th>Size Up (bytes)</th>
                <th>Size Down (bytes)</th>
                <th>Duration (s)</th>
                <th>Cell ID</th>
              </tr>
            </thead>
            <tbody>
              {paginatedHistory.map((entry, idx) => (
                <tr key={idx}>
                  <td>{formatUTC(entry.timestamp)}</td>
                  <td>{entry.sizeUp ?? '-'}</td>
                  <td>{entry.sizeDown ?? '-'}</td>
                  <td>{entry.duration ?? '-'}</td>
                  <td>{entry.cellID ?? '-'}</td>
                </tr>
              ))}

              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted">
                    No history found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          <div className="mt-2 d-flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage * ITEMS_PER_PAGE >= history.length}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </Container>
  );
};

export default DeviceDetail;
