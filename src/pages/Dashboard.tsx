
import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Card, Spinner, Row, Col, Form  } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { getToken, removeUserSession } from '../utils/Common';
import axios from 'axios';
import { CSVLink } from 'react-csv';


interface Device {
  name: string;
  nwAddress?: string;
  EUI: string;
  appServersRoutingProfile?: {
    name: string;
  };
  networkSubscription?: {
    commercialName: string;
  };
  healthState?: string;
}


const pageSize = 1000; 

function Dashboard() {
const navigate = useNavigate();
const token = getToken();
const [rawDevices, setRawDevices] = useState<Device[]>([]);
const [devices, setDevices] = useState<Device[]>([]);
const [pageIndex, setPageIndex] = useState(0); // zero-based page index



  
const [totalCount, setTotalCount] = useState<number | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

const [searchTerm, setSearchTerm] = useState('');
const [searchIMEI, setSearchIMEI] = useState('');
const [searchIP, setSearchIP] = useState('');

const [activeFilters, setActiveFilters] = useState<{
  name?: string;
  EUI?: string;
  nwAddress?: string;
}>({});

   const fetchDevices = async (filters?: {
  name?: string;
  EUI?: string;
  nwAddress?: string;
  pageIndexOverride?: number;
}) => {
    setLoading(true);
    try {
      const res = await axios.get('https://iot.mts.rs/thingpark/wireless/rest/subscriptions/mine/devices', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        params: {
          pageIndex: filters?.pageIndexOverride ?? pageIndex,
          pageSize,
          connectivity: 'CELLULAR',
          name: filters?.name || undefined,
          devEUI: filters?.EUI || undefined,

        //nwAddress: filters?.nwAddress || undefined,
        },
      });

         let data: Device [] = res.data.briefs || [];
         setRawDevices(data);

       // Apply client-side nwAddress filtering
    if (filters?.nwAddress) {
  const trimmedIP = filters.nwAddress.trim().toLowerCase();
  data = data.filter(device =>
    device.nwAddress?.toLowerCase().includes(trimmedIP)
  );
  setTotalCount(data.length);
} else {
  setTotalCount(typeof res.data.count === 'number' ? res.data.count : null);
}

  setDevices(data);
  setTotalCount(typeof res.data.count === 'number' ? res.data.count : null);
      setError('');
   } catch (err: any) {
  if (err.response?.status === 401) {
    setError('You are not authorized. Please log in again.');
    removeUserSession(); // Clear stored token/session
    navigate('/login');  // Redirect to login page
  } else {
    setError('Error: ' + (err.response?.data?.message || err.message));
  }

  setDevices([]);
  setTotalCount(null);
} finally {
      setLoading(false);
    }
};

useEffect(() => {
  fetchDevices({
    ...activeFilters,
    pageIndexOverride: pageIndex,
  });
}, [pageIndex, activeFilters]);


useEffect(() => {
  const allEmpty = !searchTerm.trim() && !searchIMEI.trim() && !searchIP.trim();

  if (allEmpty && devices.length > 0) {
    setPageIndex(0);
    fetchDevices({ pageIndexOverride: 0 });
  }
}, [searchTerm, searchIMEI, searchIP]);

  const totalPages = totalCount !== null ? Math.ceil(totalCount / pageSize) : 0;

  const handleLogout = () => {
    removeUserSession();
    navigate('/login');
  };

  const handleViewDetails = (eui: string) => {
    navigate(`/device/${eui}`);
  };

const handleReset = () => {
  setSearchTerm('');
  setSearchIMEI('');
  setSearchIP('');
  setActiveFilters({});
  setPageIndex(0);
  fetchDevices({ pageIndexOverride: 0 });
};

   // When search button clicked, apply the filters and reset to page 0
const handleSearch = () => {
const trimmedName = searchTerm.trim();
const trimmedIP = searchIP.trim();
const trimmedIMEI = searchIMEI.trim();
const hasAnyFilter = trimmedName || trimmedIP || trimmedIMEI;
  setPageIndex(0);

   if (!hasAnyFilter) {
    // Reset view: fetch all devices (no filters)
    fetchDevices({ pageIndexOverride: 0 });
  } else {
    // Apply filters
 setActiveFilters({
  name: trimmedName || undefined,
  nwAddress: trimmedIP || undefined,
  EUI: trimmedIMEI || undefined,
});

fetchDevices({
  name: trimmedName || undefined,
  nwAddress: trimmedIP || undefined,
  EUI: trimmedIMEI || undefined,
  pageIndexOverride: 0,
});
}
};


