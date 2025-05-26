import React, { useEffect, useState } from 'react';
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import { Form, Button, Container, Table, InputGroup, Dropdown } from 'react-bootstrap';
import { useForm, SubmitHandler, Resolver, FieldValues } from "react-hook-form";
import axios from 'axios';
import { useNavigate } from 'react-router';
import { getUser, getToken, removeUserSession, setUserSession } from '../utils/Common';

import { useCSVReader, formatFileSize } from "react-papaparse";
import fs from 'fs';
import Papa from 'papaparse';


import { CSVLink } from 'react-csv';

const ExportCSV = () => {
  const fileName = "users-detail";
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(false);

  const headers = [
      { label: "Id", key: "id" },
      { label: "Name", key: "name" },
      { label: "Email", key: "email" },
      { label: "Phone", key: "phone" }
  ];

   const history = useNavigate();
   // Logout handler
    function handleLogout() {
     removeUserSession();
      history('/login');
    }

useEffect(() => {
getUserData();
  }, []);

  const getUserData = () => {
      setLoading(true);
      const token = getToken();
      
      axios.get('https://iot.mts.rs/thingpark/wireless/rest/subscriptions/mine/devices',
      {
        headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
          withCredentials: false,
      }
      )
          .then((res) => {
              setUserData(res.data);
              setLoading(false);
          })
          .catch((err) => {
              console.log("Error: ", err);
              setLoading(false);
          })
  }

  return (
      <Container>
         <Button onClick={handleLogout}>Logout</Button><br /><br />
          <Button
              variant="contained"
              color="primary"
              className='export-btn'
          >
              <CSVLink
                  headers={headers}
                  data={userData}
                  filename={fileName}
                  style={{ "textDecoration": "none", "color": "#fff" }}
              >
                  {loading ? 'Loading csv...' : 'Export Data'}
              </CSVLink>
          </Button>

        {/* <Table headers={headers} userData={userData} /> */}
      </Container>
  );
}

export default ExportCSV;