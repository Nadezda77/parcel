import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Form, Button, Container } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { removeUserSession } from '../utils/Common';
import { useNavigate } from 'react-router-dom';

// ✅ koristi axios instance sa interceptorom (refresh)
import tpApi from '../api/tpApi'; 

interface ConnectivityPlan {
  ID: string;
  commercialName: string;
}

interface RoutingProfile {
  ID: string;
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
  appServersRoutingProfile: { ID: string };
  networkSubscription: { ID: string };
}

const NewDevice: React.FC = () => {
  const { register, handleSubmit, formState: { isSubmitSuccessful, errors } } = useForm();
  const navigate = useNavigate();

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

  const [apiError, setApiError] = useState<string | null>(null);
const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  const handleLogout = () => {
    removeUserSession();
    navigate('/login');
  };

  const onSubmit = async () => {
    setLoading(true);
    setIsError(false);

    const data: NewDeviceData = {
      name,
      EUI,
      imsi,
      model,
      connectivity,
      appServersRoutingProfile: { ID: appServersRoutingProfile },
      networkSubscription: { ID: networkSubscription },
    };

    try {
      // ✅ NEMA više domena + nema headers.Authorization
      await tpApi.post('/subscriptions/mine/devices', data);

  setApiSuccess('Device created successfully.');




  setApiError(null);

      // reset
      setName('');
      setEUI('');
      setImsi('');
      setModel('');
      setConnectivity('');
      setAppServersRoutingProfile('');
      setNetworkSubscription('');

      navigate('/dashboard');
    } catch (error: any) {
       // ✅ greška (Actility)
  const actilityMsg =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Failed to create device.';

  setApiSuccess(null);
  
  let msg = actilityMsg;

if (typeof msg === 'string' && msg.includes('IMSI number does not match any unallocated Ki')) {
  msg = 'IMSI is not valid or not allocated in ThingPark (Ki not found). Please verify IMSI with admin/operator.';
}

setApiError(msg);
  // 🔥 vrlo bitno: nema success poruke kad pukne
  setApiError(actilityMsg);
} finally {
  setLoading(false);
}
  };

  useEffect(() => {
    tpApi
      .get('/subscriptions/mine/networkSubscriptions', {
        params: { connectivity: 'CELLULAR' },
      })
      .then((res) => {
        console.log('Connectivity Plan API response:', res.data);
        if (res.data && Array.isArray(res.data.briefs)) {
          setCPlanIds(res.data.briefs);
        } else {
          console.warn('Unexpected API response structure', res.data);
          setCPlanIds([]);
        }
      })
      .catch((err: any) => {
        console.error(err);
        if (err?.response?.status === 401) handleLogout();
      });
  }, []);

  useEffect(() => {
    tpApi
      .get('/subscriptions/mine/appServersRoutingProfiles', {
        params: { type: 'CELLULAR' },
      })
      .then((res) => {
        console.log('Routing Profile API response:', res.data);
        if (res.data && Array.isArray(res.data.briefs)) {
          setRprofIds(res.data.briefs);
        } else {
          console.warn('Unexpected API response structure', res.data);
          setRprofIds([]);
        }
      })
      .catch((err: any) => {
        console.error(err);
        if (err?.response?.status === 401) handleLogout();
      });
  }, []);

  return (
    <Container style={{ maxWidth: '600px' }}>
      <div className="d-flex justify-content-end mt-3 mb-4">
        <Button variant="outline-danger" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <Form style={{ width: '22rem', margin: 'auto' }} onSubmit={handleSubmit(onSubmit)}>
       {apiSuccess && <div className="alert alert-success">{apiSuccess}</div>}
{apiError && <div className="alert alert-danger">{apiError}</div>}
        <Form.Group className="mb-3">
          <Form.Label>Name</Form.Label>
          <Form.Control
            {...register('name', { required: 'Name is required' })}
            value={name}
            onChange={(e) => setName(e.target.value)}
            isInvalid={!!errors.name}
            required
          />
        </Form.Group>



       <Form.Group className="mb-3">
  <Form.Label>EUI</Form.Label>
  <Form.Control
    {...register('EUI', {
      required: 'EUI is required',
      pattern: {
        value: /^\d{15}$/,
        message: 'EUI must be exactly 15 digits (numbers only)',
      },
    })}
    value={EUI}
    onChange={(e) => setEUI(e.target.value)}
    isInvalid={!!errors.EUI}
  />
  <Form.Control.Feedback type="invalid">
    {(errors as any)?.EUI?.message}
  </Form.Control.Feedback>
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
          <Form.Select
            value={appServersRoutingProfile}
            onChange={(e) => setAppServersRoutingProfile(e.target.value)}
            required
          >
            <option value="">Select one...</option>
            {rprofIds.map((item) => (
              <option key={item.ID} value={item.ID}>
                {item.ID}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Connectivity Plan ID</Form.Label>
          <Form.Select
            value={networkSubscription}
            onChange={(e) => setNetworkSubscription(e.target.value)}
            required
          >
            <option value="">Select one...</option>
            {cPlanIds.map((item) => (
              <option key={item.ID} value={item.ID}>
                {item.commercialName}
              </option>
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
