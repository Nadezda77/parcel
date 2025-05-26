import React, { useEffect, useState } from 'react';
import { Container, Button, Table, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { getUser, getToken, removeUserSession } from '../utils/Common';
import axios from 'axios';
import queryString from 'query-string';
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css'
import '../../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'

interface device {
  href: string;
  name: string;
  nwAddress: string;
}

function Dashboard () {
  const history = useNavigate();
  const user = getUser();
  const token = getToken();
  const [loading, setLoading] = useState(false);
  const [device, setDevice] = useState([]);
  const [error, setError] =  useState('');


  const handleLogout = () => {
   removeUserSession();
    history('/login');
  }
   // State variables
  

  // Define types for device object and response data


// const getDevices = () => {
//   setLoading(true);
  
useEffect(() => {
  setLoading(true);
 axios.get('https://iot.mts.rs/thingpark/wireless/rest/subscriptions/mine/devices',
  
  {
    headers: {
    'Authorization': `Bearer ${token}`, 
    'Accept': 'application/json',
}

 }).then(response => {    
    
    // Log the entire response to check if it's an array
    console.log('Number of devices:', response.data.briefs.length);

   
    if (Array.isArray(response.data.briefs)&& response.data.briefs.length > 0) {
      // If the response is directly an array
    setDevice(response.data.briefs);
    } else {
      setError('No devices found.');
    }

    setLoading(false); // Stop loading when the data is received
 
  })
      .catch((err) => {
        setError('Error: ' + err.message);
        setLoading(false);
      });
// };

// 
//   getDevices(); // Fetch devices when the component mounts
 }, [token]);

  return (
    <Container>
      {/* Welcome {user.client_id}!<br /><br /> */}
      <Button onClick={handleLogout} value="Logout" className="mb-3">Logout</Button><br /><br />
      {/* <Button onClick={getDevices} value="getDevices" className="mb-3">Devices</Button><br /><br /> */}
      
      {loading && <div>Loading devices...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      
      <Table>
        <thead>
          <tr>
            <th>name</th>
            <th>nwAddress</th>
            <th>href</th>
          </tr>
        </thead>
        <tbody>
          {/* Render device items only if 'device' is an array */}
          {device.length > 0 ? (
            device.map((deviceItem: device) => (
              <tr key={deviceItem.href}>
                <td>{deviceItem.name}</td>
                <td>{deviceItem.nwAddress}</td>
                <td>{deviceItem.href}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3}>No devices available</td>
            </tr>
          )}
        </tbody>
      </Table>
      <Card style={{ width: '18rem' }}>
        {/* Uncomment this if you want to show additional functionality */}
        {/* <Button onClick={handleClick} tag="h5">
              Create device
            </Button> */}
      </Card>
    </Container>
  );

}
export default Dashboard;
