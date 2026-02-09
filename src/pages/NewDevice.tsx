import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Form, Button, Container } from 'react-bootstrap';
import { useForm } from "react-hook-form";
import axios from 'axios';
import { getAccessToken, removeUserSession } from '../utils/Common';
import { useNavigate } from 'react-router-dom';


interface ConnectivityPlan {
  ID: string;
  commercialName: string;
}

interface RoutingProfile {
  ID: string;  // note uppercase ID as in the response
  name: string;
  type: string;
  isDefault: boolean;
  href: string;

}

interface NewDeviceData {
  name: string;
  EUI: string;
  imsi: string;
  model: string;
  
  connectivity: string;
  appServersRoutingProfile: {
    ID: string;
    
  };
  networkSubscription: {
    ID: string;
  };
}

const NewDevice: React.FC = () => {
  const { register, handleSubmit, formState: { isSubmitSuccessful, errors } } = useForm();
const navigate = useNavigate();
  const token = getAccessToken();

  const [name, setName] = useState('');
  const [EUI, setEUI] = useState('');
  const [imsi, setImsi] = useState('');
  const [model, setModel] = useState('');
  
  const [connectivity, setConnectivity] = useState('');
  const [appServersRoutingProfile, setAppServersRoutingProfile] = useState('');
  const [networkSubscription, setNetworkSubscription] = useState('');

  const [cPlanIds, setCPlanIds] = useState<ConnectivityPlan[]>([]);
  const [rprofIds, setRprofIds] = useState<RoutingProfile[]>([]);

  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleLogout = () => {
   removeUserSession();
    navigate('/login');
  }

  const onSubmit = async () => {
    setLoading(true);
    setIsError(false);

  

  
    const data: NewDeviceData = {
      name,
      EUI,
      imsi,
      model,
     
      connectivity,
      appServersRoutingProfile: {
        ID: appServersRoutingProfile
      },
      networkSubscription: {
        ID: networkSubscription
      }
    };

    try {
      const response = await axios.post(
        "https://iot.mts.rs/thingpark/wireless/rest/subscriptions/mine/devices",
        data,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      console.log(response.data);

      //reset(); 
      setName('');
      setEUI('');
      setImsi('');
      setModel('');
     
      setConnectivity('');
      setAppServersRoutingProfile('');
      setNetworkSubscription('');
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    axios.get("https://iot.mts.rs/thingpark/wireless/rest/subscriptions/mine/networkSubscriptions?connectivity=CELLULAR", {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }).then(res => {
      //setCPlanIds(res.data))
      console.log("Connectivity Plan API response:", res.data);
      if (res.data && Array.isArray(res.data.briefs)) {
        setCPlanIds(res.data.briefs);
      } else {
        console.warn("Unexpected API response structure", res.data);
        setRprofIds([]);
      }

    }).catch(console.error);
  }, [token]);

  useEffect(() => {
    axios.get("https://iot.mts.rs/thingpark/wireless/rest/subscriptions/mine/appServersRoutingProfiles?type=CELLULAR", {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }).then(res => {
      console.log("Routing Profile API response:", res.data);
      if (res.data && Array.isArray(res.data.briefs)) {
        setRprofIds(res.data.briefs);
      } else {
        console.warn("Unexpected API response structure", res.data);
        setRprofIds([]);
      }
    }).catch(console.error);
  }, [token]);

  return (
<Container style={{ maxWidth: '600px' }}>
 <div className="d-flex justify-content-end mt-3 mb-4">
<Button variant="outline-danger" size="sm" onClick={handleLogout}  >Logout</Button><br /><br />
   </div>
    <Form style={{ width: '22rem', margin: 'auto' }} onSubmit={handleSubmit(onSubmit)}>
      {isSubmitSuccessful && <div className="alert alert-success"> Device created successfully.</div>}
      {isError && <div className="alert alert-danger">Failed to create device.</div>}

      <Form.Group className="mb-3">
        <Form.Label>Name</Form.Label>
        <Form.Control {...register('name', { required: 'Name is required' })} value={name} onChange={(e) => setName(e.target.value)} isInvalid={!!errors.name} required />
      
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>EUI</Form.Label>
        <Form.Control 
         {...register('EUI', {
      required: 'EUI is required',
      pattern: {
        value: /^[0-9A-Fa-f]{14}$/,
        message: 'EUI must be a 14-digit string'
      }
    })}
        value={EUI} onChange={(e) => setEUI(e.target.value)} required />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>IMSI</Form.Label>
        <Form.Control value={imsi} onChange={(e) => setImsi(e.target.value)} required />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Device Profile ID</Form.Label>
        <Form.Select value={model} onChange={(e) => setModel(e.target.value)} required>
          <option value="">Select one...</option>
          <option value="CUSTOM/Cellular_Generic">default</option>
        </Form.Select>
      </Form.Group>

     
      <Form.Group className="mb-3">
        <Form.Label>Connectivity</Form.Label>
        <Form.Select value={connectivity} onChange={(e) => setConnectivity(e.target.value)} required>
          <option value="">Select one...</option>
          <option value="CELLULAR">CELLULAR</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Routing Profile ID</Form.Label>
        <Form.Select value={appServersRoutingProfile} onChange={(e) => setAppServersRoutingProfile(e.target.value)} required>
          <option value="">Select one...</option>
          {rprofIds.map((item) => (
            <option key={item.ID} value={item.ID}>{item.ID}</option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Connectivity Plan ID</Form.Label>
        <Form.Select value={networkSubscription} onChange={(e) => setNetworkSubscription(e.target.value)} required>
          <option value="">Select one...</option>
          {cPlanIds.map((item) => (
            <option key={item.ID} value={item.ID}>{item.commercialName}</option>
          ))}
        </Form.Select>

        
      </Form.Group>

      <Button variant="primary" type="submit" disabled={loading} className="w-100">
        {loading ? 'Creating Device...' : 'Create Device'}
      </Button>
    </Form>
    </Container>
    
  );
};

export default NewDevice;