const handleDelete = async (deviceId: string) => {
  if (!window.confirm('Are you sure you want to delete this device?')) return;

  try {
    await axios.delete(
      `https://iot.mts.rs/thingpark/wireless/rest/subscriptions/mine/devices/e${deviceId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`, // use your token variable
          'Content-Type': 'application/json'
        }
      }
    );

    // Remove device from state
    setDevices((prev) => prev.filter((d) => d.EUI !== deviceId));
    setTotalCount((prev) => (prev !== null ? prev - 1 : null));
  } catch (error: any) {
    console.error('Delete error:', error);
    alert('Failed to delete device: ' + (error.response?.data?.message || error.message));
  }
};

  return (
    <Container>
     <div className="d-flex justify-content-end mb-4">
  <Button variant="outline-danger" size="sm" onClick={handleLogout}>
    Logout
  </Button>
</div>

      {error && <div className="alert alert-danger">{error}</div>}

     

      <div className="mb-3">
        <CSVLink data={devices} filename="devices.csv" className="btn btn-success">
          Export to CSV
        </CSVLink>
      </div>

  <Row className="mb-3 align-items-center">
        <Col xs={12} md={4}>
          <div>
            <strong>Total devices:</strong> {totalCount !== null ? totalCount.toLocaleString() : '...'} &nbsp;|&nbsp; Showing {pageSize} devices per page
          </div>
        </Col>

        <Col xs={12} md={8}>
          <Row>
            <Col xs={12} md={4} className="mb-2 mb-md-0">
              <Form.Control
                type="text"
                placeholder="Search by device name..."
                value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>
            <Col xs={12} md={4} className="mb-2 mb-md-0">
              <Form.Control
                type="text"
                placeholder="Search by IMEI..."
                value={searchIMEI}
                onChange={(e) => setSearchIMEI(e.target.value)}
              />
            </Col>
            <Col xs={12} md={4}>
              <Form.Control
                type="text"
                placeholder="Search by IP address..."
                value={searchIP}
                onChange={(e) => setSearchIP(e.target.value)}
              />
            </Col>
            {/* <Col xs={12} md={3}>
              <Button onClick={handleSearch} className="w-100 mb-2"
               disabled={!searchTerm && !searchIMEI && !searchIP}
              >
                Search
              </Button>
 <Button
    variant="secondary"
    onClick={handleReset}
    className="w-100"
  >
    Reset
  </Button>


            </Col> */}
<Col xs={12} md={4} className="d-flex gap-2 mt-3 mt-md-0">
  <Button
    variant="primary"
    className="w-100"
    disabled={!searchTerm && !searchIMEI && !searchIP}
    onClick={handleSearch}
  >
    🔍 Search
  </Button>
  <Button
    variant="outline-secondary"
    className="w-100"
    onClick={handleReset}
  >
    Reset
  </Button>
</Col>


          </Row>
        </Col>
      </Row>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>IP Address</th>
            <th>IMEI</th>
             <th>App Server Profile</th>
    <th>Network Subscription</th>
    <th>Health</th>
            <th>Actions</th>
          </tr>
        </thead>

        
        <tbody>
          {!loading && devices.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center text-muted">
                No devices found.
              </td>
            </tr>
          )}

          {devices.map((device, index) => (
            <tr key={`${device.EUI}-${index}`}>
              <td>{device.name}</td>
              <td>{device.nwAddress}</td>
              <td>{`${device.EUI}`}</td>
               <td>{device.appServersRoutingProfile?.name || '-'}</td>
      <td>{device.networkSubscription?.commercialName || '-'}</td>
      <td>{device.healthState}</td>
              <td>
                {/* <Button style={{ backgroundColor: '#343a40', color: '#fff', border: 'none' }} size="sm" onClick={() => handleViewDetails(device.EUI)}>
                  View Details
                </Button>
                 <Button
          variant="danger"
          size="sm"
          onClick={() => handleDelete(device.EUI)}
        >
          Delete
        </Button> */}
         <div className="d-flex gap-2 flex-wrap">
  <Button
    variant="outline-dark"
    size="sm"
    onClick={() => handleViewDetails(device.EUI)}
  >
    View Details
  </Button>
  <Button
    variant="outline-danger"
    size="sm"
    onClick={() => handleDelete(device.EUI)}
  >
    Delete
  </Button>
</div>    
             
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {loading && (
        <div className="text-center my-3">
          <Spinner animation="border" role="status" />
          
        </div>
      )}

      {/* Pagination buttons */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center my-3 flex-wrap">
          <Button
            variant="light"
            className="me-2 mb-2"
            disabled={pageIndex === 0}
            onClick={() => setPageIndex(pageIndex - 1)}
          >
            Prev
          </Button>

          {[...Array(totalPages)].map((_, i) => (
            <Button
              key={i}
              variant={pageIndex === i ? 'primary' : 'light'}
              className="mx-1 mb-2"
              onClick={() => setPageIndex(i)}
            >
              {i + 1}
            </Button>
          ))}

          <Button
            variant="light"
            className="ms-2 mb-2"
            disabled={pageIndex === totalPages - 1}
            onClick={() => setPageIndex(pageIndex + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <Card style={{ width: '18rem' }} className="mt-3">
        {/* Optional extra content */}
      </Card>
    </Container>
  );
}


export default Dashboard;