import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import { Form, Button, Container, Table, InputGroup, Dropdown } from 'react-bootstrap';
//import { useForm, SubmitHandler, Resolver, FieldValues } from "react-hook-form";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getAccessToken, isTokenExpired, setUserSession, removeUserSession } from '../utils/Common';
//import { CSVLink } from 'react-csv';



interface Device {
  EUI: string;
  name: string;
  nwAddress: string;
  // add more fields if needed from your device API response
}

const ExportCSV = () => {
  const fileName = "users-detail.csv";
  const [deviceData, setDeviceData] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);

  const headers = [
    { label: "EUI", key: "EUI" },
    { label: "Name", key: "name" },
    { label: "IP Address", key: "nwAddress" },
  ];

   const navigate = useNavigate();

   // Logout handler
    function handleLogout() {
     removeUserSession();
      navigate('/login');
    }

useEffect(() => {
 fetchDeviceData();
  }, []);

  const fetchDeviceData = () => {
      setLoading(true);
      const token = getAccessToken();
      
      axios.get('https://iot.mts.rs/thingpark/wireless/rest/subscriptions/mine/devices',
      {
        headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      }}
      )
          .then((res) => {
             const devices = res.data.briefs || [];
              setDeviceData(res.data);
              setLoading(false);
          })
          .catch((err) => {
              console.log("Error: ", err);
              setLoading(false);
          })
  }

  return (
      <Container>
         <Button variant="secondary" onClick={handleLogout} className="mb-3">Logout</Button><br /><br />
          <Button
              variant="primary"
             disabled={loading}
          >
              {/* <CSVLink
                  headers={headers}
                  data={deviceData}
                  filename={fileName}
                  style={{ "textDecoration": "none", "color": "#fff" }}
              >
                  {loading ? 'Loading csv...' : 'Export Data'}
              </CSVLink> */}
          </Button>

        {/* <Table headers={headers} userData={userData} /> */}
      </Container>
  );
}

export default ExportCSV;