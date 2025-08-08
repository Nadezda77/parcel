import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getToken, removeUserSession, isTokenExpired} from '../utils/Common';
import { Container, Button, Table, Card } from 'react-bootstrap';
import axios from 'axios';

const DeviceDetail = () => {
  const { deviceEUI } = useParams<{ deviceEUI: string }>();
  const [device, setDevice] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [historyError, setHistoryError] = useState('');
const navigate = useNavigate();

const handleSessionExpiry = (error: any) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    removeUserSession();
    navigate('/'); // or '/' depending on your route
  }
};

const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 100;

const paginatedHistory = history.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);


   const handleLogout = () => {
      removeUserSession();
       navigate('/login');
     }

const exportToCSV = (data: any[], filename = 'device_history.csv') => {
    if (!data || data.length === 0) return;

    const header = ['Timestamp', 'Size Up (bytes)', 'Size Down (bytes)', 'Duration (s)', 'Cell ID'];
    const rows = data.map(entry => [
      new Date(entry.timestamp).toUTCString(),
      entry.sizeUp ?? '-',
      entry.sizeDown ?? '-',
      entry.duration ?? '-',
      entry.cellID ?? '-',
    ]);

    const csvContent = [header, ...rows]
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
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
  if (!deviceEUI) return;

  const fetchDeviceHistory = async (_subscriptionId: string, ref: string, token: string) => {
    try {
      const url = `https://iot.mts.rs/thingpark/wireless/rest/subscriptions/mine/devices/${ref}/frames?duration=P10D`;
      console.log("Fetching history from URL:", url);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Session expired
          handleSessionExpiry({ response });
          return;
        }
        throw new Error(`History fetch failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("History response data:", data);
      const entries = data.frames || data.briefs || [];
      setHistory(entries);
      setHistoryError('');
    } catch (error: any) {
      console.error("Failed to fetch device history:", error);
      if (axios.isAxiosError(error)) {
        handleSessionExpiry(error);
      }
      setHistoryError(error.message || 'Failed to fetch device history');
    }
  };

  const fetchDeviceDetail = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const ref = `e${deviceEUI}`;

      if (!token || isTokenExpired()) {
        removeUserSession();
        navigate('/login');
        return;
      }

      const response = await fetch(
        `https://iot.mts.rs/thingpark/wireless/rest/subscriptions/mine/devices/${ref}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          handleSessionExpiry({ response });
          return;
        }
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data = await response.json();
      setDevice(data);
      setError('');

      // Fetch history only after device is set
      fetchDeviceHistory('mine', ref, token);
    } catch (error: any) {
      console.error("Failed to fetch device detail:", error);
      if (axios.isAxiosError(error)) {
        handleSessionExpiry(error);
      }
      setError(error.message || 'Failed to fetch device details');
    } finally {
      setLoading(false);
    }
  };

  fetchDeviceDetail();
}, [deviceEUI]);   


  const formatUTC = (timestamp: number | null | undefined) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toUTCString();
  };

  if (loading) return <div>Loading device details...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!device) return <div>No device found.</div>;

  return (
    <div className="container mt-4">
       <Button onClick={handleLogout} value="Logout" className="mb-3">Logout</Button><br /><br />
      <h3>Device Detail for IMEI {device.EUI}</h3>
      <table className="table table-bordered table-striped mt-3">
        <thead className="thead-dark">
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
      </table>

      {historyError && <div className="alert alert-warning">{historyError}</div>}

     
{history.length > 0 && (
  <div className="mt-4">
    {/* <div className="d-flex justify-content-between align-items-center mb-2">
      <h5 className="mb-0">Device History (Last 10 Days)</h5>
      <Button
        variant="outline-success"
        onClick={() => exportToCSV(paginatedHistory, 'device_history_page.csv')}
      >
        Export Page to CSV
      </Button>
    </div> */}

    <div className="mt-4 mb-2">
  <h5>Device History (Last 10 Days)</h5>
 

<div className="d-flex justify-content-end gap-2 mb-3">
  <Button
    variant="outline-success"
    onClick={() => exportToCSV(paginatedHistory, 'device_history_page.csv')}
  >
    Export Page to CSV
  </Button>
  <Button
    variant="outline-primary"
    onClick={() => exportToCSV(history, 'device_history_full.csv')}
  >
    Export All to CSV
  </Button>
</div>   
  {/* </div> */}
</div>

    <table className="table table-bordered table-hover">
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
      </tbody>
    </table>

    <div className="mt-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(prev => prev - 1)}
      >
        Previous
      </Button>{' '}
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage * itemsPerPage >= history.length}
        onClick={() => setCurrentPage(prev => prev + 1)}
      >
        Next
      </Button>
    </div>
  </div>
)}


    </div>
  );
};

console.log(require('axios'));
export default DeviceDetail;
